import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";
import { purgeTrash } from "./trash";

export class PurgeTrash extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-purge-trash",
		tags: ["Trash"],
		summary: "Permanently delete trashed objects",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							trashKey: z
								.string()
								.optional()
								.describe(
									"base64 encoded trash key; omit to empty entire trash",
								),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Trash purged successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							deleted: z.number(),
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

		let trashKey: string | undefined;
		if (data.body.trashKey) {
			trashKey = decodeURIComponent(escape(atob(data.body.trashKey)));
		}

		try {
			const { deleted } = await purgeTrash(bucket, trashKey);
			return c.json({ success: true, deleted });
		} catch (error) {
			throw new HTTPException(500, {
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
