import type { AppContext } from "../types";

export function dashboardIndex(c: AppContext) {
	if (c.env.ASSETS === undefined) {
		return c.text(
			"ASSETS binding is not defined, learn more here: https://r2explorer.dev/guides/migrating-to-1.1/",
			500,
		);
	}

	return c.text(
		"ASSETS binding is not pointing to a valid dashboard, learn more here: https://r2explorer.dev/guides/migrating-to-1.1/",
		500,
	);
}

export async function dashboardRedirect(c: AppContext, next) {
	if (c.env.ASSETS === undefined) {
		return c.text(
			"ASSETS binding is not defined, learn more here: https://r2explorer.dev/guides/migrating-to-1.1/",
			500,
		);
	}

	const url = new URL(c.req.url);

	if (!url.pathname.includes(".")) {
		// This is required for SPA
		return fetch(`${url.origin}/`, {
			cf: {
				// Always cache this fetch regardless of content type
				// for a max of 60 seconds before revalidating the resource
				cacheTtl: 60,
				cacheEverything: true,
			},
		});
	}

	await next();
}
