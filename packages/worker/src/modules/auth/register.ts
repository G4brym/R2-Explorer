import { OpenAPIRoute } from "chanfana";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { getSessionCookieName } from "../../foundation/middlewares/auth";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";
import { hashPassword } from "../../utils/password";

export class Register extends OpenAPIRoute {
	schema = {
		operationId: "auth-register",
		tags: ["Auth"],
		summary: "Register a new user",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email(),
							password: z.string().min(8),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Registration successful",
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
				description: "Registration failed",
			},
		},
	};

	async handle(c: AppContext) {
		const authMode = c.get("authMode");

		if (authMode !== "session") {
			return c.json(
				{
					success: false,
					error: "Registration is only available with session auth mode",
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
		const { email, password } = data.body;

		const dbService = new DatabaseService(db);

		// Check if user already exists
		const existingUser = await dbService.getUserByEmail(email);
		if (existingUser) {
			return c.json(
				{
					success: false,
					error: "A user with this email already exists",
				},
				{ status: 400 },
			);
		}

		// Check registration policy
		const settings = await dbService.getAllSettings();
		const hasUsers = await dbService.hasUsers();

		// null = smart mode (first user only)
		// true = always allow registration
		// false = never allow registration
		if (settings.registerEnabled === null) {
			if (hasUsers) {
				return c.json(
					{
						success: false,
						error: "Registration is closed. Contact an administrator.",
					},
					{ status: 403 },
				);
			}
		} else if (settings.registerEnabled === false) {
			return c.json(
				{
					success: false,
					error: "Registration is disabled",
				},
				{ status: 403 },
			);
		}

		// First user becomes admin
		const isAdmin = !hasUsers;

		const passwordHash = await hashPassword(password);
		const user = await dbService.createUser(email, passwordHash, isAdmin);

		// Create session and set cookie
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
