import { getCookie } from "hono/cookie";
import { DatabaseService } from "../../services/database";
import type { AppContext, AuthMode } from "../../types";

const SESSION_COOKIE_NAME = "r2_explorer_session";

/**
 * Parse and normalize auth config
 */
export function parseAuthMode(auth: AuthMode | undefined): AuthMode {
	if (!auth) {
		return "session";
	}
	return auth;
}

/**
 * Initialize auth middleware - validates config and attaches db to context
 */
export async function initAuthMiddleware(
	c: AppContext,
	next: () => Promise<void>,
) {
	const config = c.get("config");
	const mode = parseAuthMode(config.auth);

	c.set("authMode", mode);

	// Validate session auth requires D1 database
	if (mode === "session") {
		if (!c.env.R2_EXPLORER_DB) {
			return c.json(
				{
					success: false,
					error:
						'R2-Explorer configuration error: Session auth requires D1 database. Add R2_EXPLORER_DB binding to your wrangler.toml or use auth: "disabled".',
				},
				{ status: 500 },
			);
		}

		const db = new DatabaseService(c.env.R2_EXPLORER_DB);
		await db.runMigrations();
		c.set("db", c.env.R2_EXPLORER_DB);
	}

	await next();
}

/**
 * Session auth middleware - extracts and validates session token
 */
export async function sessionAuthMiddleware(
	c: AppContext,
	next: () => Promise<void>,
) {
	const authMode = c.get("authMode");

	if (authMode !== "session") {
		await next();
		return;
	}

	const db = c.env.R2_EXPLORER_DB;
	if (!db) {
		await next();
		return;
	}

	const sessionId = getCookie(c, SESSION_COOKIE_NAME);
	if (!sessionId) {
		await next();
		return;
	}

	const dbService = new DatabaseService(db);
	const session = await dbService.getSession(sessionId);

	if (session) {
		c.set("session", session);
		c.set("authentication_type", "session");
		c.set("authentication_username", session.email);

		// Also load user for convenience
		const user = await dbService.getUserById(session.userId);
		if (user) {
			c.set("user", user);
		}
	}

	await next();
}

/**
 * Require authentication middleware - blocks unauthenticated requests
 */
export async function requireAuth(c: AppContext, next: () => Promise<void>) {
	const authMode = c.get("authMode");

	// Disabled auth mode - allow all requests
	if (authMode === "disabled") {
		await next();
		return;
	}

	// Session auth mode
	const session = c.get("session");
	if (!session) {
		return c.json(
			{
				success: false,
				error: "Authentication required",
			},
			{ status: 401 },
		);
	}

	await next();
}

/**
 * Require admin middleware - blocks non-admin users
 */
export async function requireAdmin(c: AppContext, next: () => Promise<void>) {
	const authMode = c.get("authMode");

	// Disabled auth mode - allow all requests (no admin concept)
	if (authMode === "disabled") {
		await next();
		return;
	}

	// Session auth mode
	const session = c.get("session");
	if (!session) {
		return c.json(
			{
				success: false,
				error: "Authentication required",
			},
			{ status: 401 },
		);
	}

	if (!session.isAdmin) {
		return c.json(
			{
				success: false,
				error: "Admin privileges required",
			},
			{ status: 403 },
		);
	}

	await next();
}

/**
 * Get the session cookie name (for use in login/logout endpoints)
 */
export function getSessionCookieName(): string {
	return SESSION_COOKIE_NAME;
}
