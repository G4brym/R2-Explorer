import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";
import { detectDocumentType } from "../../foundation/middlewares/autoCategorization";

export class PutObject extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-upload-object",
		tags: ["Buckets"],
		summary: "Upload object",
		request: {
			body: {
				content: {
					"application/octet-stream": {
						schema: z.object({}).openapi({
							type: "string",
							format: "binary",
						}),
					},
				},
			},
			params: z.object({
				bucket: z.string(),
			}),
			query: z.object({
				key: z.string().describe("base64 encoded file key"),
				customMetadata: z
					.string()
					.nullable()
					.optional()
					.describe("base64 encoded json string"),
				httpMetadata: z
					.string()
					.nullable()
					.optional()
					.describe("base64 encoded json string"),
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

		let key = decodeURIComponent(escape(atob(data.query.key)));

		// SpendRule: Ensure health group prefix for non-admin users
		const userHealthGroup = c.get("user_health_group");
		if (userHealthGroup && userHealthGroup !== "admin") {
			// If key doesn't start with health group, prepend it
			if (!key.startsWith(`${userHealthGroup}/`)) {
				// Extract just the filename
				const filename = key.split("/").pop() || key;
				// Detect document type from filename
				const documentType = detectDocumentType(filename);
				// Create correct path: health_group/category/filename
				key = `${userHealthGroup}/${documentType}/${filename}`;
			}
		}

		// SpendRule: Check if auto-categorization suggested a different path
		const suggestedPath = c.get("suggested_path");
		if (suggestedPath && suggestedPath !== key) {
			// Use the suggested path instead
			key = suggestedPath;
		}

		let customMetadata = undefined;
		if (data.query.customMetadata) {
			customMetadata = JSON.parse(
				decodeURIComponent(escape(atob(data.query.customMetadata))),
			);
		}

		let httpMetadata = undefined;
		if (data.query.httpMetadata) {
			httpMetadata = JSON.parse(
				decodeURIComponent(escape(atob(data.query.httpMetadata))),
			);
		}

		// SpendRule: Add document metadata
		const documentMetadata = c.get("document_metadata");
		if (documentMetadata) {
			// Get file size from Content-Length header (avoids loading entire file into memory)
			const contentLength = c.req.header("Content-Length");
			const fileSize = contentLength ? Number.parseInt(contentLength, 10) : undefined;

			customMetadata = {
				...customMetadata,
				...documentMetadata,
				...(fileSize ? { fileSize } : {}),
			};
		}

		const result = await bucket.put(key, c.req.raw.body, {
			customMetadata: customMetadata,
			httpMetadata: httpMetadata,
		});

		// SpendRule: Return enhanced response with metadata
		return c.json({
			success: true,
			result: result,
			metadata: customMetadata,
			path: key,
		});
	}
}
