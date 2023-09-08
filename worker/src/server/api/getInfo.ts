import {OpenAPIRoute} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {config} from "../../settings";

export class GetInfo extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'get-server-info',
    tags: ['Server'],
    summary: 'Get server info',
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    const serverConfig = {...context.config}
    delete serverConfig.basicAuth

    return {
      version: config.version,
      config: serverConfig,
      user: {
        username: context.username
      }
    }
  }
}
