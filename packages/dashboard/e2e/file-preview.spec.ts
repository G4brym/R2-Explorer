import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

test.describe("File preview", () => {
	const testFiles = {
		"e2e-preview.txt": { content: "Hello from E2E test!", type: "text/plain" },
		"e2e-preview.json": {
			content: JSON.stringify({ name: "test", value: 42 }, null, 2),
			type: "application/json",
		},
		"e2e-preview.csv": {
			content: "name,age,city\nAlice,30,NYC\nBob,25,LA",
			type: "text/csv",
		},
		"e2e-preview.md": {
			content: "# Hello Markdown\n\nThis is a **test**.",
			type: "text/markdown",
		},
		"e2e-preview.html": {
			content: "<h1>Test HTML</h1><p>Hello world</p>",
			type: "text/html",
		},
	};

	test.beforeAll(async ({ request }) => {
		for (const [key, file] of Object.entries(testFiles)) {
			await uploadFile(request, key, file.content, file.type);
		}
	});

	test.afterAll(async ({ request }) => {
		for (const key of Object.keys(testFiles)) {
			await deleteObject(request, key);
		}
	});

	test("previews a text file", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-preview.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Double-click to open preview
		await page.locator("text=e2e-preview.txt").dblclick();

		// Preview dialog should open with file content
		await expect(page.locator("text=Hello from E2E test!")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("previews a JSON file", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-preview.json")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-preview.json").dblclick();

		// JSON content should be displayed
		await expect(page.locator("text=test")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("previews a markdown file", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-preview.md")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-preview.md").dblclick();

		await expect(page.locator("text=Hello Markdown")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("shows filename in preview header", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-preview.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-preview.txt").dblclick();

		// Filename should appear in the preview header
		await expect(
			page.locator(".q-dialog").locator("text=e2e-preview.txt"),
		).toBeVisible({
			timeout: 10_000,
		});
	});
});
