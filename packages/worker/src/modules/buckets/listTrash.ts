import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";
import { TRASH_PREFIX } from "./trash";

export class ListTrash extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-list-trash",
		tags: ["Trash"],
		summary: "List trashed objects",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			query: z.object({
				limit: z.number().optional(),
				cursor: z.string().nullable().optional(),
			}),
		},
		responses: {
			"200": {
				description: "List of trashed objects",
				content: {
					"application/json": {
						schema: z.object({
							objects: z.array(
								z.object({
									trashKey: z.string(),
									originalKey: z.string(),
									deletedAt: z.number(),
									deletedBy: z.string(),
									size: z.number(),
								}),
							),
							truncated: z.boolean(),
							cursor: z.string().optional(),
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

		const list = await bucket.list({
			prefix: TRASH_PREFIX,
			limit: data.query.limit,
			cursor: data.query.cursor,
			include: ["customMetadata"],
		});

		const objects = list.objects.map((obj) => {
			const metadata = obj.customMetadata || {};
			let originalKey = metadata.trashOriginalKey;
			if (!originalKey) {
				const withoutPrefix = obj.key.slice(TRASH_PREFIX.length);
				const firstSlash = withoutPrefix.indexOf("/");
				originalKey =
					firstSlash === -1
						? withoutPrefix
						: withoutPrefix.slice(firstSlash + 1);
			}
			return {
				trashKey: obj.key,
				originalKey,
				deletedAt: Number.parseInt(metadata.trashDeletedAt || "0", 10),
				deletedBy: metadata.trashDeletedBy || "anonymous",
				size: obj.size,
			};
		});

		return c.json({
			objects,
			truncated: list.truncated,
			cursor: list.truncated ? list.cursor : undefined,
		});
	}
}
