import {OpenAPIRoute, Path, Query} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from 'zod'

export class PutObject extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'post-bucket-upload-object',
    tags: ['Buckets'],
    summary: 'Upload object',
    parameters: {
      bucket: Path(String),
      key: Query(z.string().optional().describe('base64 encoded file key')),
      customMetadata: Query(z.string().optional().describe('base64 encoded json string')),
    },
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    if (context.config.readonly === true) return Response.json({msg: 'unauthorized'}, {status: 401})

    const bucket = env[data.params.bucket]

    let key = decodeURIComponent(escape(atob(data.query.key)))
    let customMetadata = undefined
    if (data.query.customMetadata) {
      customMetadata = decodeURIComponent(escape(atob(data.query.key)))
    }

    return await bucket.put(key, request.body, {customMetadata: customMetadata})
  }
}
