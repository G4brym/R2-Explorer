import type { AppContext } from "../../types";

// Paths that should bypass readonly mode (auth and settings endpoints)
const READONLY_BYPASS_PATHS = [
	"/api/v1/auth/",
	"/api/v1/settings",
	"/api/v1/admin/",
];

export async function readOnlyMiddleware(
	c: AppContext,
	next: CallableFunction,
) {
	const config = c.get("config");
	const path = new URL(c.req.url).pathname;

	// Allow auth, settings, and admin endpoints through readonly mode
	const bypassReadonly = READONLY_BYPASS_PATHS.some((p) => path.startsWith(p));

	if (
		config.readonly === true &&
		!["GET", "HEAD"].includes(c.req.method) &&
		!bypassReadonly
	) {
		return Response.json(
			{
				success: false,
				errors: [
					{
						code: 10005,
						message:
							"This instance is in ReadOnly Mode, no changes are allowed!",
					},
				],
			},
			{ status: 401 },
		);
	}

	await next();
}
