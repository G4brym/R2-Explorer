import { expect, test } from "@playwright/test";
import { BUCKET, cleanupPrefix, uploadFile } from "./helpers";

const NOTES_PREFIX = ".r2-explorer/notes/";

function encodeKey(key: string): string {
	return btoa(unescape(encodeURIComponent(key)));
}

async function getNoteContent(request, name: string): Promise<string> {
	const resp = await request.get(
		`http://localhost:8787/api/buckets/${BUCKET}/${encodeKey(`${NOTES_PREFIX}${name}`)}`,
	);
	expect(resp.ok()).toBe(true);
	return await resp.text();
}

test.describe("Notes app", () => {
	test.beforeEach(async ({ request }) => {
		await cleanupPrefix(request, NOTES_PREFIX);
		await uploadFile(
			request,
			`${NOTES_PREFIX}welcome.md`,
			"# Hello\n\nThis is a **seeded** note.",
			"text/markdown",
		);
	});

	test("sidebar has a Notes button that opens the app", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await page.getByRole("button", { name: "Notes" }).click();
		await expect(page).toHaveURL(new RegExp(`/${BUCKET}/notes`));
		await expect(page.getByTestId("new-note-btn")).toBeVisible();
	});

	test("lists notes and opens one in the editor", async ({ page }) => {
		await page.goto(`/${BUCKET}/notes`);

		const item = page.getByTestId("note-item").filter({ hasText: "welcome" });
		await expect(item).toBeVisible();
		await item.click();

		await expect(page.getByTestId("note-title")).toHaveText("welcome");
		await expect(page.getByTestId("note-textarea")).toHaveValue(
			"# Hello\n\nThis is a **seeded** note.",
		);
	});

	test("renders markdown preview", async ({ page }) => {
		await page.goto(`/${BUCKET}/notes/${encodeKey("welcome.md")}`);

		await expect(page.getByTestId("note-textarea")).toBeVisible();
		await page.getByRole("button", { name: "Preview" }).click();

		const preview = page.getByTestId("note-preview");
		await expect(preview.locator("h1")).toHaveText("Hello");
		await expect(preview.locator("strong")).toHaveText("seeded");
	});

	test("edits and saves a note", async ({ page, request }) => {
		await page.goto(`/${BUCKET}/notes/${encodeKey("welcome.md")}`);

		const textarea = page.getByTestId("note-textarea");
		await expect(textarea).toHaveValue(/Hello/);
		await textarea.fill("# Updated\n\nNew content.");
		await page.getByTestId("save-note-btn").click();

		await expect(page.locator(".q-notification")).toContainText("Note saved");

		const content = await getNoteContent(request, "welcome.md");
		expect(content).toBe("# Updated\n\nNew content.");
	});

	test("creates a new note", async ({ page, request }) => {
		await page.goto(`/${BUCKET}/notes`);

		await page.getByTestId("new-note-btn").click();
		await page.getByTestId("new-note-name").fill("my ideas");
		await page.getByTestId("create-note-btn").click();

		// Should navigate to the new note's editor
		await expect(page.getByTestId("note-title")).toHaveText("my ideas");

		const textarea = page.getByTestId("note-textarea");
		await textarea.fill("Remember to water the plants");
		await page.getByTestId("save-note-btn").click();
		await expect(page.locator(".q-notification")).toContainText("Note saved");

		const content = await getNoteContent(request, "my ideas.md");
		expect(content).toBe("Remember to water the plants");

		// It should also show up in the notes list
		await expect(
			page.getByTestId("note-item").filter({ hasText: "my ideas" }),
		).toBeVisible();
	});

	test("rejects duplicate note names", async ({ page }) => {
		await page.goto(`/${BUCKET}/notes`);

		await page.getByTestId("new-note-btn").click();
		await page.getByTestId("new-note-name").fill("welcome");
		await page.getByTestId("create-note-btn").click();

		await expect(
			page.locator(".q-field__messages", { hasText: "already exists" }),
		).toBeVisible();
	});

	test("deletes a note", async ({ page }) => {
		await page.goto(`/${BUCKET}/notes/${encodeKey("welcome.md")}`);

		await expect(page.getByTestId("note-textarea")).toBeVisible();
		await page.getByTestId("delete-note-btn").click();

		// Confirm in the Quasar dialog
		await page.locator(".q-dialog").getByRole("button", { name: "OK" }).click();

		await expect(page.locator(".q-notification").last()).toContainText(
			"Note deleted",
		);
		await expect(page).toHaveURL(new RegExp(`/${BUCKET}/notes$`));
		await expect(
			page.getByTestId("note-item").filter({ hasText: "welcome" }),
		).toHaveCount(0);
	});
});
