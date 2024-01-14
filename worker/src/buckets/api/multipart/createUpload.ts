import {OpenAPIRoute, Path, Query} from "@cloudflare/itty-router-openapi";
import {Context} from "../../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from "zod";

export class CreateUpload extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'post-multipart-create-upload',
    tags: ['Multipart'],
    summary: 'Create upload',
    parameters: {
      bucket: Path(String),
      key: Query(z.string().describe('base64 encoded file key')),
      customMetadata: Query(z.string().nullable().optional().describe('base64 encoded json string')),
      httpMetadata: Query(z.string().nullable().optional().describe('base64 encoded json string')),
    }
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    if (context.config.readonly === true) return Response.json({msg: 'unauthorized'}, {status: 401})

    const bucket = env[data.params.bucket]

    const key = decodeURIComponent(escape(atob(data.query.key)))

    let customMetadata = undefined
    if (data.query.customMetadata) {
      customMetadata = JSON.parse(decodeURIComponent(escape(atob(data.query.customMetadata))))
    }

    let httpMetadata = undefined
    if (data.query.httpMetadata) {
      httpMetadata = JSON.parse(decodeURIComponent(escape(atob(data.query.httpMetadata))))
    }

    return await bucket.createMultipartUpload(key, {customMetadata: customMetadata, httpMetadata: httpMetadata});
  }
}
