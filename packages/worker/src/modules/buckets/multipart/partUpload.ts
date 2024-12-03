import {
	Int,
	OpenAPIRoute,
	Path,
	Query,
	RequestBody,
} from "@cloudflare/itty-router-openapi";

import { z } from "zod";
import type { Context } from "../../../interfaces";
import { AppContext } from "../../../types";

export class PartUpload extends OpenAPIRoute {
	schema = {
		operationId: "post-multipart-part-upload",
		tags: ["Multipart"],
		summary: "Part upload",
		requestBody: new RequestBody({
			content: {
				"application/octet-stream": {
					schema: {
						type: "string",
						format: "binary",
					},
				},
			},
		}),
		parameters: {
			bucket: Path(String),
			key: Query(z.string().describe("base64 encoded file key")),
			uploadId: Query(String),
			partNumber: Query(Int),
		},
	};

	async handle(c: AppContext) {
		if (context.config.readonly === true)
			return Response.json({ msg: "unauthorized" }, { status: 401 });

		const bucket = env[data.params.bucket];

		const key = decodeURIComponent(escape(atob(data.query.key)));

		const multipartUpload = bucket.resumeMultipartUpload(
			key,
			data.query.uploadId,
		);

		try {
			return await multipartUpload.uploadPart(
				data.query.partNumber,
				request.body,
			);
		} catch (error: any) {
			return new Response(error.message, { status: 400 });
		}
	}
}
