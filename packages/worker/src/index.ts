import {
	type OpenAPIObjectConfigV31,
	extendZodWithOpenApi,
	fromHono,
} from "chanfana";
import { type ExecutionContext, Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import {
	initAuthMiddleware,
	parseAuthMode,
	requireAdmin,
	requireAuth,
	sessionAuthMiddleware,
} from "./foundation/middlewares/auth";
import { readOnlyMiddleware } from "./foundation/middlewares/readonly";
import { settings } from "./foundation/settings";
import {
	GrantAccess,
	ListUserAccess,
	RevokeAccess,
} from "./modules/auth/admin/access";
import { ForgotPassword } from "./modules/auth/forgotPassword";
import { Login } from "./modules/auth/login";
import { Logout } from "./modules/auth/logout";
import { GetMe } from "./modules/auth/me";
import { Register } from "./modules/auth/register";
import { ResetPassword } from "./modules/auth/resetPassword";
import { CreateFolder } from "./modules/buckets/createFolder";
import { CreateShareLink } from "./modules/buckets/createShareLink";
import { DeleteObject } from "./modules/buckets/deleteObject";
import { DeleteShareLink } from "./modules/buckets/deleteShareLink";
import { GetObject } from "./modules/buckets/getObject";
import { GetShareLink } from "./modules/buckets/getShareLink";
import { HeadObject } from "./modules/buckets/headObject";
import { ListObjects } from "./modules/buckets/listObjects";
import { ListShares } from "./modules/buckets/listShares";
import { MoveObject } from "./modules/buckets/moveObject";
import { CompleteUpload } from "./modules/buckets/multipart/completeUpload";
import { CreateUpload } from "./modules/buckets/multipart/createUpload";
import { PartUpload } from "./modules/buckets/multipart/partUpload";
import { PutMetadata } from "./modules/buckets/putMetadata";
import { PutObject } from "./modules/buckets/putObject";
import { dashboardIndex, dashboardRedirect } from "./modules/dashboard";
import { receiveEmail } from "./modules/emails/receiveEmail";
import { SendEmail } from "./modules/emails/sendEmail";
import { GetInfo } from "./modules/server/getInfo";
import { GetSettings } from "./modules/settings/getSettings";
import { UpdateSettings } from "./modules/settings/updateSettings";
import type { AppEnv, AppVariables, R2ExplorerConfig } from "./types";

// Re-export admin users from the correct file
import {
	CreateUser as AdminCreateUser,
	DeleteUser as AdminDeleteUser,
	ListUsers as AdminListUsers,
	UpdateUser as AdminUpdateUser,
} from "./modules/auth/admin/users";

export function R2Explorer(config?: R2ExplorerConfig) {
	extendZodWithOpenApi(z);
	config = config || {};
	if (config.readonly !== false) config.readonly = true;

	// Parse auth mode
	const authMode = parseAuthMode(config.auth);

	const openapiSchema: OpenAPIObjectConfigV31 = {
		openapi: "3.1.0",
		info: {
			title: "R2 Explorer API",
			version: settings.version,
		},
	};

	// Add security scheme based on auth mode
	if (authMode === "session") {
		openapiSchema["security"] = [
			{
				cookieAuth: [],
			},
		];
	}

	const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();

	// Inject config into context
	app.use("*", async (c, next) => {
		c.set("config", config);
		await next();
	});

	const openapi = fromHono(app, {
		schema: openapiSchema,
		raiseUnknownParameters: true,
		generateOperationIds: false,
	});

	// Register security scheme for session auth
	if (authMode === "session") {
		openapi.registry.registerComponent("securitySchemes", "cookieAuth", {
			type: "apiKey",
			in: "cookie",
			name: "r2_explorer_session",
		});
	}

	// CORS middleware (optional)
	if (config.cors === true) {
		app.use("/api/*", cors());
	}

	// ReadOnly middleware
	if (config.readonly === true) {
		app.use("/api/*", readOnlyMiddleware);
	}

	// Auth initialization middleware
	app.use("/api/*", initAuthMiddleware);

	// Session auth middleware (extracts session from cookie)
	if (authMode === "session") {
		app.use("/api/*", sessionAuthMiddleware);
	}

	// Public auth endpoints (no auth required)
	openapi.post("/api/v1/auth/register", Register);
	openapi.post("/api/v1/auth/login", Login);
	openapi.post("/api/v1/auth/logout", Logout);
	openapi.get("/api/v1/auth/me", GetMe);
	openapi.post("/api/v1/auth/forgot-password", ForgotPassword);
	openapi.post("/api/v1/auth/reset-password", ResetPassword);

	// Public settings endpoint
	openapi.get("/api/v1/settings", GetSettings);

	// Protected API routes - require authentication
	if (authMode !== "disabled") {
		app.use("/api/server/*", requireAuth);
		app.use("/api/buckets/*", requireAuth);
		app.use("/api/emails/*", requireAuth);
	}

	// Server info endpoint
	openapi.get("/api/server/config", GetInfo);

	// Bucket endpoints
	openapi.get("/api/buckets/:bucket", ListObjects);
	openapi.post("/api/buckets/:bucket/move", MoveObject);
	openapi.post("/api/buckets/:bucket/folder", CreateFolder);
	openapi.post("/api/buckets/:bucket/upload", PutObject);
	openapi.post("/api/buckets/:bucket/multipart/create", CreateUpload);
	openapi.post("/api/buckets/:bucket/multipart/upload", PartUpload);
	openapi.post("/api/buckets/:bucket/multipart/complete", CompleteUpload);
	openapi.post("/api/buckets/:bucket/delete", DeleteObject);
	openapi.on("head", "/api/buckets/:bucket/:key", HeadObject);
	openapi.get("/api/buckets/:bucket/:key/head", HeadObject);

	// Share link routes
	openapi.post("/api/buckets/:bucket/:key/share", CreateShareLink);
	openapi.get("/api/buckets/:bucket/shares", ListShares);
	openapi.delete("/api/buckets/:bucket/share/:shareId", DeleteShareLink);

	// Object routes (should be defined last among bucket routes)
	openapi.get("/api/buckets/:bucket/:key", GetObject);
	openapi.post("/api/buckets/:bucket/:key", PutMetadata);

	// Email endpoint
	openapi.post("/api/emails/send", SendEmail);

	// Admin endpoints - require admin privileges
	if (authMode === "session") {
		app.use("/api/v1/admin/*", requireAdmin);
		openapi.get("/api/v1/admin/users", AdminListUsers);
		openapi.post("/api/v1/admin/users", AdminCreateUser);
		openapi.put("/api/v1/admin/users/:userId", AdminUpdateUser);
		openapi.delete("/api/v1/admin/users/:userId", AdminDeleteUser);
		openapi.get("/api/v1/admin/users/:userId/access", ListUserAccess);
		openapi.post("/api/v1/admin/access", GrantAccess);
		openapi.delete("/api/v1/admin/access", RevokeAccess);
		openapi.put("/api/v1/settings", UpdateSettings);
	}

	// Public share access (no authentication required)
	openapi.get("/share/:shareId", GetShareLink);

	// Dashboard routes
	openapi.get("/", dashboardIndex);
	openapi.get("*", dashboardRedirect);

	app.all("*", () =>
		Response.json({ msg: "404, not found!" }, { status: 404 }),
	);

	return {
		async email(
			event: { raw: unknown; rawSize: unknown },
			env: AppEnv,
			context: ExecutionContext,
		) {
			await receiveEmail(event, env, context, config);
		},
		async fetch(request: Request, env: unknown, context: ExecutionContext) {
			return app.fetch(request, env as AppEnv, context);
		},
	};
}
