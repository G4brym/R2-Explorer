import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";

export class ForgotPassword extends OpenAPIRoute {
	schema = {
		operationId: "auth-forgot-password",
		tags: ["Auth"],
		summary: "Request password reset email",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Request processed",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string(),
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
					error: "Password reset is only available with session auth mode",
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
		const { email } = data.body;

		const dbService = new DatabaseService(db);

		// Check if password recovery is enabled
		const settings = await dbService.getAllSettings();
		if (!settings.recoveryEmailEnabled) {
			return c.json(
				{
					success: false,
					error: "Password recovery is not enabled",
				},
				{ status: 400 },
			);
		}

		// Always return success to prevent email enumeration
		const successResponse = {
			success: true,
			message:
				"If an account with that email exists, a password reset link has been sent.",
		};

		// Find user
		const user = await dbService.getUserByEmail(email);
		if (!user) {
			return c.json(successResponse);
		}

		// Create recovery token
		const token = await dbService.createRecoveryToken(user.id);

		// In a real implementation, you would send an email here
		// For now, we just log the token (in production, integrate with email service)
		console.log(`Password reset token for ${email}: ${token}`);

		// TODO: Integrate with email routing or external email service
		// The token should be included in a link like:
		// ${baseUrl}/auth/reset-password?token=${token}

		return c.json(successResponse);
	}
}
