import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { createCors } from "itty-router";
import { validateAccessJwt } from "./authentication/api/access";
import { validateBasicAuth } from "./authentication/api/basic";
import { bucketsRouter } from "./buckets/router";
import { dashboardProxy } from "./dashbord";
import { receiveEmail } from "./emails/receiveEmail";
import { emailsRouter } from "./emails/router";
import type { R2ExplorerConfig } from "./interfaces";
import { serverRouter } from "./server/router";
import { config as settings } from "./settings";

export function R2Explorer(config?: R2ExplorerConfig) {
	config = config || {};
	if (config.readonly !== false) config.readonly = true;

	const openapiSchema = {
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

	const router = OpenAPIRouter({
		schema: openapiSchema,
	});
	const { preflight, corsify } = createCors({
		methods: ["*"],
	});

	if (config.cors === true) {
		router.all("/api*", preflight);
	}

	// Check Access JWT first
	if (config.cfAccessTeamName) {
		router.all("*", validateAccessJwt);
	}

	// Check basic auth
	if (config.basicAuth) {
		router.registry.registerComponent("securitySchemes", "basicAuth", {
			type: "http",
			scheme: "basic",
		});
		router.all("/api*", validateBasicAuth);
	}

	router.all("/api/server/*", serverRouter);
	router.all("/api/buckets/*", bucketsRouter);
	router.all("/api/emails/*", emailsRouter);

	router.original.get("*", dashboardProxy);

	router.all("*", () =>
		Response.json({ msg: "404, not found!" }, { status: 404 }),
	);

	return {
		async email(event, env, context) {
			await receiveEmail(event, env, {
				executionContext: context,
				config: config,
			});
		},
		async fetch(request, env, context) {
			let resp = await router.handle(request, env, {
				executionContext: context,
				config: config,
			});

			if (config.cors === true) {
				resp = corsify(resp);
			}

			return resp;
		},
	};
}
