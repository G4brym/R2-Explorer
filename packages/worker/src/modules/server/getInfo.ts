import { OpenAPIRoute } from "chanfana";
import { settings } from "../../foundation/settings";
import type { AppContext } from "../../types";

export class GetInfo extends OpenAPIRoute {
	schema = {
		operationId: "get-server-info",
		tags: ["Server"],
		summary: "Get server info",
	};

	async handle(c: AppContext) {
		const { basicAuth, ...config } = c.get("config");

		const buckets = [];

		for (const [key, value] of Object.entries(c.env)) {
			// Type guard to check if value is an R2Bucket (must have list method)
			if (
				value &&
				typeof value === "object" &&
				"get" in value &&
				"put" in value &&
				"list" in value &&
				typeof value.get === "function" &&
				typeof value.put === "function" &&
				typeof value.list === "function"
			) {
				buckets.push({ name: key });
			}
		}

		return {
			version: settings.version,
			config: config,
			auth: c.get("authentication_type")
				? {
						type: c.get("authentication_type"),
						username: c.get("authentication_username"),
					}
				: undefined,
			buckets: buckets,
		};
	}
}
