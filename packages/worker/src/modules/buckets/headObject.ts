import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
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

		const bucketName = data.params.bucket;
		const bucket = c.env[bucketName] as R2Bucket | undefined;

		if (!bucket) {
			throw new HTTPException(500, {
				message: `Bucket binding not found: ${bucketName}`,
			});
		}

		let filePath;
		try {
			filePath = decodeURIComponent(escape(atob(data.params.key)));
		} catch (e) {
			filePath = decodeURIComponent(
				escape(atob(decodeURIComponent(data.params.key))),
			);
		}

		const objectMeta = await bucket.head(filePath);

		if (objectMeta === null) {
			// Return a Response object for 404, consistent with Hono best practices
			throw new HTTPException(404, { message: "Object Not Found" });
		}

		// Return the objectMeta, because the dashboard needs to read user defined metadata
		return objectMeta;
	}
}
