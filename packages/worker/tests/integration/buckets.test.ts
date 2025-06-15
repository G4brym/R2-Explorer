import { Buffer } from "node:buffer"; // For btoa with binary data if needed, and for creating ArrayBuffer
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createTestRequest } from "./setup";
import { env, createExecutionContext } from "cloudflare:test"

// Main describe block for all bucket endpoints
describe.skip("Bucket Endpoints", () => {
	let app: ReturnType<typeof createTestApp>;
	let MY_TEST_BUCKET_1: R2Bucket;

	beforeEach(async () => {
		app = createTestApp(); // Create a new app instance for each test
		MY_TEST_BUCKET_1 = env.MY_TEST_BUCKET_1;

		// Clean up bucket before each test
		if (MY_TEST_BUCKET_1) {
			const listed = await MY_TEST_BUCKET_1.list();
			const keysToDelete = listed.objects.map((obj) => obj.key);
			if (listed.truncated) {
				console.warn(
					"Bucket cleanup might be incomplete due to pagination in MY_TEST_BUCKET_1.",
				);
			}
			if (keysToDelete.length > 0) {
				await MY_TEST_BUCKET_1.delete(keysToDelete);
			}
		} else {
			console.warn("MY_TEST_BUCKET_1 binding not found in global beforeEach.");
		}
	});

	afterEach(async () => {
		// Global cleanup if any, or specific cleanups can be in endpoint describes
		if (MY_TEST_BUCKET_1) {
			const listed = await MY_TEST_BUCKET_1.list();
			const keysToDelete = listed.objects.map((obj) => obj.key);
			if (keysToDelete.length > 0) {
				await MY_TEST_BUCKET_1.delete(keysToDelete);
			}
		}
	});

	// Tests for ListObjects (from previous step, ensure it uses the global app and MY_TEST_BUCKET_1)
	describe("ListObjects (GET /api/buckets/:bucket)", () => {
		it("GET /api/buckets/:bucket - should list objects in a bucket", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			await MY_TEST_BUCKET_1.put("test-object-1.txt", "Hello World 1");
			await MY_TEST_BUCKET_1.put("test-object-2.txt", "Hello World 2");

			const request = createTestRequest("/api/buckets/MY_TEST_BUCKET_1");
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as R2Objects;
			expect(body.objects.length).toBe(2);
			expect(body.objects.map((o) => o.key).sort()).toEqual(
				["test-object-1.txt", "test-object-2.txt"].sort(),
			);
			expect(body.truncated).toBe(false);
			expect(body.cursor).toBeUndefined();
		});

		it("GET /api/buckets/:bucket - should handle empty bucket", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");

			const request = createTestRequest("/api/buckets/MY_TEST_BUCKET_1");
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as R2Objects;
			expect(body.objects.length).toBe(0);
			expect(body.truncated).toBe(false);
		});

		it("GET /api/buckets/:bucket - should list objects with prefix (base64 encoded)", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			await MY_TEST_BUCKET_1.put("folder1/file1.txt", "f1");
			await MY_TEST_BUCKET_1.put("folder1/file2.txt", "f2");
			await MY_TEST_BUCKET_1.put("folder2/file3.txt", "f3");

			const prefix = "folder1/";
			const base64Prefix = btoa(prefix);
			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1?prefix=${encodeURIComponent(base64Prefix)}`,
			);
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as R2Objects;
			expect(body.objects.length).toBe(2);
			expect(body.objects.map((o) => o.key).sort()).toEqual(
				["folder1/file1.txt", "folder1/file2.txt"].sort(),
			);
		});

		it("GET /api/buckets/:bucket - should list objects with delimiter", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			await MY_TEST_BUCKET_1.put("folderA/file1.txt", "fa1");
			await MY_TEST_BUCKET_1.put("folderA/subfolderB/file2.txt", "fa_fb2");
			await MY_TEST_BUCKET_1.put("folderC/file3.txt", "fc3");

			const request = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1?delimiter=/",
			);
			const response = await app.fetch(request, env, createExecutionContext());

			expect(response.status).toBe(200);
			const body = (await response.json()) as R2Objects;
			expect(body.delimitedPrefixes).toBeInstanceOf(Array);
			expect(body.delimitedPrefixes?.sort()).toEqual(
				["folderA/", "folderC/"].sort(),
			);
			expect(body.objects.length).toBe(0);
		});

		it("GET /api/buckets/:bucket - should handle limit and cursor for pagination", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			await MY_TEST_BUCKET_1.put("obj1.txt", "1");
			await MY_TEST_BUCKET_1.put("obj2.txt", "2");
			await MY_TEST_BUCKET_1.put("obj3.txt", "3");

			const request1 = createTestRequest(
				// Corrected formatting
				"/api/buckets/MY_TEST_BUCKET_1?limit=2",
			);
			const response1 = await app.fetch(request1, env, createExecutionContext());
			expect(response1.status).toBe(200);
			const body1 = (await response1.json()) as R2Objects;
			expect(body1.objects.length).toBe(2);
			expect(body1.truncated).toBe(true);
			expect(body1.cursor).toBeDefined();

			const request2 = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1?limit=2&cursor=${body1.cursor}`,
			);
			const response2 = await app.fetch(request2, env, createExecutionContext());
			expect(response2.status).toBe(200);
			const body2 = (await response2.json()) as R2Objects;
			expect(body2.objects.length).toBe(1);
			expect(body2.truncated).toBe(false);
		});

		it("GET /api/buckets/NON_EXISTENT_BUCKET - should return 500 if bucket binding does not exist", async () => {
			const request = createTestRequest("/api/buckets/NON_EXISTENT_BUCKET");
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(500);
		});
	});

	describe("PutObject (POST /api/buckets/:bucket/upload)", () => {
		it("should upload an object successfully", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");

			const objectKey = "new-object.txt";
			const base64ObjectKey = btoa(objectKey);
			const objectContent = "This is the content of the new object.";
			const blobBody = new Blob([objectContent], {
				type: "application/octet-stream",
			});

			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/upload?key=${encodeURIComponent(base64ObjectKey)}`,
				"POST",
				blobBody,
				{ "Content-Type": "application/octet-stream" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const responseBody = (await response.json()) as R2Object;
			expect(responseBody.key).toBe(objectKey);
			expect(responseBody.size).toBe(objectContent.length);

			// Verify by fetching the object directly from R2 mock
			const r2Object = await MY_TEST_BUCKET_1.get(objectKey);
			expect(r2Object).not.toBeNull();
			expect(await r2Object?.text()).toBe(objectContent);
		});

		it("should upload an object with custom and http metadata", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			const objectKey = "metadata-object.json";
			const base64ObjectKey = btoa(objectKey);
			const objectContent = JSON.stringify({ data: "test" });
			const blobBody = new Blob([objectContent], {
				type: "application/octet-stream",
			});

			const customMetadata = { uploadedBy: "test-user", version: "1.0" };
			const httpMetadata: R2HTTPMetadata = {
				contentType: "application/json",
				cacheControl: "max-age=3600",
			};

			const base64CustomMetadata = btoa(JSON.stringify(customMetadata));
			const base64HttpMetadata = btoa(JSON.stringify(httpMetadata));

			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/upload?key=${encodeURIComponent(base64ObjectKey)}&customMetadata=${encodeURIComponent(base64CustomMetadata)}&httpMetadata=${encodeURIComponent(base64HttpMetadata)}`,
				"POST",
				blobBody,
				{ "Content-Type": "application/octet-stream" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);
			const responseBody = (await response.json()) as R2Object;
			expect(responseBody.key).toBe(objectKey);
			expect(responseBody.customMetadata).toEqual(customMetadata);
			expect(responseBody.httpMetadata?.contentType).toBe(
				httpMetadata.contentType,
			);
			expect(responseBody.httpMetadata?.cacheControl).toBe(
				httpMetadata.cacheControl,
			);

			// Verify directly
			const r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).not.toBeNull();
			expect(r2Object?.customMetadata).toEqual(customMetadata);
			expect(r2Object?.httpMetadata.contentType).toBe(httpMetadata.contentType);
			expect(r2Object?.httpMetadata.cacheControl).toBe(
				httpMetadata.cacheControl,
			);
		});

		it("should overwrite an existing object", async () => {
			if (!MY_TEST_BUCKET_1)
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			const objectKey = "overwrite-me.txt";
			const base64ObjectKey = btoa(objectKey);

			// First upload
			await MY_TEST_BUCKET_1.put(objectKey, "Initial content");

			const newObjectContent = "This is the overwritten content.";
			const blobBody = new Blob([newObjectContent], {
				type: "application/octet-stream",
			});

			const request = createTestRequest(
				`/api/buckets/MY_TEST_BUCKET_1/upload?key=${encodeURIComponent(base64ObjectKey)}`,
				"POST",
				blobBody,
				{ "Content-Type": "application/octet-stream" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const r2Object = await MY_TEST_BUCKET_1.get(objectKey);
			expect(await r2Object?.text()).toBe(newObjectContent);
		});

		it("POST /api/buckets/NON_EXISTENT_BUCKET/upload - should return 500 if bucket binding does not exist", async () => {
			const base64ObjectKey = btoa("test.txt");
			const blobBody = new Blob(["content"], {
				type: "application/octet-stream",
			});
			const request = createTestRequest(
				`/api/buckets/NON_EXISTENT_BUCKET/upload?key=${encodeURIComponent(base64ObjectKey)}`,
				"POST",
				blobBody,
				{ "Content-Type": "application/octet-stream" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(500);
		});
	});

	describe("DeleteObject (POST /api/buckets/:bucket/delete)", () => {
		it("should delete an existing object", async () => {
			if (!MY_TEST_BUCKET_1) {
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			}

			const objectKey = "to-be-deleted.txt";
			await MY_TEST_BUCKET_1.put(objectKey, "Some content");

			// Verify it exists
			let r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).not.toBeNull();

			const base64ObjectKey = btoa(objectKey);
			const request = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1/delete",
				"POST",
				{ key: base64ObjectKey }, // Body is JSON with base64 encoded key
				{ "Content-Type": "application/json" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({ success: true });

			// Verify it's deleted
			r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).toBeNull();
		});

		it("should return success when attempting to delete a non-existent object", async () => {
			if (!MY_TEST_BUCKET_1) {
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			}

			const objectKey = "does-not-exist.txt";
			// Ensure it doesn't exist
			const r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).toBeNull();

			const base64ObjectKey = btoa(objectKey);
			const request = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1/delete",
				"POST",
				{ key: base64ObjectKey },
				{ "Content-Type": "application/json" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({ success: true });
		});

		it("should delete an object with a complex key (needs base64 encoding)", async () => {
			if (!MY_TEST_BUCKET_1) {
				throw new Error("MY_TEST_BUCKET_1 binding not available");
			}

			const objectKey = "folder/path with spaces/file?name.txt";
			await MY_TEST_BUCKET_1.put(objectKey, "Complex key content");

			let r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).not.toBeNull();

			const base64ObjectKey = btoa(objectKey);
			const request = createTestRequest(
				"/api/buckets/MY_TEST_BUCKET_1/delete",
				"POST",
				{ key: base64ObjectKey },
				{ "Content-Type": "application/json" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({ success: true });

			r2Object = await MY_TEST_BUCKET_1.head(objectKey);
			expect(r2Object).toBeNull();
		});

		it("POST /api/buckets/NON_EXISTENT_BUCKET/delete - should return 500 if bucket binding does not exist", async () => {
			const base64ObjectKey = btoa("test.txt");
			const request = createTestRequest(
				"/api/buckets/NON_EXISTENT_BUCKET/delete",
				"POST",
				{ key: base64ObjectKey },
				{ "Content-Type": "application/json" },
			);

			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(500); // Expecting 500 due to error accessing .delete on undefined
		});
	});

	describe("MoveObject (POST /api/buckets/:bucket/move)", () => {
		const BUCKET_NAME = "MY_TEST_BUCKET_1";
		const SOURCE_KEY = "source-move.txt";
		const DEST_KEY = "dest-move.txt";
		const FOLDER_DEST_KEY = "folder/dest-move.txt";
		const CONTENT = "Object to be moved";

		beforeEach(async () => {
			// Ensure source object exists before each move test
			await MY_TEST_BUCKET_1.put(SOURCE_KEY, CONTENT);
			// Ensure destination keys are clear if a previous test put something there
			await MY_TEST_BUCKET_1.delete([DEST_KEY, FOLDER_DEST_KEY]);
		});

		it("should successfully move an object to a new key", async () => {
			const base64SourceKey = btoa(SOURCE_KEY);
			const base64DestKey = btoa(DEST_KEY);

			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/move`,
				"POST",
				{ oldKey: base64SourceKey, newKey: base64DestKey },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const sourceObject = await MY_TEST_BUCKET_1.get(SOURCE_KEY);
			expect(sourceObject).toBeNull(); // Source should be deleted

			const destObject = await MY_TEST_BUCKET_1.get(DEST_KEY);
			expect(destObject).not.toBeNull();
			expect(await destObject?.text()).toBe(CONTENT);
		});

		it("should successfully move an object to a different prefix (folder simulation)", async () => {
			const base64SourceKey = btoa(SOURCE_KEY);
			const base64FolderDestKey = btoa(FOLDER_DEST_KEY);

			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/move`,
				"POST",
				{ oldKey: base64SourceKey, newKey: base64FolderDestKey },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const sourceObject = await MY_TEST_BUCKET_1.get(SOURCE_KEY);
			expect(sourceObject).toBeNull();

			const destObject = await MY_TEST_BUCKET_1.get(FOLDER_DEST_KEY);
			expect(destObject).not.toBeNull();
			expect(await destObject?.text()).toBe(CONTENT);
		});

		it("should return 404 when attempting to move a non-existent source object", async () => {
			const base64NonExistentKey = btoa("non-existent-source.txt");
			const base64DestKey = btoa(DEST_KEY);

			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/move`,
				"POST",
				{ oldKey: base64NonExistentKey, newKey: base64DestKey },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(404);
		});

		it("should return 400 for missing sourceKey in request body", async () => {
			const base64DestKey = btoa(DEST_KEY);
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/move`,
				"POST",
				{ newKey: base64DestKey }, // oldKey is missing
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(400); // Zod validation should fail
		});

		it("should return 400 for missing destinationKey in request body", async () => {
			const base64SourceKey = btoa(SOURCE_KEY);
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/move`,
				"POST",
				{ oldKey: base64SourceKey }, // newKey is missing
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(400); // Zod validation should fail
		});

		it("should return 500 if bucket binding does not exist", async () => {
			const base64SourceKey = btoa(SOURCE_KEY);
			const base64DestKey = btoa(DEST_KEY);
			const request = createTestRequest(
				"/api/buckets/NON_EXISTENT_BUCKET/move",
				"POST",
				{ oldKey: base64SourceKey, newKey: base64DestKey },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(500);
			const bodyText = await response.text(); // Workaround for non-JSON response
			expect(bodyText).toContain("Bucket binding not found: NON_EXISTENT_BUCKET");
		});
	});

	describe("CreateFolder (POST /api/buckets/:bucket/folder)", () => {
		const BUCKET_NAME = "MY_TEST_BUCKET_1";
		const FOLDER_NAME = "my-new-folder"; // Will have / appended by handler
		const FOLDER_NAME_WITH_SLASH = "my-other-folder/";

		beforeEach(async () => {
			// Clear potential folder keys before each test
			await MY_TEST_BUCKET_1.delete([`${FOLDER_NAME}/`, FOLDER_NAME_WITH_SLASH]);
		});

		it("should successfully create a new folder (as a zero-byte object with trailing slash)", async () => {
			const base64FolderName = btoa(FOLDER_NAME);
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/folder`,
				"POST",
				{ key: base64FolderName },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200); // R2 put returns the R2Object

			const folderObject = await MY_TEST_BUCKET_1.head(`${FOLDER_NAME}/`);
			expect(folderObject).not.toBeNull();
			expect(folderObject?.size).toBe(0);
		});

		it("should successfully create a folder if key already has trailing slash", async () => {
			const base64FolderName = btoa(FOLDER_NAME_WITH_SLASH);
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/folder`,
				"POST",
				{ key: base64FolderName },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200);

			const folderObject = await MY_TEST_BUCKET_1.head(FOLDER_NAME_WITH_SLASH);
			expect(folderObject).not.toBeNull();
			expect(folderObject?.size).toBe(0);
		});

		it("should succeed if attempting to create a folder that already exists", async () => {
			// Create it once
			await MY_TEST_BUCKET_1.put(`${FOLDER_NAME}/`, "");

			const base64FolderName = btoa(FOLDER_NAME);
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/folder`,
				"POST",
				{ key: base64FolderName },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(200); // Should still be successful (idempotent)

			const folderObject = await MY_TEST_BUCKET_1.head(`${FOLDER_NAME}/`);
			expect(folderObject).not.toBeNull();
			expect(folderObject?.size).toBe(0);
		});

		it("should return 400 for missing key in request body", async () => {
			const request = createTestRequest(
				`/api/buckets/${BUCKET_NAME}/folder`,
				"POST",
				{}, // key is missing
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(400); // Zod validation should fail
		});

		it("should return 500 if bucket binding does not exist", async () => {
			const base64FolderName = btoa(FOLDER_NAME);
			const request = createTestRequest(
				"/api/buckets/NON_EXISTENT_BUCKET/folder",
				"POST",
				{ key: base64FolderName },
				{ "Content-Type": "application/json" },
			);
			const response = await app.fetch(request, env, createExecutionContext());
			expect(response.status).toBe(500);
			const bodyText = await response.text(); // Workaround for non-JSON response
			expect(bodyText).toContain("Bucket binding not found: NON_EXISTENT_BUCKET");
		});
	});
});
