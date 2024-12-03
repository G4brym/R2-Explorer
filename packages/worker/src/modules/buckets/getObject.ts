import { OpenAPIRoute, Path } from "@cloudflare/itty-router-openapi";

import { z } from "zod";
import type { Context } from "../../interfaces";
import { AppContext } from "../../types";

export class GetObject extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-object",
		tags: ["Buckets"],
		summary: "Get Object",
		parameters: {
			bucket: Path(String),
			key: Path(z.string().describe("base64 encoded file key")),
		},
		responses: {
			"200": {
				description: "File binary",
				schema: z.string().openapi({ format: "binary" }),
			},
		},
	};

	async handle(c: AppContext) {
		const bucket = env[data.params.bucket];

		let filePath;
		try {
			filePath = decodeURIComponent(escape(atob(data.params.key)));
		} catch (e) {
			filePath = decodeURIComponent(
				escape(atob(decodeURIComponent(data.params.key))),
			);
		}

		const object = await bucket.get(filePath);

		if (object === null) {
			return Response.json({ msg: "Object Not Found" }, { status: 404 });
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set("etag", object.httpEtag);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${filePath.split("/").pop()}"`,
		);

		return new Response(object.body, {
			headers,
		});
	}
}