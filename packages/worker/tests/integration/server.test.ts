import { createExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { settings } from "../../src/foundation/settings"; // To check version
import { createTestApp, createTestRequest } from "./setup"; // Assuming setup.ts is in the same directory

describe("Server Endpoints", () => {
	it("GET /api/server/config should return server information", async () => {
		const appConfig = {
			readonly: true,
			customSetting: "testValue", // Example of a custom config value
		};
		const app = createTestApp(appConfig);
		const request = createTestRequest("/api/server/config");

		// The 'vitest-pool-workers' should make 'c.env' available via bindings in vitest.config.ts.
		// Hono's app.fetch uses this environment when the second argument is {}.
		const response = await app.fetch(request, env, createExecutionContext());

		expect(response.status).toBe(200);
		const body = await response.json();

		expect(body.version).toBe(settings.version);
		expect(body.config.readonly).toBe(true);
		expect(body.config.customSetting).toBe("testValue");
		expect(body.config.basicAuth).toBeUndefined(); // Ensure basicAuth credentials are not exposed
		expect(body.auth).toBeUndefined(); // No auth by default in this test

		expect(body.buckets).toBeInstanceOf(Array);
		expect(body.buckets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "MY_TEST_BUCKET_1" }),
				expect.objectContaining({ name: "MY_TEST_BUCKET_2" }),
				expect.objectContaining({ name: "teste" }),
			]),
		);
		expect(body.buckets).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "NON_R2_BINDING" }),
			]),
		);
		// Check for at least the expected buckets (test environment may create additional ones)
		expect(body.buckets.length).toBeGreaterThanOrEqual(3);
	});

	it("GET /api/server/config should return auth info if authenticated via basic auth", async () => {
		const appConfig = {
			basicAuth: { username: "testuser", password: "testpassword" },
		};
		const app = createTestApp(appConfig);

		const headers = new Headers();
		headers.set("Authorization", `Basic ${btoa("testuser:testpassword")}`);
		const request = createTestRequest(
			"/api/server/config",
			"GET",
			undefined,
			headers,
		);

		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body.auth).toEqual({
			type: "basic-auth",
			username: "testuser",
		});
	});
});
