import {
	Int,
	OpenAPIRoute,
	Path,
	Query,
} from "@cloudflare/itty-router-openapi";

import { z } from "zod";
import type { Context } from "../../../interfaces";
import { AppContext } from "../../../types";

export class CompleteUpload extends OpenAPIRoute {
	schema = {
		operationId: "post-multipart-complete-upload",
		tags: ["Multipart"],
		summary: "Complete upload",
		parameters: {
			bucket: Path(String),
		},
		requestBody: {
			uploadId: String,
			key: z.string().describe("base64 encoded file key"),
			parts: [
				{
					etag: String,
					partNumber: Int,
				},
			],
		},
	};

	async handle(c: AppContext) {
		if (context.config.readonly === true)
			return Response.json({ msg: "unauthorized" }, { status: 401 });

		const bucket = env[data.params.bucket];

		const uploadId = data.body.uploadId;
		const key = decodeURIComponent(escape(atob(data.body.key)));
		const parts = data.body.parts;

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
