
import { z } from "zod";
import { AppContext } from "../../types";
import { OpenAPIRoute } from "chanfana";

export class CreateFolder extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-create-folder",
		tags: ["Buckets"],
		summary: "Create folder",
    request: {
      params: z.object({
        bucket: z.string()
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              key: z.string().describe("base64 encoded file key")
            })
          }
        }
      }
    }
	};

	async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>()

		const bucket = c.env[data.params.bucket];
		const key = decodeURIComponent(escape(atob(data.body.key)));

		return await bucket.put(key, "R2 Explorer Folder");
	}
}
