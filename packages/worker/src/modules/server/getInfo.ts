import { OpenAPIRoute } from "chanfana";
import { settings } from "../../foundation/settings";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";

export class GetInfo extends OpenAPIRoute {
	schema = {
		operationId: "get-server-info",
		tags: ["Server"],
		summary: "Get server info",
	};

	async handle(c: AppContext) {
		const config = c.get("config");
		const authMode = c.get("authMode");

		// Build config response (exclude sensitive fields)
		const configResponse: Record<string, unknown> = {
			readonly: config.readonly,
			cors: config.cors,
		};

		// Get showHiddenFiles from D1 settings if session auth, otherwise from config
		let showHiddenFiles = false;
		if (authMode === "session" && c.env.R2_EXPLORER_DB) {
			const dbService = new DatabaseService(c.env.R2_EXPLORER_DB);
			const dbSettings = await dbService.getAllSettings();
			showHiddenFiles = dbSettings.showHiddenFiles;
		}
		configResponse.showHiddenFiles = showHiddenFiles;

		const buckets = [];

		for (const [key, value] of Object.entries(c.env)) {
			if (
				value &&
				typeof value === "object" &&
				value.constructor.name === "R2Bucket"
			) {
				buckets.push({ name: key });
			}
		}

		return {
			version: settings.version,
			config: configResponse,
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
