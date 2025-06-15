import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class CreateFolder extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-create-folder",
		tags: ["Buckets"],
		summary: "Create folder",
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

		const bucketName = data.params.bucket;
		const bucket = c.env[bucketName] as R2Bucket | undefined;

		if (!bucket) {
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}
		const key = decodeURIComponent(escape(atob(data.body.key)));

		// R2 doesn't have real folders. Create a zero-byte object with a trailing slash.
		// Or, if key already ends with a slash, use it as is.
		const folderKey = key.endsWith("/") ? key : `${key}/`;

		return await bucket.put(folderKey, ""); // Empty body for folder markers
	}
}
