import { OpenAPIRoute, Path, Query } from "@cloudflare/itty-router-openapi";
import {Context} from "../../interfaces";
import {OpenAPIRouteSchema} from "@cloudflare/itty-router-openapi/dist/src/types";
import {z} from 'zod'

export class ListObjects extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: 'get-bucket-list-objects',
    tags: ['Buckets'],
    summary: 'List objects',
    parameters: {
      bucket: Path(String),
      limit: Query(Number, {required: false}),
      prefix: Query(z.string().nullable().optional().describe('base64 encoded prefix'),),
      cursor: Query(z.string().nullable().optional()),
      delimiter: Query(z.string().nullable().optional()),
      include: Query(z.string().array().optional()),
    },
  }

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    const bucket = env[data.params.bucket]

    return await bucket.list({
      limit: data.query.limit,
      prefix: data.query.prefix ? decodeURIComponent(escape(atob(data.query.prefix))) : undefined,
      cursor: data.query.cursor,
      delimiter: (data.query.delimiter) ? data.query.delimiter : '',
      include: data.query.include,
    })
  }
}
