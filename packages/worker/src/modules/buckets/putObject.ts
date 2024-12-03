import { z } from "zod";
import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";

export class PutObject extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-upload-object",
		tags: ["Buckets"],
		summary: "Upload object",
    request: {
      body: {
        content: {
          'application/octet-stream': {
            schema: {
              type: "string",
              format: "binary",
            }
          },
        },
      },
      params: z.object({
        bucket: z.string()
      }),
      query: z.object({
        key: z.string().describe("base64 encoded file key"),
        customMetadata: z.string().nullable().optional().describe("base64 encoded json string"),
        httpMetadata: z.string().nullable().optional().describe("base64 encoded json string"),
      })
    },
	};

	async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>()

		const bucket = c.env[data.params.bucket];

		const key = decodeURIComponent(escape(atob(data.query.key)));

		let customMetadata = undefined;
		if (data.query.customMetadata) {
			customMetadata = JSON.parse(
				decodeURIComponent(escape(atob(data.query.customMetadata))),
			);
		}

		let httpMetadata = undefined;
		if (data.query.httpMetadata) {
			httpMetadata = JSON.parse(
				decodeURIComponent(escape(atob(data.query.httpMetadata))),
			);
		}

		return await bucket.put(key, c.req.raw.body, {
			customMetadata: customMetadata,
			httpMetadata: httpMetadata,
		});
	}
}
