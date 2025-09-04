import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class MoveObject extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-move-object",
		tags: ["Buckets"],
		summary: "Move object",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
		body: {
				content: {
					"application/json": {
						schema: z.object({
							// Accept either oldKey/newKey (base64) or from/to (plain)
							oldKey: z.string().optional(),
							newKey: z.string().optional(),
							from: z.string().optional(),
							to: z.string().optional(),
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

		// Determine keys (base64 or plain)
		let oldKeyRaw = data.body.oldKey ?? data.body.from;
		let newKeyRaw = data.body.newKey ?? data.body.to;
		if (!oldKeyRaw || !newKeyRaw) {
			throw new HTTPException(400, { message: "Missing source or destination key" });
		}
		let oldKey: string;
		let newKey: string;
		try {
			oldKey = decodeURIComponent(escape(atob(oldKeyRaw)));
		} catch {
			oldKey = oldKeyRaw;
		}
		try {
			newKey = decodeURIComponent(escape(atob(newKeyRaw)));
		} catch {
			newKey = newKeyRaw;
		}

		const object = await bucket.get(oldKey);

		if (object === null) {
			throw new HTTPException(404, {
				message: `Source object not found: ${oldKey}`,
			});
		}

		const resp = await bucket.put(newKey, object.body, {
			customMetadata: object.customMetadata,
			httpMetadata: object.httpMetadata,
		});

		await bucket.delete(oldKey);

		return resp;
	}
}
