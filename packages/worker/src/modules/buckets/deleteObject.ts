import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";
import { isExplorerKey, isTrashEnabled, moveToTrash } from "./trash";

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
							permanent: z
								.boolean()
								.optional()
								.describe("Skip trash and permanently delete the object"),
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
		const config = c.get("config");

		if (isExplorerKey(key) || data.body.permanent || !isTrashEnabled(config)) {
			await bucket.delete(key);
			return { success: true };
		}

		const object = await bucket.head(key);
		if (object === null) {
			await bucket.delete(key);
			return { success: true };
		}

		try {
			const { trashKey } = await moveToTrash(
				bucket,
				key,
				crypto.randomUUID().replace(/-/g, "").substring(0, 10),
				c.get("authentication_username") || "anonymous",
			);
			return { success: true, trashed: true, trashKey };
		} catch (error) {
			throw new HTTPException(500, {
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
