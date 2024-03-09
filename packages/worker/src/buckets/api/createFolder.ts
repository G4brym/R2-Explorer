import {OpenAPIRoute, Path, Query} from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from "zod";

export class CreateFolder extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'post-bucket-create-folder',
    tags: ['Buckets'],
    summary: 'Create folder',
    parameters: {
      bucket: Path(String),
    },
    requestBody: {
      key: z.string().describe('base64 encoded file key'),
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
    const key = decodeURIComponent(escape(atob(data.body.key)))

    return await bucket.put(key, 'R2 Explorer Folder')
  }
}
