import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../../types";

export class DeleteFolder extends OpenAPIRoute {
  schema = {
    operationId: "post-bucket-delete-folder",
    tags: ["Buckets"],
    summary: "Delete a folder (all objects under a prefix)",
    request: {
      params: z.object({
        bucket: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              path: z.string().describe("folder path (plain or base64)"),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const bucketName = data.params.bucket;
    const bucket = c.env[bucketName] as R2Bucket | undefined;
    if (!bucket) {
      throw new HTTPException(500, { message: `Bucket binding not found: ${bucketName}` });
    }

    let pathRaw = data.body.path;
    let path: string;
    try { path = decodeURIComponent(escape(atob(pathRaw))); } catch { path = pathRaw; }
    const prefix = path.endsWith("/") ? path : `${path}/`;

    let cursor: string | undefined = undefined;
    let deleted = 0;
    do {
      const page = await bucket.list({ prefix, cursor });
      if (page.objects.length > 0) {
        const keys = page.objects.map(o => o.key);
        await bucket.delete(keys);
        deleted += keys.length;
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    // Delete folder marker if present
    await bucket.delete(prefix);

    return c.json({ success: true, deleted });
  }
}

