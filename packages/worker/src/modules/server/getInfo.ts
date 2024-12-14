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

		return {
			version: settings.version,
			config: config,
			auth: c.get("authentication_type")
				? {
						authentication_type: c.get("authentication_type"),
						authentication_username: c.get("authentication_username"),
					}
				: undefined,
		};
	}
}
