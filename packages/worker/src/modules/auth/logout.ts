import { OpenAPIRoute } from "chanfana";
import { deleteCookie, getCookie } from "hono/cookie";
import { z } from "zod";
import { getSessionCookieName } from "../../foundation/middlewares/auth";
import { DatabaseService } from "../../services/database";
import type { AppContext } from "../../types";

export class Logout extends OpenAPIRoute {
	schema = {
		operationId: "auth-logout",
		tags: ["Auth"],
		summary: "Logout and invalidate session",
		responses: {
			"200": {
				description: "Logout successful",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const authMode = c.get("authMode");

		if (authMode !== "session") {
			return c.json({ success: true });
		}

		const db = c.env.R2_EXPLORER_DB;
		const sessionId = getCookie(c, getSessionCookieName());

		if (db && sessionId) {
			const dbService = new DatabaseService(db);
			await dbService.deleteSession(sessionId);
		}

		deleteCookie(c, getSessionCookieName(), {
			path: "/",
		});

		return c.json({ success: true });
	}
}
