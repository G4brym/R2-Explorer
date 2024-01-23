import {OpenAPIRoute, Path, Query} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from 'zod'

export class HeadObject extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'Head-bucket-object',
    tags: ['Buckets'],
    summary: 'Get Object',
    parameters: {
      bucket: Path(String),
      key: Path(z.string().describe('base64 encoded file key')),
    },
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    const bucket = env[data.params.bucket]

    let filePath
    try {
      filePath = decodeURIComponent(escape(atob(data.params.key)));
    } catch (e) {
      filePath = decodeURIComponent(escape(atob(decodeURIComponent(data.params.key))));
    }

    const object = await bucket.head(filePath)

    if (object === null) {
      return Response.json({msg: 'Object Not Found'}, {status: 404})
    }

    return object
  }
}
