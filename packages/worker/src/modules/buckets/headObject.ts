import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

export class HeadObject extends OpenAPIRoute {
	schema = {
		operationId: "Head-bucket-object",
		tags: ["Buckets"],
		summary: "Get Object",
		request: {
			params: z.object({
				bucket: z.string(),
				key: z.string().describe("base64 encoded file key"),
			}),
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

		const object = await bucket.head(filePath);

		if (object === null) {
			return Response.json({ msg: "Object Not Found" }, { status: 404 });
		}

		return object;
	}
}
