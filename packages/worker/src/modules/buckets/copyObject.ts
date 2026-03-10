import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class CopyObject extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-copy-object",
		tags: ["Buckets"],
		summary: "Copy object",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							sourceKey: z.string().describe("base64 encoded source file key"),
							destinationKey: z
								.string()
								.describe("base64 encoded destination file key"),
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

		const sourceKey = decodeURIComponent(escape(atob(data.body.sourceKey)));
		const destinationKey = decodeURIComponent(
			escape(atob(data.body.destinationKey)),
		);

		const object = await bucket.get(sourceKey);

		if (object === null) {
			throw new HTTPException(404, {
				message: `Source object not found: ${sourceKey}`,
			});
		}

		const resp = await bucket.put(destinationKey, object.body, {
			customMetadata: object.customMetadata,
			httpMetadata: object.httpMetadata,
		});

		return resp;
	}
}
