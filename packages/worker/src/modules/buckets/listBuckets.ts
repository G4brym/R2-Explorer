import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../../types";

export class ListBuckets extends OpenAPIRoute {
	schema = {
		operationId: "get-bucket-list",
		tags: ["Buckets"],
		summary: "List buckets",
	};

	async handle(c: AppContext) {
		const buckets = [];

		for (const [key, value] of Object.entries(c.env)) {
			if (
				value.get &&
				value.put &&
				value.get.toString().includes("function") &&
				value.put.toString().includes("function")
			) {
				buckets.push({ name: key });
			}
		}

		return {
			buckets: buckets,
		};
	}
}
