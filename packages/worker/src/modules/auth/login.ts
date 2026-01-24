import { OpenAPIRoute } from "chanfana";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { getSessionCookieName } from "../../foundation/middlewares/auth";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";
import { verifyPassword } from "../../utils/password";

export class Login extends OpenAPIRoute {
	schema = {
		operationId: "auth-login",
		tags: ["Auth"],
		summary: "Login with email and password",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email(),
							password: z.string(),
							remember: z.boolean().optional().default(true),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Login successful",
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
			"401": {
				description: "Invalid credentials",
			},
		},
	};

	async handle(c: AppContext) {
		const authMode = c.get("authMode");

		if (authMode !== "session") {
			return c.json(
				{
					success: false,
					error: "Login is only available with session auth mode",
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
		const { email, password, remember } = data.body;

		const dbService = new DatabaseService(db);

		// Get user with password hash
		const result = await dbService.getUserWithPassword(email);
		if (!result) {
			return c.json(
				{
					success: false,
					error: "Invalid email or password",
				},
				{ status: 401 },
			);
		}

		// Verify password
		const isValid = await verifyPassword(password, result.passwordHash);
		if (!isValid) {
			return c.json(
				{
					success: false,
					error: "Invalid email or password",
				},
				{ status: 401 },
			);
		}

		const { user } = result;

		// Create session
		const session = await dbService.createSession(
			user.id,
			user.email,
			user.isAdmin,
		);

		// Set cookie with appropriate expiration
		const maxAge = remember ? 30 * 24 * 60 * 60 : undefined; // 30 days or session

		setCookie(c, getSessionCookieName(), session.id, {
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			path: "/",
			maxAge,
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
