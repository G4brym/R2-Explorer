import { defineConfig } from "@playwright/test";
import path from "node:path";

const rootDir = path.resolve(__dirname, "../..");

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: "http://localhost:8787",
		screenshot: "only-on-failure",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
	webServer: {
		command:
			"npx wrangler dev --port 8787 -c packages/worker/dev/wrangler-e2e.toml",
		url: "http://localhost:8787",
		cwd: rootDir,
		reuseExistingServer: false,
		timeout: 30_000,
	},
});
