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
	const bucket = c.req.param("bucket");
	const key = c.req.param("key") || "";

	if (!username) {
		return c.json({ error: "Authentication required" }, 401);
	}

	// Define health group mappings
	const healthGroupMapping: Record<string, string> = {
		henryford_user: "henry_ford",
		// Add more health groups here as they're onboarded
	};

	// Admin users have full access
	const adminUsers = ["spendrule_admin"];
	const isAdmin = adminUsers.includes(username);

	if (!isAdmin) {
		const userHealthGroup = healthGroupMapping[username];
		if (!userHealthGroup) {
			return c.json({ error: "User not assigned to a health group" }, 403);
		}

		// Check if the requested path starts with the user's health group
		const requestedPath = key ? `${key}` : "";
		if (!requestedPath.startsWith(userHealthGroup)) {
			// For list operations without a key, enforce health group prefix
			if (!key) {
				c.set("health_group_filter", userHealthGroup);
			} else {
				return c.json(
					{
						error: `Access denied. You can only access ${userHealthGroup}/ folder.`,
					},
					403,
				);
			}
		}

		// Store user's health group for use in other modules
		c.set("user_health_group", userHealthGroup);
	} else {
		c.set("user_health_group", "admin");
	}

	await next();
};