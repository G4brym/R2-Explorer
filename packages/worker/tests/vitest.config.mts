// @ts-ignore
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	esbuild: {
		target: "ES2022",
	},
	test: {
		poolOptions: {
			workers: {
        singleWorker: true,
				wrangler: { configPath: "../dev/wrangler.toml" },
				miniflare: {
					compatibilityDate: "2024-11-06", // Or your project's compatibility date
					compatibilityFlags: ["nodejs_compat"], // Add any necessary flags
					r2Persist: false,
					isolatedStorage: true,
					r2Buckets: {
						MY_TEST_BUCKET_1: "MY_TEST_BUCKET_1",
						MY_TEST_BUCKET_2: "MY_TEST_BUCKET_2",
						teste: "teste",
					},
					bindings: {
						NON_R2_BINDING: { type: "var", value: "some_value" }, // For testing non-bucket bindings
						// Add other global bindings if needed by the worker, e.g., KV or D1
						// EMAIL_SENDER: { type: "send_email", ... } // if using abstract senders for emails
					},
				},
			},
		},
		coverage: {
			enabled: false,
			provider: "istanbul",
			include: ["src/**"],
		},
	},
});
