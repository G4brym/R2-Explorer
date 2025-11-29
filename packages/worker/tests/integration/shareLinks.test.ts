import { createExecutionContext, env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createTestRequest } from "./setup";

describe("Share Links Endpoints", () => {
	let app: ReturnType<typeof createTestApp>;
	let MY_TEST_BUCKET_1: R2Bucket;
	const testFileName = "test-file.txt";
	const testFileContent = "Hello World - Test File";

	beforeEach(async () => {
		app = createTestApp();
		MY_TEST_BUCKET_1 = env.MY_TEST_BUCKET_1;

		// Clean up bucket before each test
		if (MY_TEST_BUCKET_1) {
			const listed = await MY_TEST_BUCKET_1.list();
			const keysToDelete = listed.objects.map((obj) => obj.key);
			if (keysToDelete.length > 0) {
				await MY_TEST_BUCKET_1.delete(keysToDelete);
			}
		}

		// Create a test file
		await MY_TEST_BUCKET_1.put(testFileName, testFileContent);
	});

	afterEach(async () => {
		if (MY_TEST_BUCKET_1) {
			const listed = await MY_TEST_BUCKET_1.list();
			const keysToDelete = listed.objects.map((obj) => obj.key);
			if (keysToDelete.length > 0) {
				await MY_TEST_BUCKET_1.delete(keysToDelete);
			}
		}
	});

	describe("Create Share Link (POST /api/buckets/:bucket/:key/share)", () => {
		it.skip("should create a basic share link without options", async () => {
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{},
			);

			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as {
				shareId: string;
				shareUrl: string;
				expiresAt?: number;
			};

			expect(body.shareId).toBeDefined();
			expect(body.shareId).toHaveLength(10);
			expect(body.shareUrl).toContain(`/share/${body.shareId}`);
			expect(body.expiresAt).toBeUndefined();

			// Verify share metadata was stored
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${body.shareId}.json`,
			);
			expect(shareMetadata).toBeDefined();
		});

		it("should create share link with expiration", async () => {
			const encodedKey = btoa(testFileName);
			const expiresIn = 3600; // 1 hour
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ expiresIn },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const body = (await response.json()) as {
				shareId: string;
				shareUrl: string;
				expiresAt?: number;
			};

			expect(body.expiresAt).toBeDefined();
			expect(body.expiresAt).toBeGreaterThan(Date.now());
			expect(body.expiresAt).toBeLessThanOrEqual(Date.now() + expiresIn * 1000);

			// Verify metadata includes expiration
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${body.shareId}.json`,
			);
			const metadata = JSON.parse((await shareMetadata?.text()) || "{}");
			expect(metadata.expiresAt).toBe(body.expiresAt);
		});

		it("should create share link with password", async () => {
			const encodedKey = btoa(testFileName);
			const password = "test-password-123";
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ password },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const body = (await response.json()) as { shareId: string };

			// Verify password is hashed in metadata
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${body.shareId}.json`,
			);
			const metadata = JSON.parse((await shareMetadata?.text()) || "{}");
			expect(metadata.passwordHash).toBeDefined();
			expect(metadata.passwordHash).not.toBe(password); // Should be hashed
			expect(metadata.passwordHash).toHaveLength(64); // SHA-256 hex length
		});

		it("should create share link with max downloads", async () => {
			const encodedKey = btoa(testFileName);
			const maxDownloads = 5;
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ maxDownloads },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const body = (await response.json()) as { shareId: string };

			// Verify max downloads in metadata
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${body.shareId}.json`,
			);
			const metadata = JSON.parse((await shareMetadata?.text()) || "{}");
			expect(metadata.maxDownloads).toBe(maxDownloads);
			expect(metadata.currentDownloads).toBe(0);
		});

		it("should return 404 for non-existent file", async () => {
			const encodedKey = btoa("non-existent-file.txt");
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{},
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(404);
		});

		it("should create share link with all options", async () => {
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{
					expiresIn: 7200,
					password: "secure-password",
					maxDownloads: 10,
				},
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const body = (await response.json()) as {
				shareId: string;
				expiresAt: number;
			};

			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${body.shareId}.json`,
			);
			const metadata = JSON.parse((await shareMetadata?.text()) || "{}");

			expect(metadata.expiresAt).toBeDefined();
			expect(metadata.passwordHash).toBeDefined();
			expect(metadata.maxDownloads).toBe(10);
			expect(metadata.bucket).toBe("MY_TEST_BUCKET_1");
			expect(metadata.key).toBe(testFileName);
			expect(metadata.currentDownloads).toBe(0);
		});
	});

	describe("Access Share Link (GET /share/:shareId)", () => {
		let shareId: string;

		beforeEach(async () => {
			// Create a share for testing
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{},
			);
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as { shareId: string };
			shareId = body.shareId;
		});

		it("should access public share link without authentication", async () => {
			const request = new Request(`http://localhost/share/${shareId}`, {
				method: "GET",
			});

			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toBe(testFileContent);
			expect(response.headers.get("Content-Disposition")).toContain(
				testFileName,
			);
		});

		it.skip("should increment download counter on access", async () => {
			const request = new Request(`http://localhost/share/${shareId}`, {
				method: "GET",
			});

			await app.fetch(request, env, createExecutionContext());
			await app.fetch(request, env, createExecutionContext());

			// Check download counter
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${shareId}.json`,
			);
			const metadata = JSON.parse((await shareMetadata?.text()) || "{}");
			expect(metadata.currentDownloads).toBe(2);
		});

		it("should return 404 for non-existent share", async () => {
			const request = new Request("http://localhost/share/nonexistent", {
				method: "GET",
			});

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(404);
		});

		it("should return 410 for expired share", async () => {
			// Create expired share
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ expiresIn: -1 }, // Already expired
			);
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as { shareId: string };

			// Try to access expired share
			const accessRequest = new Request(
				`http://localhost/share/${body.shareId}`,
				{ method: "GET" },
			);
			const accessResponse = await app.fetch(
				accessRequest,
				env,
				createExecutionContext(),
			);

			expect(accessResponse.status).toBe(410);
		});

		it("should enforce download limits", async () => {
			// Create share with max 2 downloads
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ maxDownloads: 2 },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as { shareId: string };

			// Download twice (should work)
			const accessRequest1 = new Request(
				`http://localhost/share/${body.shareId}`,
				{ method: "GET" },
			);
			const accessRequest2 = new Request(
				`http://localhost/share/${body.shareId}`,
				{ method: "GET" },
			);
			const accessRequest3 = new Request(
				`http://localhost/share/${body.shareId}`,
				{ method: "GET" },
			);

			const response1 = await app.fetch(
				accessRequest1,
				env,
				createExecutionContext(),
			);
			const response2 = await app.fetch(
				accessRequest2,
				env,
				createExecutionContext(),
			);
			const response3 = await app.fetch(
				accessRequest3,
				env,
				createExecutionContext(),
			);

			expect(response1.status).toBe(200);
			expect(response2.status).toBe(200);
			expect(response3.status).toBe(403); // Limit reached
		});

		it("should require password for protected shares", async () => {
			// Create password-protected share
			const encodedKey = btoa(testFileName);
			const password = "secret123";
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ password },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as { shareId: string };

			// Try without password
			const accessRequest = new Request(
				`http://localhost/share/${body.shareId}`,
				{ method: "GET" },
			);
			const accessResponse = await app.fetch(
				accessRequest,
				env,
				createExecutionContext(),
			);
			expect(accessResponse.status).toBe(401);

			// Try with wrong password
			const wrongPasswordRequest = new Request(
				`http://localhost/share/${body.shareId}?password=wrong`,
				{ method: "GET" },
			);
			const wrongPasswordResponse = await app.fetch(
				wrongPasswordRequest,
				env,
				createExecutionContext(),
			);
			expect(wrongPasswordResponse.status).toBe(401);

			// Try with correct password
			const correctPasswordRequest = new Request(
				`http://localhost/share/${body.shareId}?password=${password}`,
				{ method: "GET" },
			);
			const correctPasswordResponse = await app.fetch(
				correctPasswordRequest,
				env,
				createExecutionContext(),
			);
			expect(correctPasswordResponse.status).toBe(200);
		});
	});

	describe("List Shares (GET /api/buckets/:bucket/shares)", () => {
		it("should list all shares in bucket", async () => {
			// Create multiple shares
			const encodedKey = btoa(testFileName);

			await app.fetch(
				createTestRequest(
					`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
					"POST",
					{},
				),
				env,
				createExecutionContext(),
			);

			await app.fetch(
				createTestRequest(
					`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
					"POST",
					{ maxDownloads: 5 },
				),
				env,
				createExecutionContext(),
			);

			// List shares
			const request = createTestRequest("/api/buckets/MY_TEST_BUCKET_1/shares");
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as {
				shares: Array<{
					shareId: string;
					shareUrl: string;
					key: string;
					isExpired: boolean;
					hasPassword: boolean;
				}>;
			};

			expect(body.shares).toHaveLength(2);
			expect(body.shares[0].shareId).toBeDefined();
			expect(body.shares[0].shareUrl).toContain("/share/");
			expect(body.shares[0].key).toBe(testFileName);
			expect(body.shares[0].isExpired).toBe(false);
		});

		it("should return empty array for bucket with no shares", async () => {
			const request = createTestRequest("/api/buckets/MY_TEST_BUCKET_1/shares");
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as { shares: Array<unknown> };
			expect(body.shares).toHaveLength(0);
		});

		it("should show expired status for shares", async () => {
			// Create expired share
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{ expiresIn: -1 },
			);
			await app.fetch(request, env, createExecutionContext());

			// List shares
			const listRequest = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1/shares",
			);
			const response = await app.fetch(
				listRequest,
				env,
				createExecutionContext(),
			);
			const body = (await response.json()) as {
				shares: Array<{ isExpired: boolean }>;
			};

			expect(body.shares[0].isExpired).toBe(true);
		});

		it("should indicate password protection status", async () => {
			const encodedKey = btoa(testFileName);

			// Create share with password
			await app.fetch(
				createTestRequest(
					`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
					"POST",
					{ password: "secret" },
				),
				env,
				createExecutionContext(),
			);

			// Create share without password
			await app.fetch(
				createTestRequest(
					`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
					"POST",
					{},
				),
				env,
				createExecutionContext(),
			);

			const request = createTestRequest("/api/buckets/MY_TEST_BUCKET_1/shares");
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as {
				shares: Array<{ hasPassword: boolean }>;
			};

			expect(body.shares).toHaveLength(2);
			expect(body.shares.some((s) => s.hasPassword === true)).toBe(true);
			expect(body.shares.some((s) => s.hasPassword === false)).toBe(true);
		});
	});

	describe("Delete Share Link (DELETE /api/buckets/:bucket/share/:shareId)", () => {
		let shareId: string;

		beforeEach(async () => {
			// Create a share for testing
			const encodedKey = btoa(testFileName);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/${encodedKey}/share`,
				"POST",
				{},
			);
			const response = await app.fetch(request, env, createExecutionContext());
			const body = (await response.json()) as { shareId: string };
			shareId = body.shareId;
		});

		it("should delete/revoke a share link", async () => {
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/share/${shareId}`,
				"DELETE",
			);

			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as { success: boolean };
			expect(body.success).toBe(true);

			// Verify share metadata was deleted
			const shareMetadata = await MY_TEST_BUCKET_1.get(
				`.r2-explorer/sharable-links/${shareId}.json`,
			);
			expect(shareMetadata).toBeNull();
		});

		it("should return 404 when deleting non-existent share", async () => {
			const request = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1/share/nonexistent",
				"DELETE",
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(404);
		});

		it("should make share inaccessible after deletion", async () => {
			// Delete the share
			await app.fetch(
				createTestRequest(
					`/api/buckets/MY_TEST_BUCKET_1/share/${shareId}`,
					"DELETE",
				),
				env,
				createExecutionContext(),
			);

			// Try to access deleted share
			const accessRequest = new Request(`http://localhost/share/${shareId}`, {
				method: "GET",
			});
			const response = await app.fetch(
				accessRequest,
				env,
				createExecutionContext(),
			);

			expect(response.status).toBe(404);
		});
	});
});
