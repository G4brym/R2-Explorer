import { cloudflareAccess } from "@hono/cloudflare-access";
import {
	type OpenAPIObjectConfigV31,
	extendZodWithOpenApi,
	fromHono,
} from "chanfana";
import { type ExecutionContext, Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { cors } from "hono/cors";
import { z } from "zod";
import { readOnlyMiddleware } from "./foundation/middlewares/readonly";
import { healthGroupIsolationMiddleware } from "./foundation/middlewares/healthGroupIsolation";
import { autoCategorizationMiddleware } from "./foundation/middlewares/autoCategorization";
import { settings } from "./foundation/settings";
import { CreateFolder } from "./modules/buckets/createFolder";
import { DeleteObject } from "./modules/buckets/deleteObject";
import { DownloadZip } from "./modules/buckets/downloadZip";
import { GetObject } from "./modules/buckets/getObject";
import { HeadObject } from "./modules/buckets/headObject";
import { ListObjects } from "./modules/buckets/listObjects";
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
import { ClassifyDocument } from "./modules/ai/classifyDocument";
import { CreateFolderEx } from "./modules/buckets/folders/createFolderEx";
import { MoveFolder } from "./modules/buckets/folders/moveFolder";
import { DeleteFolder } from "./modules/buckets/folders/deleteFolder";
import type {
	AppContext,
	AppEnv,
	AppVariables,
	BasicAuthType,
	R2ExplorerConfig,
} from "./types";

export function R2Explorer(config?: R2ExplorerConfig) {
	extendZodWithOpenApi(z);
	config = config || {};
	if (config.readonly !== false) config.readonly = true;

	const openapiSchema: OpenAPIObjectConfigV31 = {
		openapi: "3.1.0",
		info: {
			title: "R2 Explorer API",
			version: settings.version,
		},
	};

	if (config.basicAuth) {
		openapiSchema["security"] = [
			{
				basicAuth: [],
			},
		];
	}

	const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();
	app.use("*", async (c, next) => {
		c.set("config", config);
		await next();
	});

	const openapi = fromHono(app, {
		schema: openapiSchema,
		raiseUnknownParameters: true,
		generateOperationIds: false,
	});

	if (config.cors === true) {
		app.use("/api/*", cors());
	}

	if (config.readonly === true) {
		app.use("/api/*", readOnlyMiddleware);
	}

	if (config.cfAccessTeamName) {
		app.use("/api/*", cloudflareAccess(config.cfAccessTeamName));
		app.use("/api/*", async (c, next) => {
			c.set("authentication_type", "cloudflare-access");
			c.set("authentication_username", c.get("accessPayload").email);
			await next();
		});
	}

	if (config.basicAuth) {
		openapi.registry.registerComponent("securitySchemes", "basicAuth", {
			type: "http",
			scheme: "basic",
		});
		app.use(
			"/api/*",
			basicAuth({
				invalidUserMessage: "Authentication error: Basic Auth required",
				verifyUser: (username, password, c: AppContext) => {
					const users = (
						Array.isArray(c.get("config").basicAuth)
							? c.get("config").basicAuth
							: [c.get("config").basicAuth]
					) as BasicAuthType[];

					for (const user of users) {
						if (user.username === username && user.password === password) {
							c.set("authentication_type", "basic-auth");
							c.set("authentication_username", username);
							return true;
						}
					}

					return false;
				},
			}),
		);
	}

	// SpendRule: Add health group isolation middleware after authentication
	if (config.basicAuth) {
		app.use("/api/buckets/*", healthGroupIsolationMiddleware);
		app.use("/api/buckets/*", autoCategorizationMiddleware);
	}

	openapi.get("/api/server/config", GetInfo);
	
	// AI endpoints - require authentication
	if (config.basicAuth) {
		app.use("/api/ai/*", healthGroupIsolationMiddleware);
	}
	openapi.post("/api/ai/classify", ClassifyDocument);

	openapi.get("/api/buckets/:bucket", ListObjects);
	openapi.get("/api/buckets/:bucket/download/zip", DownloadZip);
	openapi.post("/api/buckets/:bucket/folders", CreateFolderEx);
	openapi.post("/api/buckets/:bucket/folders/move", MoveFolder);
	openapi.post("/api/buckets/:bucket/folders/delete", DeleteFolder);
	openapi.post("/api/buckets/:bucket/move", MoveObject);
	openapi.post("/api/buckets/:bucket/folder", CreateFolder);
	openapi.post("/api/buckets/:bucket/upload", PutObject);
	openapi.post("/api/buckets/:bucket/multipart/create", CreateUpload);
	openapi.post("/api/buckets/:bucket/multipart/upload", PartUpload);
	openapi.post("/api/buckets/:bucket/multipart/complete", CompleteUpload);
	openapi.post("/api/buckets/:bucket/delete", DeleteObject);
	openapi.on("head", "/api/buckets/:bucket/:key", HeadObject);
	openapi.get("/api/buckets/:bucket/:key/head", HeadObject); // There are some issues with calling the head method
	openapi.get("/api/buckets/:bucket/:key", GetObject);
	openapi.post("/api/buckets/:bucket/:key", PutMetadata);

	openapi.post("/api/emails/send", SendEmail);

	openapi.get("/", dashboardIndex);
	openapi.get("*", dashboardRedirect);

	app.all("*", () =>
		Response.json({ msg: "404, not found!" }, { status: 404 }),
	);

	return {
		// TODO: improve event type
		async email(
			event: { raw: unknown; rawSize: unknown },
			env: AppEnv,
			context: ExecutionContext,
		) {
			await receiveEmail(event, env, context, config);
		},
		async fetch(request: Request, env: AppEnv, context: ExecutionContext) {
			return app.fetch(request, env, context);
		},
	};
}
