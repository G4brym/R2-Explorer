import { type APIRequestContext, expect, test } from "@playwright/test";
import { BUCKET, deleteObject, uploadFile } from "./helpers";

const RANGE_KEY = "e2e-range.txt";
const RANGE_CONTENT = "0123456789".repeat(400);
const RANGE_TOTAL = RANGE_CONTENT.length;

/** Base64-encode a key the same way the dashboard does. */
function encodeKey(key: string): string {
	return btoa(unescape(encodeURIComponent(key)));
}

function downloadUrl(key: string): string {
	return `http://localhost:8787/api/buckets/${BUCKET}/${encodeKey(key)}`;
}

/** Upload the range fixture, run `fn`, then delete the fixture. */
async function withRangeObject(
	request: APIRequestContext,
	fn: () => Promise<void>,
): Promise<void> {
	await uploadFile(request, RANGE_KEY, RANGE_CONTENT, "text/plain");
	try {
		await fn();
	} finally {
		await deleteObject(request, RANGE_KEY);
	}
}

test.describe("HTTP Range requests", () => {
	test("serves bytes 0-99 as a 206 partial response", async ({ request }) => {
		await withRangeObject(request, async () => {
			const resp = await request.get(downloadUrl(RANGE_KEY), {
				headers: { Range: "bytes=0-99" },
			});
			expect(resp.status()).toBe(206);
			expect(resp.headers()["content-range"]).toBe(`bytes 0-99/${RANGE_TOTAL}`);
			expect(resp.headers()["content-length"]).toBe("100");
			const body = await resp.body();
			expect(body.length).toBe(100);
			expect(body.toString()).toBe(RANGE_CONTENT.slice(0, 100));
		});
	});

	test("serves a suffix range as a 206 partial response", async ({
		request,
	}) => {
		await withRangeObject(request, async () => {
			const resp = await request.get(downloadUrl(RANGE_KEY), {
				headers: { Range: "bytes=-50" },
			});
			expect(resp.status()).toBe(206);
			const body = await resp.body();
			expect(body.length).toBe(50);
			expect(body.toString()).toBe(RANGE_CONTENT.slice(-50));
		});
	});

	test("returns 416 for a range starting past the end", async ({ request }) => {
		await withRangeObject(request, async () => {
			const resp = await request.get(downloadUrl(RANGE_KEY), {
				headers: { Range: `bytes=${RANGE_TOTAL}-` },
			});
			expect(resp.status()).toBe(416);
			expect(resp.headers()["content-range"]).toBe(`bytes */${RANGE_TOTAL}`);
		});
	});

	test("serves a full 200 response with accept-ranges", async ({ request }) => {
		await withRangeObject(request, async () => {
			const resp = await request.get(downloadUrl(RANGE_KEY));
			expect(resp.status()).toBe(200);
			expect(resp.headers()["accept-ranges"]).toBe("bytes");
			const body = await resp.body();
			expect(body.length).toBe(RANGE_TOTAL);
		});
	});
});
