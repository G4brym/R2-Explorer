import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class CreateShareLink extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-create-share-link",
		tags: ["Buckets"],
		summary: "Create shareable link for file",
		request: {
			params: z.object({
				bucket: z.string(),
				key: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							expiresIn: z
								.number()
								.optional()
								.describe("Expiration time in seconds"),
							password: z.string().optional().describe("Optional password"),
							maxDownloads: z.number().optional().describe("Maximum downloads"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Share link created successfully",
				content: {
					"application/json": {
						schema: z.object({
							shareId: z.string(),
							shareUrl: z.string(),
							expiresAt: z.number().optional(),
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

		const key = decodeURIComponent(escape(atob(data.params.key)));

		// Verify the file exists
		const fileExists = await bucket.head(key);
		if (!fileExists) {
			throw new HTTPException(404, {
				message: `File not found: ${key}`,
			});
		}

		// Generate unique share ID
		let shareId = "";
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts) {
			shareId = crypto.randomUUID().replace(/-/g, "").substring(0, 10);
			const existingShare = await bucket.head(
				`.r2-explorer/sharable-links/${shareId}.json`,
			);
			if (!existingShare) {
				break;
			}
			attempts++;
		}

		if (attempts === maxAttempts) {
			throw new HTTPException(500, {
				message: "Failed to generate unique share ID",
			});
		}

		// Hash password if provided
		let passwordHash: string | undefined;
		if (data.body.password) {
			const encoder = new TextEncoder();
			const passwordData = encoder.encode(data.body.password);
			const hashBuffer = await crypto.subtle.digest("SHA-256", passwordData);
			passwordHash = Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		}

		// Calculate expiration timestamp
		const expiresAt = data.body.expiresIn
			? Date.now() + data.body.expiresIn * 1000
			: undefined;

		// Create share metadata
		const shareMetadata = {
			bucket: bucketName,
			key: key,
			expiresAt: expiresAt,
			passwordHash: passwordHash,
			maxDownloads: data.body.maxDownloads,
			currentDownloads: 0,
			createdBy: c.get("authentication_username") || "anonymous",
			createdAt: Date.now(),
		};

		// Store share metadata in R2
		await bucket.put(
			`.r2-explorer/sharable-links/${shareId}.json`,
			JSON.stringify(shareMetadata),
			{
				httpMetadata: { contentType: "application/json" },
				customMetadata: {
					targetBucket: bucketName,
					targetKey: key,
				},
			},
		);

		// Construct share URL
		const shareUrl = `${new URL(c.req.url).origin}/share/${shareId}`;

		return c.json({
			shareId,
			shareUrl,
			expiresAt,
		});
	}
}
