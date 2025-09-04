import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../../types";

/**
 * Health Group Isolation Middleware for SpendRule
 * Ensures users can only access their designated health group folder
 */
export const healthGroupIsolationMiddleware: MiddlewareHandler = async (
	c: AppContext,
	next,
) => {
	const username = c.get("authentication_username");
	if (!username) {
		return c.json({ error: "Authentication required" }, 401);
	}

	// Health group mappings (expand as needed)
	const healthGroupMapping: Record<string, string> = {
		henryford_user: "henry_ford",
	};

	// Admin users have full access
	const adminUsers = ["spendrule_admin"];
	const isAdmin = adminUsers.includes(username);

	let requestedPath = "";

	// 1) Try path param `key`
	requestedPath = c.req.param("key") || "";

	// 2) Try query param `?key=<base64>` (upload endpoint)
	if (!requestedPath) {
		const url = new URL(c.req.url);
		const qKey = url.searchParams.get("key");
		if (qKey) {
			try {
				requestedPath = decodeURIComponent(escape(atob(qKey)));
			} catch {
				// Fall back to raw value if not base64
				requestedPath = qKey;
			}
		}
	}

	// 3) Try JSON body keys for delete/move/etc. without consuming original body
	if (!requestedPath && (c.req.method === "POST" || c.req.method === "PUT")) {
		try {
			const cloned = c.req.raw.clone();
			const contentType = c.req.header("content-type") || "";
			if (contentType.includes("application/json")) {
				const body = await cloned.json().catch(() => undefined) as any;
				const bodyKey = body?.key ?? body?.oldKey ?? body?.from ?? body?.name ?? body?.path;
				if (bodyKey) {
					try {
						requestedPath = decodeURIComponent(escape(atob(bodyKey)));
					} catch {
						requestedPath = String(bodyKey);
					}
				}
			}
		} catch {
			// ignore
		}
	}

	if (!isAdmin) {
		const userHealthGroup = healthGroupMapping[username];
		if (!userHealthGroup) {
			return c.json({ error: "User not assigned to a health group" }, 403);
		}

		const expectedPrefix = `${userHealthGroup}/${username}`;

		if (!requestedPath) {
			// List operations – restrict listing to health group
			c.set("health_group_filter", userHealthGroup);
		} else if (
			!requestedPath.startsWith(expectedPrefix) &&
			requestedPath !== userHealthGroup
		) {
			return c.json(
				{ error: `Access denied. You can only access ${expectedPrefix}/ folder.` },
				403,
			);
		}

		c.set("user_health_group", userHealthGroup);
	} else {
		c.set("user_health_group", "admin");
	}

	await next();
};
