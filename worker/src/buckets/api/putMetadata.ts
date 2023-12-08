import {OpenAPIRoute, Path, Query} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from 'zod'

export class PutMetadata extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'post-bucket-put-object-metadata',
    tags: ['Buckets'],
    summary: 'Update object metadata',
    parameters: {
      bucket: Path(String),
      key: Path(z.string().describe('base64 encoded file key')),
    },
    requestBody: z.object({
      customMetadata: z.record(z.string(), z.any())
    }).openapi("Object metadata")
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    if (context.config.readonly === true) return Response.json({msg: 'unauthorized'}, {status: 401})

    const bucket = env[data.params.bucket]

    const key = decodeURIComponent(escape(atob(data.params.key)))

    const object = await bucket.get(key)
    return await bucket.put(key, object.body, {customMetadata: data.body.customMetadata})
  }
}
