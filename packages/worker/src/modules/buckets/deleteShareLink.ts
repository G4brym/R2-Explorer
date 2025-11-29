import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class DeleteShareLink extends OpenAPIRoute {
	schema = {
		operationId: "delete-bucket-share-link",
		tags: ["Buckets"],
		summary: "Revoke/delete a share link",
		request: {
			params: z.object({
				bucket: z.string(),
				shareId: z.string().describe("10-character share ID"),
			}),
		},
		responses: {
			"200": {
				description: "Share link deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
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

		const shareId = data.params.shareId;
		const shareKey = `.r2-explorer/sharable-links/${shareId}.json`;

		// Verify the share exists before deleting
		const shareExists = await bucket.head(shareKey);
		if (!shareExists) {
			throw new HTTPException(404, {
				message: `Share link not found: ${shareId}`,
			});
		}

		// Delete the share metadata
		await bucket.delete(shareKey);

		return c.json({ success: true });
	}
}
