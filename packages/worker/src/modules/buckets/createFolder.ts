import { OpenAPIRoute, Path, Query } from "@cloudflare/itty-router-openapi";

import { z } from "zod";
import type { Context } from "../../interfaces";
import { AppContext } from "../../types";

export class CreateFolder extends OpenAPIRoute {
	schema = {
		operationId: "post-bucket-create-folder",
		tags: ["Buckets"],
		summary: "Create folder",
		parameters: {
			bucket: Path(String),
		},
		requestBody: {
			key: z.string().describe("base64 encoded file key"),
		},
	};

	async handle(c: AppContext) {
		if (context.config.readonly === true)
			return Response.json({ msg: "unauthorized" }, { status: 401 });

		const bucket = env[data.params.bucket];
		const key = decodeURIComponent(escape(atob(data.body.key)));

		return await bucket.put(key, "R2 Explorer Folder");
	}
}
