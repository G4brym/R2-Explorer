import { ExecutionContext, Hono } from "hono";
import { cors } from "hono/cors";
import { AppContext, AppEnv, AppVariables, BasicAuth, R2ExplorerConfig } from "./types";
import { fromHono, OpenAPIObjectConfigV31 } from "chanfana";
import { basicAuth } from "hono/basic-auth";
import { readOnlyMiddleware } from "./foundation/middlewares/readonly";
import { accessMiddleware } from "./foundation/middlewares/authentication";
import { settings } from "./foundation/settings";
import { GetInfo } from "./modules/server/getInfo";
import { ListBuckets } from "./modules/buckets/listBuckets";
import { ListObjects } from "./modules/buckets/listObjects";
import { MoveObject } from "./modules/buckets/moveObject";
import { CreateFolder } from "./modules/buckets/createFolder";
import { PutObject } from "./modules/buckets/putObject";
import { CreateUpload } from "./modules/buckets/multipart/createUpload";
import { PartUpload } from "./modules/buckets/multipart/partUpload";
import { CompleteUpload } from "./modules/buckets/multipart/completeUpload";
import { DeleteObject } from "./modules/buckets/deleteObject";
import { HeadObject } from "./modules/buckets/headObject";
import { GetObject } from "./modules/buckets/getObject";
import { PutMetadata } from "./modules/buckets/putMetadata";
import { SendEmail } from "./modules/emails/sendEmail";
import { dashboardProxy } from "./foundation/dashbord";
import { receiveEmail } from "./modules/emails/receiveEmail";

export function R2Explorer(config?: R2ExplorerConfig) {
	config = config || {};
	if (config.readonly !== false) config.readonly = true;

	const openapiSchema: OpenAPIObjectConfigV31 = {
    openapi: "3.1",
    info: {
			title: "R2 Explorer API",
			version: settings.version,
		}
  };

	if (config.basicAuth) {
		openapiSchema["security"] = [
			{
				basicAuth: [],
			},
		];
	}

  const app = new Hono<{ Bindings: AppEnv, Variables: AppVariables }>();
  const openapi = fromHono(app, {
    schema: openapiSchema,
    raiseUnknownParameters: true,
    generateOperationIds: false,
  })

	if (config.cors === true) {
    app.use(
      '*',
      cors({
        origin: '*',
        allowMethods: ['*'],
        credentials: true,
      })
    )
	}

	if (config.readonly === true) {
    app.use(readOnlyMiddleware)
	}

	if (config.cfAccessTeamName) {
    app.use(accessMiddleware)
	}

	if (config.basicAuth) {
		openapi.registry.registerComponent("securitySchemes", "basicAuth", {
			type: "http",
			scheme: "basic",
		});
    app.use(
      basicAuth({
        verifyUser: (username, password, c: AppContext) => {
          const users = (Array.isArray(c.get('config').basicAuth) ? c.get('config').basicAuth : [c.get('config').basicAuth]) as BasicAuth[]

          for (const user of users) {
            if (
              user.username === username &&
              user.password === password
            ) {
              c.set('username', username)
              return true
            }
          }

          return false
        },
      })
    )
	}

  openapi.get("/api/server/config", GetInfo);

  openapi.get("/api/buckets", ListBuckets);
  openapi.get("/api/buckets/:bucket", ListObjects);
  openapi.post("/api/buckets/:bucket/move", MoveObject);
  openapi.post("/api/buckets/:bucket/folder", CreateFolder);
  openapi.post("/api/buckets/:bucket/upload", PutObject);
  openapi.post("/api/buckets/:bucket/multipart/create", CreateUpload);
  openapi.post("/api/buckets/:bucket/multipart/upload", PartUpload);
  openapi.post("/api/buckets/:bucket/multipart/complete", CompleteUpload);
  openapi.post("/api/buckets/:bucket/delete", DeleteObject);
  openapi.head("/api/buckets/:bucket/:key", HeadObject);
  openapi.get("/api/buckets/:bucket/:key/head", HeadObject); // There are some issues with calling the head method
  openapi.get("/api/buckets/:bucket/:key", GetObject);
  openapi.post("/api/buckets/:bucket/:key", PutMetadata);

  openapi.post("/api/emails/send", SendEmail);

  app.get("*", dashboardProxy);

	app.all("*", () =>
		Response.json({ msg: "404, not found!" }, { status: 404 }),
	);

	return {
    // TODO: improve event type
		async email(event: {raw: unknown, rawSize: unknown}, env: AppEnv, context: ExecutionContext) {
			await receiveEmail(event, env, context, config);
		},
		async fetch(request: Request, env: AppEnv, context: ExecutionContext) {
			return app.fetch(request, env, context)
		},
	};
}
