import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../../types";

export class CompleteUpload extends OpenAPIRoute {
	schema = {
		operationId: "post-multipart-complete-upload",
		tags: ["Multipart"],
		summary: "Complete upload",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							uploadId: z.string(),
							parts: z
								.object({
									etag: z.string(),
									partNumber: z.number().int(),
								})
								.array(),
							key: z.string().describe("base64 encoded file key"),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const bucket = c.env[data.params.bucket];

		if (
			!bucket ||
			typeof bucket !== "object" ||
			!("resumeMultipartUpload" in bucket)
		) {
			return Response.json(
				{ error: `Bucket binding not found: ${data.params.bucket}` },
				{ status: 500 },
			);
		}

		const uploadId = data.body.uploadId;
		const key = decodeURIComponent(escape(atob(data.body.key)));
		const parts = data.body.parts as R2UploadedPart[];

		const multipartUpload = await bucket.resumeMultipartUpload(key, uploadId);

		try {
			const resp = await multipartUpload.complete(parts);

			return {
				success: true,
				str: resp,
			};
		} catch (error: any) {
			return Response.json({ msg: error.message }, { status: 400 });
		}
	}
}
