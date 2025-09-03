import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

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

		// SpendRule: Check if auto-categorization suggested a different path
		const suggestedPath = c.get("suggested_path");
		if (suggestedPath) {
			// Return the suggested path for the frontend to handle
			return c.json({
				success: false,
				suggestedPath: suggestedPath,
				documentType: c.get("document_type"),
				message: `File should be uploaded to ${c.get("document_type")} folder`,
				originalPath: key,
			});
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
			customMetadata = {
				...customMetadata,
				...documentMetadata,
				fileSize: c.req.raw.body ? await c.req.raw.clone().arrayBuffer().then(buf => buf.byteLength) : 0,
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
