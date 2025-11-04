import type { AppContext } from "../types";

export function dashboardIndex(c: AppContext) {
	if (c.env.ASSETS === undefined) {
		return c.text(
			"ASSETS binding is not defined, learn more here: https://r2explorer.com/guides/migrating-to-1.1/",
			500,
		);
	}

	// Proxy the root request to the bound ASSETS service (Cloudflare Pages/static site)
	return c.env.ASSETS.fetch(c.req.raw);
}

export async function dashboardRedirect(c: AppContext, next) {
	if (c.env.ASSETS === undefined) {
		return c.text(
			"ASSETS binding is not defined, learn more here: https://r2explorer.com/guides/migrating-to-1.1/",
			500,
		);
	}

	// Always proxy any remaining request (including assets with dots)
	return c.env.ASSETS.fetch(c.req.raw);
}
