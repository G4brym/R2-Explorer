import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class ListShares extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-shares",
		tags: ["Buckets"],
		summary: "List all active shares in bucket",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "List of active shares",
				content: {
					"application/json": {
						schema: z.object({
							shares: z.array(
								z.object({
									shareId: z.string(),
									shareUrl: z.string(),
									key: z.string(),
									expiresAt: z.number().optional(),
									maxDownloads: z.number().optional(),
									currentDownloads: z.number(),
									createdBy: z.string(),
									createdAt: z.number(),
									isExpired: z.boolean(),
									hasPassword: z.boolean(),
								}),
							),
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

		// List all share metadata files
		const sharesList = await bucket.list({
			prefix: ".r2-explorer/sharable-links/",
		});

		const shares = [];
		const now = Date.now();
		const origin = new URL(c.req.url).origin;

		for (const obj of sharesList.objects) {
			// Extract shareId from filename
			const shareId = obj.key.split("/").pop()?.replace(".json", "");
			if (!shareId) continue;

			// Get the share metadata
			const shareObject = await bucket.get(obj.key);
			if (!shareObject) continue;

			const metadata = JSON.parse(await shareObject.text());

			// Check if expired
			const isExpired = !!(metadata.expiresAt && now > metadata.expiresAt);

			shares.push({
				shareId,
				shareUrl: `${origin}/share/${shareId}`,
				key: metadata.key,
				expiresAt: metadata.expiresAt,
				maxDownloads: metadata.maxDownloads,
				currentDownloads: metadata.currentDownloads || 0,
				createdBy: metadata.createdBy,
				createdAt: metadata.createdAt,
				isExpired,
				hasPassword: !!metadata.passwordHash,
			});
		}

		return c.json({ shares });
	}
}
