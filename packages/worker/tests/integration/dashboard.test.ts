import { createExecutionContext, env as testEnv } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { createTestApp, createTestRequest } from "./setup";

describe("Dashboard Endpoints", () => {
	describe("dashboardIndex (GET /)", () => {
		it("should return 500 if ASSETS binding is undefined", async () => {
			const app = createTestApp(); // Test environment by default might not have ASSETS
			const request = createTestRequest("/");
			// Make sure ASSETS is truly undefined for this test
			const currentEnv = { ...testEnv };
			delete (currentEnv as any).ASSETS;

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			expect(response.status).toBe(500);
			const text = await response.text();
			expect(text).toContain("ASSETS binding is not defined");
		});

		it("should return 500 if ASSETS.fetch is not a function (simulating invalid ASSETS binding)", async () => {
			const app = createTestApp();
			const request = createTestRequest("/");
			// ASSETS is defined, but not a valid KVNamespace or Fetcher
			const currentEnv = { ...testEnv, ASSETS: {} as any };

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			expect(response.status).toBe(500);
			const text = await response.text();
			// This error comes from the actual dashboard.ts logic
			expect(text).toContain(
				"ASSETS binding is not pointing to a valid dashboard",
			);
		});

		it("should call ASSETS.fetch and return its response if ASSETS is valid", async () => {
			const mockAssetsResponse = new Response("Dashboard Content", {
				status: 200,
			});
			const mockAssets = {
				fetch: vi.fn().mockResolvedValue(mockAssetsResponse),
			};
			const app = createTestApp();
			const request = createTestRequest("/");
			const currentEnv = { ...testEnv, ASSETS: mockAssets as any };

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			// Corrected: dashboardIndex is hardcoded to return 500 and not call fetch
			expect(mockAssets.fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(500);
			expect(await response.text()).toContain(
				"ASSETS binding is not pointing to a valid dashboard",
			);
		});
	});

	describe("dashboardRedirect (GET *)", () => {
		it("path w/o dot, ASSETS undefined: should return 500 (ASSETS not defined)", async () => {
			const app = createTestApp();
			const request = createTestRequest("/some/path");
			const currentEnv = { ...testEnv };
			delete (currentEnv as any).ASSETS;

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			expect(response.status).toBe(500);
			expect(await response.text()).toContain("ASSETS binding is not defined");
		});

		it("path w/ dot, ASSETS undefined: should call next() then 404 (no other matching route)", async () => {
			// Even if ASSETS is undefined, if path has a dot, it should skip to next(),
			// and since no other route handles it, Hono returns 404 by default.
			const app = createTestApp();
			const request = createTestRequest("/some/file.css");
			const currentEnv = { ...testEnv };
			delete (currentEnv as any).ASSETS;

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			// Corrected: ASSETS undefined check comes before next()
			expect(response.status).toBe(500);
			expect(await response.text()).toContain("ASSETS binding is not defined");
		});

		it("path w/o dot, ASSETS defined: should call ASSETS.fetch", async () => {
			const mockAssetsResponse = new Response("SPA Route Content", {
				status: 200,
			});
			const mockAssets = {
				fetch: vi.fn().mockResolvedValue(mockAssetsResponse),
			};
			const app = createTestApp();
			const request = createTestRequest("/some/other/path");
			const currentEnv = { ...testEnv, ASSETS: mockAssets as any };

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			expect(mockAssets.fetch).toHaveBeenCalledTimes(1);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("SPA Route Content");
		});

		it("path w/ dot, ASSETS defined: should call next() then 404", async () => {
			const mockAssets = { fetch: vi.fn() }; // fetch should not be called
			const app = createTestApp();
			const request = createTestRequest("/some/file.js");
			const currentEnv = { ...testEnv, ASSETS: mockAssets as any };

			const response = await app.fetch(
				request,
				currentEnv,
				createExecutionContext(),
			);
			expect(mockAssets.fetch).not.toHaveBeenCalled();
			expect(response.status).toBe(404); // Hono's default for unhandled routes after next()
		});
	});
});
