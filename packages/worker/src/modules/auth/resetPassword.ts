import { OpenAPIRoute } from "chanfana";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { getSessionCookieName } from "../../foundation/middlewares/auth";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";
import { hashPassword } from "../../utils/password";

export class ResetPassword extends OpenAPIRoute {
	schema = {
		operationId: "auth-reset-password",
		tags: ["Auth"],
		summary: "Reset password with token",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							token: z.string(),
							password: z.string().min(8),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Password reset successful",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							user: z.object({
								id: z.string(),
								email: z.string(),
								isAdmin: z.boolean(),
							}),
						}),
					},
				},
			},
			"400": {
				description: "Invalid or expired token",
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
		const { token, password } = data.body;

		const dbService = new DatabaseService(db);

		// Validate token
		const tokenData = await dbService.getRecoveryToken(token);
		if (!tokenData) {
			return c.json(
				{
					success: false,
					error: "Invalid or expired reset token",
				},
				{ status: 400 },
			);
		}

		// Get user
		const user = await dbService.getUserById(tokenData.userId);
		if (!user) {
			return c.json(
				{
					success: false,
					error: "User not found",
				},
				{ status: 400 },
			);
		}

		// Update password
		const passwordHash = await hashPassword(password);
		await dbService.updatePassword(user.id, passwordHash);

		// Delete the used token
		await dbService.deleteRecoveryToken(token);

		// Invalidate all existing sessions for this user
		await dbService.deleteUserSessions(user.id);

		// Create a new session
		const session = await dbService.createSession(
			user.id,
			user.email,
			user.isAdmin,
		);

		setCookie(c, getSessionCookieName(), session.id, {
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			path: "/",
			maxAge: 30 * 24 * 60 * 60, // 30 days
		});

		return c.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				isAdmin: user.isAdmin,
			},
		});
	}
}
