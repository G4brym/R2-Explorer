import { createExecutionContext, env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createTestRequest } from "./setup";

function b64(key: string): string {
	return btoa(key);
}

describe("Trash Endpoints", () => {
	let app: ReturnType<typeof createTestApp>;
	let bucket: R2Bucket;
	const BUCKET_NAME = "MY_TEST_BUCKET_1";

	beforeEach(async () => {
		app = createTestApp();
		bucket = env.MY_TEST_BUCKET_1;

		// Clean bucket
		const listed = await bucket.list();
		const keys = listed.objects.map((obj) => obj.key);
		if (keys.length > 0) {
			await bucket.delete(keys);
		}
	});

	afterEach(async () => {
		const listed = await bucket.list();
		const keys = listed.objects.map((obj) => obj.key);
		if (keys.length > 0) {
			await bucket.delete(keys);
		}
	});

	it("should move a file to trash on delete", async () => {
		await bucket.put("file.txt", "hello", {
			httpMetadata: { contentType: "text/plain" },
			customMetadata: { keep: "value" },
		});

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("file.txt") },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.trashed).toBe(true);
		expect(body.trashKey).toMatch(
			/^\.r2-explorer\/trash\/[a-z0-9]+\/file\.txt$/,
		);

		const original = await bucket.head("file.txt");
		expect(original).toBeNull();

		const trashed = await bucket.head(body.trashKey);
		expect(trashed).not.toBeNull();
		expect(trashed?.customMetadata?.trashOriginalKey).toBe("file.txt");
		expect(trashed?.customMetadata?.keep).toBe("value");
		expect(trashed?.customMetadata?.trashDeletedBy).toBe("anonymous");
	});

	it("should permanently delete when permanent flag is true", async () => {
		await bucket.put("file.txt", "hello");

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("file.txt"), permanent: true },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.trashed).toBeUndefined();

		const listed = await bucket.list();
		expect(listed.objects).toHaveLength(0);
	});

	it("should hard-delete objects under .r2-explorer", async () => {
		await bucket.put(".r2-explorer/sharable-links/abc.json", "{}");

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64(".r2-explorer/sharable-links/abc.json") },
		);
		const response = await app.fetch(request, env, createExecutionContext());

		expect(response.status).toBe(200);
		const listed = await bucket.list();
		expect(listed.objects).toHaveLength(0);
	});

	it("should hard-delete when trash is disabled", async () => {
		app = createTestApp({ trash: false });
		await bucket.put("file.txt", "hello");

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("file.txt") },
		);
		const response = await app.fetch(request, env, createExecutionContext());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.trashed).toBeUndefined();

		const listed = await bucket.list();
		expect(listed.objects).toHaveLength(0);
	});

	it("should list trashed objects", async () => {
		await bucket.put("folder/file.txt", "hello");
		const req = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("folder/file.txt") },
		);
		const delResp = await app.fetch(req, env, createExecutionContext());
		const delBody = await delResp.json();

		const listReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/trash`,
			"GET",
		);
		const listResp = await app.fetch(listReq, env, createExecutionContext());
		const listBody = await listResp.json();

		expect(listResp.status).toBe(200);
		expect(listBody.objects).toHaveLength(1);
		expect(listBody.objects[0].originalKey).toBe("folder/file.txt");
		expect(listBody.objects[0].trashKey).toBe(delBody.trashKey);
		expect(listBody.objects[0].deletedBy).toBe("anonymous");
		expect(listBody.objects[0].size).toBe(5);
	});

	it("should restore a trashed object", async () => {
		await bucket.put("file.txt", "hello");
		const delReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("file.txt") },
		);
		const delResp = await app.fetch(delReq, env, createExecutionContext());
		const delBody = await delResp.json();

		const restoreReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/trash/restore`,
			"POST",
			{ trashKey: b64(delBody.trashKey) },
		);
		const restoreResp = await app.fetch(
			restoreReq,
			env,
			createExecutionContext(),
		);
		const restoreBody = await restoreResp.json();

		expect(restoreResp.status).toBe(200);
		expect(restoreBody.success).toBe(true);
		expect(restoreBody.restoredKey).toBe("file.txt");

		const restored = await bucket.head("file.txt");
		expect(restored).not.toBeNull();
		expect(restored?.customMetadata?.trashOriginalKey).toBeUndefined();
		expect(restored?.customMetadata?.keep).toBeUndefined();
	});

	it("should restore to renamed path when original exists", async () => {
		await bucket.put("file.txt", "original");
		await bucket.put("file.txt", "trashed", {
			customMetadata: {
				trashOriginalKey: "file.txt",
				trashDeletedAt: "1",
				trashDeletedBy: "test",
			},
		});
		const trashKey = ".r2-explorer/trash/abc123/file.txt";
		// move the trashed object to the trash key manually to simulate trash
		const obj = await bucket.get("file.txt");
		await bucket.put(trashKey, obj.body, {
			customMetadata: obj.customMetadata,
			httpMetadata: obj.httpMetadata,
		});

		const restoreReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/trash/restore`,
			"POST",
			{ trashKey: b64(trashKey) },
		);
		const restoreResp = await app.fetch(
			restoreReq,
			env,
			createExecutionContext(),
		);
		const restoreBody = await restoreResp.json();

		expect(restoreResp.status).toBe(200);
		expect(restoreBody.restoredKey).toMatch(/^file \(restored .*\)\.txt$/);

		const restored = await bucket.head(restoreBody.restoredKey);
		expect(restored).not.toBeNull();
	});

	it("should purge a single trashed object", async () => {
		await bucket.put("file.txt", "hello");
		const delReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/delete`,
			"POST",
			{ key: b64("file.txt") },
		);
		const delResp = await app.fetch(delReq, env, createExecutionContext());
		const delBody = await delResp.json();

		const purgeReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/trash/purge`,
			"POST",
			{ trashKey: b64(delBody.trashKey) },
		);
		const purgeResp = await app.fetch(purgeReq, env, createExecutionContext());
		const purgeBody = await purgeResp.json();

		expect(purgeResp.status).toBe(200);
		expect(purgeBody.deleted).toBe(1);

		const listed = await bucket.list();
		expect(listed.objects).toHaveLength(0);
	});

	it("should empty entire trash", async () => {
		await bucket.put("a.txt", "a");
		await bucket.put("b.txt", "b");
		await app.fetch(
			createTestRequest(`/api/buckets/${BUCKET_NAME}/delete`, "POST", {
				key: b64("a.txt"),
			}),
			env,
			createExecutionContext(),
		);
		await app.fetch(
			createTestRequest(`/api/buckets/${BUCKET_NAME}/delete`, "POST", {
				key: b64("b.txt"),
			}),
			env,
			createExecutionContext(),
		);

		const purgeReq = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/trash/purge`,
			"POST",
			{},
		);
		const purgeResp = await app.fetch(purgeReq, env, createExecutionContext());
		const purgeBody = await purgeResp.json();

		expect(purgeResp.status).toBe(200);
		expect(purgeBody.deleted).toBe(2);

		const listed = await bucket.list();
		expect(listed.objects).toHaveLength(0);
	});

	it("should reject move into trash", async () => {
		await bucket.put("file.txt", "hello");

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/move`,
			"POST",
			{
				oldKey: b64("file.txt"),
				newKey: b64(".r2-explorer/trash/abc/file.txt"),
			},
		);
		const response = await app.fetch(request, env, createExecutionContext());

		expect(response.status).toBe(400);
	});

	it("should reject copy into trash", async () => {
		await bucket.put("file.txt", "hello");

		const request = createTestRequest(
			`/api/buckets/${BUCKET_NAME}/copy`,
			"POST",
			{
				sourceKey: b64("file.txt"),
				destinationKey: b64(".r2-explorer/trash/abc/file.txt"),
			},
		);
		const response = await app.fetch(request, env, createExecutionContext());

		expect(response.status).toBe(400);
	});

	it("should purge expired trash on scheduled event", async () => {
		const now = Date.now();
		const oldTrashKey = ".r2-explorer/trash/old/file.txt";
		const newTrashKey = ".r2-explorer/trash/new/file.txt";

		await bucket.put(oldTrashKey, "old", {
			customMetadata: {
				trashOriginalKey: "file.txt",
				trashDeletedAt: (now - 31 * 24 * 60 * 60 * 1000).toString(),
				trashDeletedBy: "test",
			},
		});
		await bucket.put(newTrashKey, "new", {
			customMetadata: {
				trashOriginalKey: "file.txt",
				trashDeletedAt: now.toString(),
				trashDeletedBy: "test",
			},
		});

		const context = createExecutionContext();
		await app.scheduled(
			{ cron: "0 0 * * *", scheduledTime: now },
			env,
			context,
		);
		// waitUntil promises may still be running; force a small delay
		await new Promise((resolve) => setTimeout(resolve, 100));

		const listed = await bucket.list({ prefix: ".r2-explorer/trash/" });
		expect(listed.objects).toHaveLength(1);
		expect(listed.objects[0].key).toBe(newTrashKey);
	});
});
