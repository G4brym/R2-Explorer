import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
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
		command: "npx wrangler dev --port 8787 -c e2e/wrangler.toml",
		url: "http://localhost:8787",
		cwd: __dirname,
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
	},
});
