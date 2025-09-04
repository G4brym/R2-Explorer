import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../../types";

export class CreateFolderEx extends OpenAPIRoute {
  schema = {
    operationId: "post-bucket-create-folder-alt",
    tags: ["Buckets"],
    summary: "Create folder (alternate endpoint)",
    request: {
      params: z.object({
        bucket: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().describe("folder path (plain or base64)"),
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
      throw new HTTPException(500, {
        message: `Bucket binding not found: ${bucketName}`,
      });
    }

    let folderPath: string;
    try {
      folderPath = decodeURIComponent(escape(atob(data.body.name)));
    } catch {
      folderPath = data.body.name;
    }

    const folderKey = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

    const result = await bucket.put(folderKey, "");
    return c.json({ success: true, result });
  }
}

