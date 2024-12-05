import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

export class PutMetadata extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-put-object-metadata",
		tags: ["Buckets"],
		summary: "Update object metadata",
		request: {
			params: z.object({
				bucket: z.string(),
				key: z.string().describe("base64 encoded file key"),
			}),
			body: {
				content: {
					"application/json": {
						schema: z
							.object({
								customMetadata: z.record(z.string(), z.any()),
							})
							.openapi("Object metadata"),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucket = c.env[data.params.bucket];

		let filePath;
		try {
			filePath = decodeURIComponent(escape(atob(data.params.key)));
		} catch (e) {
			filePath = decodeURIComponent(
				escape(atob(decodeURIComponent(data.params.key))),
			);
		}

		const object = await bucket.get(filePath);
		return await bucket.put(filePath, object.body, {
			customMetadata: data.body.customMetadata,
		});
	}
}
