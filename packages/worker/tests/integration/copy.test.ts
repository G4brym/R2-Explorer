import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createTestRequest } from "./setup";
import { env, createExecutionContext } from "cloudflare:test";

describe("CopyObject (POST /api/buckets/:bucket/copy)", () => {
	let app: ReturnType<typeof createTestApp>;
	let MY_TEST_BUCKET_1: R2Bucket;
	const BUCKET_NAME = "MY_TEST_BUCKET_1";
	const SOURCE_KEY = "test-source.txt";
	const SOURCE_CONTENT = "Hello R2 Explorer!";
	const SOURCE_CONTENT_TYPE = "text/plain";

	beforeEach(async () => {
		app = createTestApp();
		MY_TEST_BUCKET_1 = env.MY_TEST_BUCKET_1;

		if (MY_TEST_BUCKET_1) {
			const listed = await MY_TEST_BUCKET_1.list();
			const keysToDelete = listed.objects.map((obj) => obj.key);
			if (keysToDelete.length > 0) {
				await MY_TEST_BUCKET_1.delete(keysToDelete);
			}
			await MY_TEST_BUCKET_1.put(SOURCE_KEY, SOURCE_CONTENT, {
				httpMetadata: { contentType: SOURCE_CONTENT_TYPE },
				customMetadata: { project: "r2-explorer", version: "1.0" },
			});
		}
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

	it("should copy an existing file to a new destination", async () => {
		const destKey = "test-source (copy).txt";
		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: btoa(SOURCE_KEY),
				destinationKey: btoa(destKey),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		await response.text();

		// Verify copy exists
		const copyObj = await MY_TEST_BUCKET_1.get(destKey);
		expect(copyObj).not.toBeNull();
		const copyContent = await copyObj!.text();
		expect(copyContent).toBe(SOURCE_CONTENT);

		// Verify original still exists
		const sourceObj = await MY_TEST_BUCKET_1.get(SOURCE_KEY);
		expect(sourceObj).not.toBeNull();
		const sourceContent = await sourceObj!.text();
		expect(sourceContent).toBe(SOURCE_CONTENT);
	});

	it("should preserve custom metadata on the copy", async () => {
		const destKey = "test-source (copy).txt";
		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: btoa(SOURCE_KEY),
				destinationKey: btoa(destKey),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		await response.text();

		const copyHead = await MY_TEST_BUCKET_1.head(destKey);
		expect(copyHead).not.toBeNull();
		expect(copyHead?.customMetadata).toEqual({
			project: "r2-explorer",
			version: "1.0",
		});
	});

	it("should preserve HTTP metadata on the copy", async () => {
		const destKey = "test-source (copy).txt";
		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: btoa(SOURCE_KEY),
				destinationKey: btoa(destKey),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		await response.text();

		const copyHead = await MY_TEST_BUCKET_1.head(destKey);
		expect(copyHead).not.toBeNull();
		expect(copyHead?.httpMetadata?.contentType).toBe(SOURCE_CONTENT_TYPE);
	});

	it("should return 404 when source object does not exist", async () => {
		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: btoa("non-existent.txt"),
				destinationKey: btoa("copy.txt"),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(404);
		const body = await response.text();
		expect(body).toContain("Source object not found");
	});

	it("should return 500 when bucket binding does not exist", async () => {
		const request = createTestRequest(
			"/api/buckets/NON_EXISTENT_BUCKET/copy",
			"POST",
			{
				sourceKey: btoa(SOURCE_KEY),
				destinationKey: btoa("copy.txt"),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(500);
		const body = await response.text();
		expect(body).toContain("Bucket binding not found: NON_EXISTENT_BUCKET");
	});

	it("should not delete the source object after copy", async () => {
		const destKey = "test-source (copy).txt";
		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: btoa(SOURCE_KEY),
				destinationKey: btoa(destKey),
			},
			{ "Content-Type": "application/json" },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		await response.text();

		// Verify both source and destination exist
		const sourceObj = await MY_TEST_BUCKET_1.head(SOURCE_KEY);
		expect(sourceObj).not.toBeNull();

		const destObj = await MY_TEST_BUCKET_1.head(destKey);
		expect(destObj).not.toBeNull();
	});
});
