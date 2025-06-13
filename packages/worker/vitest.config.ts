import { defineWorkersPool } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		pool: "@cloudflare/vitest-pool-workers",
		poolOptions: {
			workers: {
				wrangler: { configPath: "./dev/wrangler.toml" },
				miniflare: {
					compatibilityDate: "2024-11-06", // Or your project's compatibility date
					compatibilityFlags: ["nodejs_compat"], // Add any necessary flags
					bindings: {
						MY_TEST_BUCKET_1: {
							type: "r2",
							bucketName: "my-test-bucket-1-for-vitest",
						},
						MY_TEST_BUCKET_2: {
							type: "r2",
							bucketName: "my-test-bucket-2-for-vitest",
						},
						NON_R2_BINDING: { type: "var", value: "some_value" }, // For testing non-bucket bindings
						// Add other global bindings if needed by the worker, e.g., KV or D1
						// EMAIL_SENDER: { type: "send_email", ... } // if using abstract senders for emails
					},
				},
			},
		},
	},
});
