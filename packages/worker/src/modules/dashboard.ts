import type { AppContext } from "../types";

export function dashboardIndex(c: AppContext) {
	return c.text("your index.html is not loaded!");
}

export async function dashboardRedirect(c: AppContext, next) {
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
