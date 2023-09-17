import { Int, OpenAPIRoute, Path, Query, RequestBody } from "@cloudflare/itty-router-openapi";
import {Context} from "../../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from "zod";

export class PartUpload extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'post-multipart-part-upload',
    tags: ['Multipart'],
    summary: 'Part upload',
    requestBody: new RequestBody({
        content: {
            'application/octet-stream': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    parameters: {
      bucket: Path(String),
      key: Query(z.string().describe('base64 encoded file key')),
      uploadId: Query(String),
      partNumber: Query(Int),
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

    const multipartUpload = bucket.resumeMultipartUpload(key, data.query.uploadId);

    try {
      return await multipartUpload.uploadPart(data.query.partNumber, request.body);

    } catch (error: any) {
      return new Response(error.message, {status: 400});
    }
  }
}
