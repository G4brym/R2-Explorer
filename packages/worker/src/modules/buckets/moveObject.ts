import { OpenAPIRoute } from "chanfana";
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
							oldKey: z.string().describe("base64 encoded file key"),
							newKey: z.string().describe("base64 encoded file key"),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucket = c.env[data.params.bucket];
		const oldKey = decodeURIComponent(escape(atob(data.body.oldKey)));
		const newKey = decodeURIComponent(escape(atob(data.body.newKey)));

		const object = await bucket.get(oldKey);
		const resp = await bucket.put(newKey, object.body, {
			customMetadata: object.customMetadata,
			httpMetadata: object.httpMetadata,
		});

		await bucket.delete(oldKey);

		return resp;
	}
}
