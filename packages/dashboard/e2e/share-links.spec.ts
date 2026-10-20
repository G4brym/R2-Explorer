import { expect, test } from "@playwright/test";
import { BUCKET, cleanupPrefix, deleteObject, uploadFile } from "./helpers";

const BASE = "http://localhost:8787";

function enc(k: string): string {
	return btoa(unescape(encodeURIComponent(k)));
}

test.describe("Share links", () => {
	test.beforeAll(async ({ request }) => {
		await uploadFile(request, "e2e-share-file.txt", "shareable content");
	});

	test.afterAll(async ({ request }) => {
		await deleteObject(request, "e2e-share-file.txt");
		await cleanupPrefix(request, ".r2-explorer/sharable-links/");
	});

	test("opens create share link dialog from context menu", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Create Share Link").click();

		// Share link dialog should open
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});
		await expect(page.locator("text=Expires in")).toBeVisible();
	});

	test("creates a share link and shows the URL", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Create Share Link").click();
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});

		await page.getByRole("button", { name: "Create Link" }).click();

		await expect(
			page.locator(".q-dialog").locator("text=Share Link Created!"),
		).toBeVisible({ timeout: 5_000 });
	});

	test("creates a share link with expiration and password", async ({
		page,
	}) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Create Share Link").click();
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});

		// Set expiration to 24 hours
		const expirationInput = page
			.locator('.q-dialog input[type="number"]')
			.first();
		await expirationInput.fill("24");

		// Set password
		const passwordInput = page.locator('.q-dialog input[type="password"]');
		await passwordInput.fill("e2e-secret");

		// Set max downloads
		const maxDownloadsInput = page
			.locator('.q-dialog input[type="number"]')
			.last();
		await maxDownloadsInput.fill("5");

		await page.getByRole("button", { name: "Create Link" }).click();

		// Share link should be created with URL shown
		await expect(
			page.locator(".q-dialog").locator("text=Share Link Created!"),
		).toBeVisible({ timeout: 5_000 });
	});

	test("opens manage shares dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: "Manage Shares" }).click();

		await expect(page.locator("text=Manage Share Links")).toBeVisible({
			timeout: 5_000,
		});
	});

	test("shows created share links in manage dialog", async ({ page }) => {
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		// Create a share link first so there's something to show
		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Create Share Link").click();
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});
		await page.getByRole("button", { name: "Create Link" }).click();
		await expect(
			page.locator(".q-dialog").locator("text=Share Link Created!"),
		).toBeVisible({ timeout: 5_000 });

		// Close the create dialog
		await page.getByRole("button", { name: "Close" }).click();
		await expect(page.locator(".q-dialog")).not.toBeVisible({
			timeout: 3_000,
		});

		// Open manage shares
		await page.getByRole("button", { name: "Manage Shares" }).click();
		await expect(page.locator("text=Manage Share Links")).toBeVisible({
			timeout: 5_000,
		});

		// The share link we just created should appear with file name
		await expect(
			page.locator(".q-dialog").locator("text=e2e-share-file.txt").first(),
		).toBeVisible({ timeout: 5_000 });

		// Should show Active status
		await expect(
			page.locator(".q-dialog").locator("text=Active").first(),
		).toBeVisible();
	});

	test("revokes a share link from manage dialog", async ({ page }) => {
		// First create a share link to revoke
		await page.goto(`/${BUCKET}/files`);
		await expect(page.locator("text=e2e-share-file.txt")).toBeVisible({
			timeout: 10_000,
		});

		await page.locator("text=e2e-share-file.txt").click({ button: "right" });
		await page.locator(".q-menu").getByText("Create Share Link").click();
		await expect(page.locator("text=Share File")).toBeVisible({
			timeout: 5_000,
		});
		await page.getByRole("button", { name: "Create Link" }).click();
		await expect(
			page.locator(".q-dialog").locator("text=Share Link Created!"),
		).toBeVisible({ timeout: 5_000 });

		// Close the create dialog
		await page.getByRole("button", { name: "Close" }).click();
		await expect(page.locator("text=Share File")).not.toBeVisible({
			timeout: 3_000,
		});

		// Open manage shares
		await page.getByRole("button", { name: "Manage Shares" }).click();
		await expect(page.locator("text=Manage Share Links")).toBeVisible({
			timeout: 5_000,
		});

		// Count share links before revocation
		const deleteButtons = page.locator(
			'.q-dialog .q-btn[class*="text-red"], .q-dialog .q-btn .q-icon:has-text("delete")',
		);

		// Click the first delete/revoke button (red trash icon)
		const revokeBtn = page
			.locator(".q-dialog")
			.locator("button:has(.q-icon)")
			.filter({ hasText: "delete" })
			.first();

		// If there's a revoke button, click it
		const manageDialog = page.locator(".q-dialog");
		const trashButtons = manageDialog.locator(
			'.q-btn .q-icon:text-is("delete")',
		);
		const count = await trashButtons.count();

		if (count > 0) {
			await trashButtons.first().click();

			// Confirm revocation in the dialog
			await page.getByRole("button", { name: "OK" }).click();
		}
	});
});

test.describe("Share link limits (HTTP)", () => {
	test("enforces maxDownloads over HTTP", async ({ request }) => {
		const key = "e2e-share-limit.txt";
		await uploadFile(request, key, "limit me");
		let shareId: string | undefined;
		try {
			const createResp = await request.post(
				`${BASE}/api/buckets/${BUCKET}/${enc(key)}/share`,
				{ data: { maxDownloads: 2 } },
			);
			expect(createResp.status()).toBe(200);
			shareId = (await createResp.json()).shareId as string;

			const statuses: number[] = [];
			for (let i = 0; i < 3; i++) {
				const resp = await request.get(`${BASE}/share/${shareId}`);
				statuses.push(resp.status());
				await resp.dispose();
			}
			expect(statuses).toEqual([200, 200, 403]);

			const listResp = await request.get(
				`${BASE}/api/buckets/${BUCKET}/shares`,
			);
			expect(listResp.status()).toBe(200);
			const { shares } = await listResp.json();
			const share = shares.find(
				(s: { shareId: string }) => s.shareId === shareId,
			);
			expect(share.currentDownloads).toBe(2);
		} finally {
			if (shareId) {
				await request.delete(`${BASE}/api/buckets/${BUCKET}/share/${shareId}`);
			}
			await deleteObject(request, key);
		}
	});

	test("expires a share link after expiresIn seconds", async ({ request }) => {
		const key = "e2e-share-expire.txt";
		await uploadFile(request, key, "expiring content");
		let shareId: string | undefined;
		try {
			const createResp = await request.post(
				`${BASE}/api/buckets/${BUCKET}/${enc(key)}/share`,
				{ data: { expiresIn: 2 } },
			);
			expect(createResp.status()).toBe(200);
			shareId = (await createResp.json()).shareId as string;

			const first = await request.get(`${BASE}/share/${shareId}`);
			expect(first.status()).toBe(200);
			await first.dispose();

			await new Promise((resolve) => setTimeout(resolve, 3500));

			const second = await request.get(`${BASE}/share/${shareId}`);
			expect(second.status()).toBe(410);
			await second.dispose();
		} finally {
			if (shareId) {
				await request.delete(`${BASE}/api/buckets/${BUCKET}/share/${shareId}`);
			}
			await deleteObject(request, key);
		}
	});
});
