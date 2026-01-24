import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

export class GetMe extends OpenAPIRoute {
	schema = {
		operationId: "auth-me",
		tags: ["Auth"],
		summary: "Get current session information",
		responses: {
			"200": {
				description: "Session information",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							authenticated: z.boolean(),
							user: z
								.object({
									id: z.string(),
									email: z.string(),
									isAdmin: z.boolean(),
								})
								.nullable(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const authMode = c.get("authMode");

		// Disabled mode - no authentication
		if (authMode === "disabled") {
			return c.json({
				success: true,
				authenticated: true,
				user: null,
			});
		}

		// Session mode
		const session = c.get("session");

		if (session) {
			return c.json({
				success: true,
				authenticated: true,
				user: {
					id: session.userId,
					email: session.email,
					isAdmin: session.isAdmin,
				},
			});
		}

		return c.json({
			success: true,
			authenticated: false,
			user: null,
		});
	}
}
