import { AppContext } from "../../types";
import { OpenAPIRoute } from "chanfana";

export class ListBuckets extends OpenAPIRoute {
  schema = {
    operationId: "get-bucket-list",
    tags: ["Buckets"],
    summary: "List buckets"
  };

  async handle(c: AppContext) {
    const buckets = [];

    for (const [key, value] of Object.entries(c.env)) {
      // @ts-ignore - check if the field in Env is actually a R2 bucket by its properties
      if (value.get && value.put) {
        buckets.push({ name: key });
      }
    }

    return {
      buckets: buckets
    };
  }
}
