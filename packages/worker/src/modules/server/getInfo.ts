import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { settings } from "../../foundation/settings";


export class GetInfo extends OpenAPIRoute {
	schema = {
		operationId: "get-server-info",
		tags: ["Server"],
		summary: "Get server info",
	};

	async handle(c: AppContext) {
		const {basicAuth, ...config} = c.get('config')

		return {
			version: settings.version,
			config: config,
			user: {
				username: c.get('username'),
			},
		};
	}
}
