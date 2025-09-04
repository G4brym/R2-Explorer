import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../../types";

export class MoveFolder extends OpenAPIRoute {
  schema = {
    operationId: "post-bucket-move-folder",
    tags: ["Buckets"],
    summary: "Move (rename) a folder by copying objects to new prefix and deleting old",
    request: {
      params: z.object({
        bucket: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              from: z.string().optional(),
              to: z.string().optional(),
              oldPath: z.string().optional(),
              newPath: z.string().optional(),
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

    let fromRaw = data.body.from ?? data.body.oldPath;
    let toRaw = data.body.to ?? data.body.newPath;
    if (!fromRaw || !toRaw) {
      throw new HTTPException(400, { message: "Missing from/to path" });
    }

    let from: string;
    let to: string;
    try {
      from = decodeURIComponent(escape(atob(fromRaw)));
    } catch { from = fromRaw; }
    try {
      to = decodeURIComponent(escape(atob(toRaw)));
    } catch { to = toRaw; }

    const fromPrefix = from.endsWith("/") ? from : `${from}/`;
    const toPrefix = to.endsWith("/") ? to : `${to}/`;

    let cursor: string | undefined = undefined;
    let moved = 0;
    do {
      const page = await bucket.list({ prefix: fromPrefix, cursor });
      for (const obj of page.objects) {
        const newKey = toPrefix + obj.key.substring(fromPrefix.length);
        const getObj = await bucket.get(obj.key);
        if (getObj === null) continue;
        await bucket.put(newKey, getObj.body, {
          customMetadata: getObj.customMetadata,
          httpMetadata: getObj.httpMetadata,
        });
        await bucket.delete(obj.key);
        moved++;
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    // Move folder marker if exists
    const marker = await bucket.get(fromPrefix);
    if (marker) {
      await bucket.put(toPrefix, marker.body, { customMetadata: marker.customMetadata, httpMetadata: marker.httpMetadata });
      await bucket.delete(fromPrefix);
    }

    return c.json({ success: true, moved });
  }
}

