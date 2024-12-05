import type { AppContext } from "../../types";

export async function readOnlyMiddleware(
	c: AppContext,
	next: CallableFunction,
) {
	const config = c.get("config");

	if (config.readonly === true && !["GET", "HEAD"].includes(c.req.method)) {
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
