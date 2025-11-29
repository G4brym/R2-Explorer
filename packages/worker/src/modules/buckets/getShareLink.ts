import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class GetShareLink extends OpenAPIRoute {
	schema = {
		operationId: "get-share-link",
		tags: ["Sharing"],
		summary: "Access shared file",
		security: [], // Public endpoint - no auth required
		request: {
			params: z.object({
				shareId: z.string().describe("10-character share ID"),
			}),
			query: z.object({
				password: z
					.string()
					.optional()
					.describe("Password for protected shares"),
			}),
		},
		responses: {
			"200": {
				description: "File retrieved successfully",
			},
			"401": {
				description: "Password required or incorrect",
			},
			"404": {
				description: "Share link not found",
			},
			"410": {
				description: "Share link expired",
			},
			"403": {
				description: "Download limit reached",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const shareId = data.params.shareId;

		// Search all buckets for the share metadata
		let shareMetadata: any = null;
		let bucket: R2Bucket | null = null;

		for (const key in c.env) {
			if (key === "ASSETS") continue;

			const currentBucket = c.env[key] as R2Bucket;
			if (!currentBucket.get || typeof currentBucket.get !== "function") {
				continue;
			}

			const shareObject = await currentBucket.get(
				`.r2-explorer/sharable-links/${shareId}.json`,
			);

			if (shareObject) {
				shareMetadata = JSON.parse(await shareObject.text());
				bucket = currentBucket;
				break;
			}
		}

		if (!shareMetadata || !bucket) {
			throw new HTTPException(404, {
				message: "Share link not found",
			});
		}

		// Check expiration
		if (shareMetadata.expiresAt && Date.now() > shareMetadata.expiresAt) {
			throw new HTTPException(410, {
				message: "Share link expired",
			});
		}

		// Check download limit
		if (
			shareMetadata.maxDownloads &&
			shareMetadata.currentDownloads >= shareMetadata.maxDownloads
		) {
			throw new HTTPException(403, {
				message: "Download limit reached",
			});
		}

		// Validate password if required
		if (shareMetadata.passwordHash) {
			if (!data.query.password) {
				throw new HTTPException(401, {
					message: "Password required",
				});
			}

			const encoder = new TextEncoder();
			const passwordData = encoder.encode(data.query.password);
			const hashBuffer = await crypto.subtle.digest("SHA-256", passwordData);
			const providedHash = Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			if (providedHash !== shareMetadata.passwordHash) {
				throw new HTTPException(401, {
					message: "Incorrect password",
				});
			}
		}

		// Increment download counter
		shareMetadata.currentDownloads++;
		await bucket.put(
			`.r2-explorer/sharable-links/${shareId}.json`,
			JSON.stringify(shareMetadata),
			{
				httpMetadata: { contentType: "application/json" },
				customMetadata: {
					targetBucket: shareMetadata.bucket,
					targetKey: shareMetadata.key,
				},
			},
		);

		// Get the actual file
		const file = await bucket.get(shareMetadata.key);

		if (!file) {
			throw new HTTPException(404, {
				message: "Shared file not found",
			});
		}

		// Return the file with proper headers
		const headers = new Headers();
		file.writeHttpMetadata(headers);
		headers.set("etag", file.httpEtag);

		// Add content disposition for download
		const fileName = shareMetadata.key.split("/").pop() || "download";
		headers.set(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(fileName)}"`,
		);

		return new Response(file.body, {
			headers,
		});
	}
}
