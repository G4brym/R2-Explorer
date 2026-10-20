import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { BUCKET, deleteObject } from "./helpers";

const BASE = "http://localhost:8787";

function enc(k: string): string {
	return btoa(unescape(encodeURIComponent(k)));
}

test.describe("File upload", () => {
	let tmpFile: string;

	test.beforeAll(async () => {
		// Create a temporary file to upload
		tmpFile = path.join(os.tmpdir(), "e2e-upload-test.txt");
		fs.writeFileSync(tmpFile, "uploaded via E2E test");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-upload-test.txt");
		if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
	});

	test("uploads a file via the Upload Files button", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		// The hidden file input is inside DragAndDrop component
		// Playwright can set files on hidden inputs before they're clicked
		const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');

		// Set the file on the input before triggering the click
		await fileInput.setInputFiles(tmpFile);

		// File should appear in the listing after upload completes
		await expect(page.locator("text=e2e-upload-test.txt")).toBeVisible({
			timeout: 15_000,
		});
	});
});

test.describe("File download", () => {
	test.beforeAll(async ({ request }) => {
		const { uploadFile } = await import("./helpers");
		await uploadFile(request, "e2e-download-me.txt", "download this content");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-download-me.txt");
	});

	test("initiates file download via context menu", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-download-me.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Listen for download event
		const downloadPromise = page.waitForEvent("download");

		await page.locator("text=e2e-download-me.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Download").click();

		// Verify download was triggered
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe("e2e-download-me.txt");
	});
});

test.describe("Large file multipart upload", () => {
	test("uploads a 100 MiB file through the UI using multipart", async ({
		page,
		request,
	}) => {
		test.setTimeout(420_000);
		const key = "e2e-multipart-100mib.bin";
		const size = 100 * 1024 * 1024;
		const data = Buffer.alloc(size);
		for (let i = 0; i < size; i += 4096) {
			data.writeUInt32BE(i >>> 0, i);
		}
		const expectedHash = createHash("sha256").update(data).digest("hex");
		const file = path.join(os.tmpdir(), key);
		fs.writeFileSync(file, data);

		const multipartUrls: string[] = [];
		page.on("request", (req) => {
			const url = req.url();
			if (url.includes("/multipart/")) {
				multipartUrls.push(url);
			}
		});

		try {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

			await page
				.locator('input[type="file"]:not([webkitdirectory])')
				.setInputFiles(file);

			await expect(page.locator(`text=${key}`)).toBeVisible({
				timeout: 300_000,
			});

			expect(multipartUrls.some((u) => u.includes("multipart/create"))).toBe(
				true,
			);
			const uploadCalls = multipartUrls.filter((u) =>
				u.includes("multipart/upload"),
			);
			expect(uploadCalls.length).toBeGreaterThanOrEqual(2);
			const partNumbers = new Set(
				uploadCalls.map((u) => new URL(u).searchParams.get("partNumber")),
			);
			expect(partNumbers.size).toBeGreaterThanOrEqual(2);
			expect(multipartUrls.some((u) => u.includes("multipart/complete"))).toBe(
				true,
			);

			const getResp = await request.get(
				`${BASE}/api/buckets/${BUCKET}/${enc(key)}`,
			);
			expect(getResp.status()).toBe(200);
			const body = await getResp.body();
			expect(body.length).toBe(size);
			expect(createHash("sha256").update(body).digest("hex")).toBe(
				expectedHash,
			);
		} finally {
			await deleteObject(request, key);
			if (fs.existsSync(file)) fs.unlinkSync(file);
		}
	});
});

test.describe("Upload content types", () => {
	test("keeps application/pdf content type for a PDF uploaded through the UI", async ({
		page,
		request,
	}) => {
		const key = "e2e-upload-content-type.pdf";
		const tmp = path.join(os.tmpdir(), key);
		fs.writeFileSync(tmp, "%PDF-1.4\n%%EOF\n");

		try {
			await page.goto(`/${BUCKET}/files`);
			await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

			await page
				.locator('input[type="file"]:not([webkitdirectory])')
				.setInputFiles(tmp);

			await expect(page.locator(`text=${key}`)).toBeVisible({
				timeout: 30_000,
			});

			const headResp = await request.fetch(
				`${BASE}/api/buckets/${BUCKET}/${enc(key)}`,
				{ method: "HEAD" },
			);
			expect(headResp.status()).toBe(200);
			const contentType = headResp.headers()["content-type"] ?? "";
			expect(contentType).toContain("application/pdf");
		} finally {
			await deleteObject(request, key);
			if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
		}
	});
});
