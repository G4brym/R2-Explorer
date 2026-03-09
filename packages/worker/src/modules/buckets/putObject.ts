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

		const key = decodeURIComponent(escape(atob(data.query.key)));

		let customMetadata = undefined;
		if (data.query.customMetadata) {
			try {
				customMetadata = JSON.parse(
					decodeURIComponent(escape(atob(data.query.customMetadata))),
				);
			} catch {
				throw new HTTPException(400, {
					message: "Invalid customMetadata: expected base64-encoded JSON",
				});
			}
		}

		let httpMetadata = undefined;
		if (data.query.httpMetadata) {
			try {
				httpMetadata = JSON.parse(
					decodeURIComponent(escape(atob(data.query.httpMetadata))),
				);
			} catch {
				throw new HTTPException(400, {
					message: "Invalid httpMetadata: expected base64-encoded JSON",
				});
			}
		}

		return await bucket.put(key, c.req.raw.body, {
			customMetadata: customMetadata,
			httpMetadata: httpMetadata,
		});
	}
}
