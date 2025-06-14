import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class HeadObject extends OpenAPIRoute {
	schema = {
		operationId: "Head-bucket-object",
		tags: ["Buckets"],
		summary: "Get Object",
		request: {
			params: z.object({
				bucket: z.string(),
				key: z.string().describe("base64 encoded file key"),
			}),
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
		} catch (e) {
			filePath = decodeURIComponent(
				escape(atob(decodeURIComponent(data.params.key))),
			);
		}

		const objectMeta = await bucket.head(filePath);

		if (objectMeta === null) {
			// Return a Response object for 404, consistent with Hono best practices
			throw new HTTPException(404, { message: "Object Not Found" });
		}

		// For HEAD requests, return a new Response with no body, but with headers from the R2ObjectMeta
		const responseHeaders = new Headers();
		responseHeaders.set("Accept-Ranges", "bytes"); // Common for R2
		responseHeaders.set("ETag", objectMeta.httpEtag);
		if (objectMeta.httpMetadata?.contentType) {
			responseHeaders.set("Content-Type", objectMeta.httpMetadata.contentType);
		}
		if (objectMeta.httpMetadata?.cacheControl) {
			responseHeaders.set(
				"Cache-Control",
				objectMeta.httpMetadata.cacheControl,
			);
		}
		if (objectMeta.httpMetadata?.contentDisposition) {
			responseHeaders.set(
				"Content-Disposition",
				objectMeta.httpMetadata.contentDisposition,
			);
		}
		if (objectMeta.httpMetadata?.contentEncoding) {
			responseHeaders.set(
				"Content-Encoding",
				objectMeta.httpMetadata.contentEncoding,
			);
		}
		if (objectMeta.httpMetadata?.contentLanguage) {
			responseHeaders.set(
				"Content-Language",
				objectMeta.httpMetadata.contentLanguage,
			);
		}
		// Crucially, add Content-Length
		responseHeaders.set("Content-Length", objectMeta.size.toString());
		// Copy custom metadata too if desired, prefixed with x-amz-meta- or similar,
		// though this is not standard for HEAD unless specifically implemented.
		// For now, let's stick to standard HTTP headers derived from R2ObjectMeta.

		return c.newResponse(null, { status: 200, headers: responseHeaders });
	}
}
