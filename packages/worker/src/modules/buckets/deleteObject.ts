import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class DeleteObject extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-delete-object",
		tags: ["Buckets"],
		summary: "Delete object",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							key: z.string().describe("base64 encoded file key"),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucketName = data.params.bucket; // Store bucket name
		const bucket = c.env[bucketName] as R2Bucket | undefined; // Explicitly type as potentially undefined

		if (!bucket) {
			// Using Hono's HTTPException for proper error response
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}


		// Accept base64-encoded or plain keys for compatibility
		let key: string;
		try {
			key = decodeURIComponent(escape(atob(data.body.key)));
		} catch {
			key = data.body.key;
		}

		await bucket.delete(key);

		return { success: true };
	}
}
