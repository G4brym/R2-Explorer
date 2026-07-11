import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";
import { restoreFromTrash } from "./trash";

export class RestoreTrash extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-restore-trash",
		tags: ["Trash"],
		summary: "Restore a trashed object",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							trashKey: z.string().describe("base64 encoded trash key"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Object restored successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							restoredKey: z.string(),
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

		const trashKey = decodeURIComponent(escape(atob(data.body.trashKey)));

		try {
			const { restoredKey } = await restoreFromTrash(bucket, trashKey);
			return c.json({ success: true, restoredKey });
		} catch (error) {
			throw new HTTPException(500, {
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
