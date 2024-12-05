import { AppContext } from "../types";


export async function dashboardProxy(c: AppContext) {
	// Initialize the default cache
	//@ts-ignore
	const cache = caches.default;

	let path = new URL(c.req.raw.url).pathname;

	// Support page navigation
	if (!path.includes(".")) {
		path = "/";
	}

	let result;
  const config = c.get('config')

	if (config.cacheAssets !== false) {
		// use .match() to see if we have a cache hit, if so return the caches response early
		result = await cache.match(c.req.raw);
		if (result) {
			return result;
		}
	}

	let dashboardUrl = "https://demo.r2explorer.dev";
	if (config.dashboardUrl) {
		if (config.dashboardUrl.endsWith("/")) {
			dashboardUrl = config.dashboardUrl.slice(0, -1);
		} else {
			dashboardUrl = config.dashboardUrl;
		}
	}

	// we'll chain our await calls to get the JSON response in one line
	const response = await fetch(`${dashboardUrl}${path}`);

	result = new Response(await response.body, {
		status: response.status,
		headers: {
			"Content-Type": response.headers.get("Content-Type"),
			"Access-Control-Allow-Origin": "*",
			// We set a max-age of 300 seconds which is equivalent to 5 minutes.
			// If the last response is older than that the cache.match() call returns nothing and and a new response is fetched
			"Cache-Control": "max-age: 300",
		},
	});

	if (response.status === 200 && config.cacheAssets !== false) {
		// before returning the response we put a clone of our response object into the cache so it can be resolved later
    c.executionCtx.waitUntil(cache.put(c.req.raw, result.clone()));
	}

	return result;
}
