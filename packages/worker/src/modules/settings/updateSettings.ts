import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";

export class UpdateSettings extends OpenAPIRoute {
	schema = {
		operationId: "update-settings",
		tags: ["Settings"],
		summary: "Update runtime settings (admin only)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							showHiddenFiles: z.boolean().optional(),
							registerEnabled: z.boolean().nullable().optional(),
							recoveryEmailFrom: z.string().nullable().optional(),
							recoveryEmailEnabled: z.boolean().optional(),
							appDriveEnabled: z.boolean().optional(),
							appEmailEnabled: z.boolean().optional(),
							appNotesEnabled: z.boolean().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Settings updated",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							settings: z.object({
								showHiddenFiles: z.boolean(),
								registerEnabled: z.boolean().nullable(),
								recoveryEmailFrom: z.string().nullable(),
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

		if (authMode !== "session") {
			return c.json(
				{
					success: false,
					error: "Settings management is only available with session auth mode",
				},
				{ status: 400 },
			);
		}

		const db = c.env.R2_EXPLORER_DB;
		if (!db) {
			return c.json(
				{
					success: false,
					error: "Database not configured",
				},
				{ status: 500 },
			);
		}

		const data = await this.getValidatedData<typeof this.schema>();
		const {
			showHiddenFiles,
			registerEnabled,
			recoveryEmailFrom,
			recoveryEmailEnabled,
			appDriveEnabled,
			appEmailEnabled,
			appNotesEnabled,
		} = data.body;

		const dbService = new DatabaseService(db);

		// Update each setting if provided
		if (showHiddenFiles !== undefined) {
			await dbService.setSetting("showHiddenFiles", showHiddenFiles.toString());
		}

		if (registerEnabled !== undefined) {
			if (registerEnabled === null) {
				// Delete the setting to use smart mode
				await dbService.setSetting("registerEnabled", "null");
			} else {
				await dbService.setSetting(
					"registerEnabled",
					registerEnabled.toString(),
				);
			}
		}

		if (recoveryEmailFrom !== undefined) {
			if (recoveryEmailFrom === null) {
				await dbService.setSetting("recoveryEmailFrom", "");
			} else {
				await dbService.setSetting("recoveryEmailFrom", recoveryEmailFrom);
			}
		}

		if (recoveryEmailEnabled !== undefined) {
			await dbService.setSetting(
				"recoveryEmailEnabled",
				recoveryEmailEnabled.toString(),
			);
		}

		// App toggles
		if (appDriveEnabled !== undefined) {
			await dbService.setSetting("appDriveEnabled", appDriveEnabled.toString());
		}

		if (appEmailEnabled !== undefined) {
			await dbService.setSetting("appEmailEnabled", appEmailEnabled.toString());
		}

		if (appNotesEnabled !== undefined) {
			await dbService.setSetting("appNotesEnabled", appNotesEnabled.toString());
		}

		// Return updated settings
		const settings = await dbService.getAllSettings();

		return c.json({
			success: true,
			settings,
		});
	}
}
