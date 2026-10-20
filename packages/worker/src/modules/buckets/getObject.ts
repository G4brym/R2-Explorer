import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

type ParsedRange =
	| { kind: "ignore" }
	| { kind: "unsatisfiable" }
	| { kind: "range"; start: number; end: number };

/**
 * Parse a single `Range` header value against a known object size.
 *
 * Returns `{ kind: "ignore" }` when the header is absent, malformed, uses a
 * non-bytes unit, or requests multiple ranges (multi-range responses are
 * intentionally not supported per RFC 9110, so the full object is served).
 * Returns `{ kind: "unsatisfiable" }` when the range cannot be satisfied
 * (`start >= total`, or a zero-length suffix such as `bytes=-0`).
 *
 * Suffix-range choice (RFC 9110 section 14.1.2): when the suffix length
 * exceeds the representation size, the entire representation is used, so
 * `bytes=-N` with `N >= total` becomes a 206 over `0-(total - 1)`. A zero
 * suffix selects zero bytes, which is unsatisfiable, so it becomes a 416.
 */
function parseRangeHeader(
	header: string | null | undefined,
	total: number,
): ParsedRange {
	if (!header) {
		return { kind: "ignore" };
	}
	const match = header.trim().match(/^([a-zA-Z]+)\s*=\s*(.+)$/);
	if (match?.[1].toLowerCase() !== "bytes") {
		return { kind: "ignore" };
	}
	const rangeSet = match[2].trim();
	// Multiple ranges are not supported; serve the full object instead.
	if (rangeSet.includes(",")) {
		return { kind: "ignore" };
	}
	const spec = rangeSet.match(/^(\d*)-(\d*)$/);
	if (!spec) {
		return { kind: "ignore" };
	}
	const [, startText, endText] = spec;
	if (startText === "" && endText === "") {
		return { kind: "ignore" };
	}
	if (startText === "") {
		// Suffix range: the last N bytes.
		const suffix = Number(endText);
		if (suffix === 0) {
			return { kind: "unsatisfiable" };
		}
		if (suffix >= total) {
			return { kind: "range", start: 0, end: total - 1 };
		}
		return { kind: "range", start: total - suffix, end: total - 1 };
	}
	const start = Number(startText);
	if (start >= total) {
		return { kind: "unsatisfiable" };
	}
	if (endText === "") {
		// Open-ended range: from start to the end of the object.
		return { kind: "range", start, end: total - 1 };
	}
	const end = Number(endText);
	if (end < start) {
		// An end before the start is malformed; serve the full object.
		return { kind: "ignore" };
	}
	return { kind: "range", start, end: Math.min(end, total - 1) };
}

function setDownloadHeaders(
	headers: Headers,
	object: R2Object,
	filePath: string,
) {
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("accept-ranges", "bytes");
	const fileName = filePath.split("/").pop() || "download";
	const asciiFileName = fileName
		.replace(/[^\x20-\x7E]/g, "_")
		.replace(/"/g, "'");
	headers.set(
		"Content-Disposition",
		`attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
	);
}

export class GetObject extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-object",
		tags: ["Buckets"],
		summary: "Get Object",
		request: {
			params: z.object({
				bucket: z.string(),
				key: z.string().describe("base64 encoded file key"),
			}),
		},
		responses: {
			"200": {
				description: "File binary",
				schema: z.string().openapi({ format: "binary" }),
			},
			"206": {
				description: "Partial file binary for a satisfiable Range request",
				schema: z.string().openapi({ format: "binary" }),
			},
			"416": {
				description: "Range Not Satisfiable",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucketName = data.params.bucket;
		const bucket = c.env[bucketName] as R2Bucket | undefined;

		if (!bucket) {
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}

		let filePath;
		try {
			filePath = decodeURIComponent(escape(atob(data.params.key)));
		} catch {
			try {
				filePath = decodeURIComponent(
					escape(atob(decodeURIComponent(data.params.key))),
				);
			} catch {
				filePath = escape(atob(decodeURIComponent(data.params.key)));
			}
		}

		const rangeHeader = c.req.header("range");

		// Without a Range header, keep the original single-R2-operation path.
		if (!rangeHeader) {
			const object = await bucket.get(filePath);

			if (object === null) {
				return Response.json({ msg: "Object Not Found" }, { status: 404 });
			}

			const headers = new Headers();
			setDownloadHeaders(headers, object, filePath);
			headers.set("content-length", object.size.toString());

			return new Response(object.body, {
				headers,
			});
		}

		// Check existence before parsing the range so that range handling
		// cannot leak information about missing objects.
		const head = await bucket.head(filePath);

		if (head === null) {
			return Response.json({ msg: "Object Not Found" }, { status: 404 });
		}

		const total = head.size;
		const parsed = parseRangeHeader(rangeHeader, total);

		if (parsed.kind === "ignore") {
			const object = await bucket.get(filePath);

			if (object === null) {
				return Response.json({ msg: "Object Not Found" }, { status: 404 });
			}

			const headers = new Headers();
			setDownloadHeaders(headers, object, filePath);
			headers.set("content-length", object.size.toString());

			return new Response(object.body, {
				headers,
			});
		}

		// An empty object has no satisfiable byte range (a suffix range would
		// select zero bytes), so any parseable range on it is unsatisfiable.
		if (parsed.kind === "unsatisfiable" || total === 0) {
			const headers = new Headers();
			headers.set("accept-ranges", "bytes");
			headers.set("content-range", `bytes */${total}`);
			headers.set("content-length", "0");
			return new Response(null, { status: 416, headers });
		}

		const { start, end } = parsed;
		const length = end - start + 1;
		const object = await bucket.get(filePath, {
			range: { offset: start, length },
		});

		if (object === null) {
			return Response.json({ msg: "Object Not Found" }, { status: 404 });
		}

		const headers = new Headers();
		setDownloadHeaders(headers, object, filePath);
		headers.set("content-range", `bytes ${start}-${end}/${total}`);
		headers.set("content-length", length.toString());
		// A compressing proxy would break the byte offsets and Content-Length.
		// `identity` marks an uncoded body; wrangler dev ignores `no-transform`
		// alone and would gzip the partial body. A coding stored on the object
		// is kept, since the bytes are that coding's representation.
		if (!headers.has("content-encoding")) {
			headers.set("content-encoding", "identity");
		}
		const cacheControl = headers.get("cache-control");
		headers.set(
			"cache-control",
			cacheControl ? `${cacheControl}, no-transform` : "no-transform",
		);

		return new Response(object.body, {
			status: 206,
			headers,
		});
	}
}
