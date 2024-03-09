import {OpenAPIRoute, Path} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";

export class ListBuckets extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'get-bucket-list',
    tags: ['Buckets'],
    summary: 'List buckets',
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    const buckets = []

    for (const [key, value] of Object.entries(env)) {
      // @ts-ignore - check if the field in Env is actually a R2 bucket by its properties
      if (value.get && value.put) {
        buckets.push({name: key})
      }
    }

    return {
      buckets: buckets,
    }
  }
}
