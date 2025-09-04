import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class ListObjects extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-list-objects",
		tags: ["Buckets"],
		summary: "List objects",
		request: {
			params: z.object({
				bucket: z.string(),
			}),
			query: z.object({
				limit: z.number().optional(),
				prefix: z
					.string()
					.nullable()
					.optional()
					.describe("base64 encoded prefix"),
				cursor: z.string().nullable().optional(),
				delimiter: z.string().nullable().optional(),
				startAfter: z.string().nullable().optional(),
				include: z.enum(["httpMetadata", "customMetadata"]).array().optional(),
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

		// CORS is handled by middleware/wrapper; remove invalid header

		// SpendRule: Apply health group filtering
		let prefix = data.query.prefix
			? decodeURIComponent(escape(atob(data.query.prefix)))
			: undefined;

		const healthGroupFilter = c.get("health_group_filter");
		const userHealthGroup = c.get("user_health_group");

		// Non-admin users should only see their health group folder
		if (healthGroupFilter && userHealthGroup !== "admin") {
			// If no prefix specified, default to user's health group
			if (!prefix) {
				prefix = `${healthGroupFilter}/`;
			} else {
				// Ensure prefix starts with user's health group
				if (!prefix.startsWith(`${healthGroupFilter}/`)) {
					prefix = `${healthGroupFilter}/${prefix}`;
				}
			}
		}

		const result = await bucket.list({
			limit: data.query.limit,
			prefix: prefix,
			cursor: data.query.cursor,
			startAfter: data.query.startAfter,
			delimiter: data.query.delimiter ? data.query.delimiter : "",
			// @ts-ignore
			include: data.query.include,
		});

		// SpendRule: Add health group context to response
		return c.json({
			...result,
			healthGroup: userHealthGroup,
			isAdmin: userHealthGroup === "admin",
		});
	}
}
