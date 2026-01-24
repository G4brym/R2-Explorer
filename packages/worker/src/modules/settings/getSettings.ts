import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";

export class GetSettings extends OpenAPIRoute {
	schema = {
		operationId: "get-settings",
		tags: ["Settings"],
		summary: "Get public settings and auth info",
		responses: {
			"200": {
				description: "Settings and auth info",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							authMode: z.enum(["session", "disabled"]),
							registrationOpen: z.boolean(),
							settings: z.object({
								showHiddenFiles: z.boolean(),
								recoveryEmailEnabled: z.boolean(),
								appDriveEnabled: z.boolean(),
								appEmailEnabled: z.boolean(),
								appNotesEnabled: z.boolean(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const authMode = c.get("authMode");

		// Default settings for non-session modes
		if (authMode !== "session" || !c.env.R2_EXPLORER_DB) {
			return c.json({
				success: true,
				authMode,
				registrationOpen: false,
				settings: {
					showHiddenFiles: false,
					recoveryEmailEnabled: false,
					appDriveEnabled: true,
					appEmailEnabled: true,
					appNotesEnabled: true,
				},
			});
		}

		const dbService = new DatabaseService(c.env.R2_EXPLORER_DB);
		const settings = await dbService.getAllSettings();
		const hasUsers = await dbService.hasUsers();

		// Determine if registration is open
		// null = smart mode (first user only)
		// true = always allow registration
		// false = never allow registration
		let registrationOpen = false;
		if (settings.registerEnabled === null) {
			registrationOpen = !hasUsers;
		} else {
			registrationOpen = settings.registerEnabled;
		}

		return c.json({
			success: true,
			authMode,
			registrationOpen,
			settings: {
				showHiddenFiles: settings.showHiddenFiles,
				recoveryEmailEnabled: settings.recoveryEmailEnabled,
				appDriveEnabled: settings.appDriveEnabled,
				appEmailEnabled: settings.appEmailEnabled,
				appNotesEnabled: settings.appNotesEnabled,
			},
		});
	}
}
