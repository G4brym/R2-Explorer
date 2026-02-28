import { test, expect } from "@playwright/test";
import { seedEmail, cleanupPrefix, BUCKET } from "./helpers";

test.describe("Email", () => {
	test.beforeAll(async ({ request }) => {
		await seedEmail(request, "1000000000000-e2e-email-1", {
			subject: "Welcome to E2E Testing",
			fromName: "Alice Sender",
			fromAddress: "alice@example.com",
			body: "This is the first test email body.",
			read: false,
			hasAttachments: false,
		});
		await seedEmail(request, "1000000000001-e2e-email-2", {
			subject: "Second Test Email",
			fromName: "Bob Tester",
			fromAddress: "bob@example.com",
			body: "This is the second test email.",
			read: true,
			hasAttachments: false,
		});
	});

	test.afterAll(async ({ request }) => {
		await cleanupPrefix(request, ".r2-explorer/emails/");
	});

	test("shows email list with sender and subject", async ({ page }) => {
		await page.goto(`/${BUCKET}/email`);

		// Wait for emails to load — use td.email-subject (visible desktop cell)
		// Avoid .mobile-subject div which is hidden on desktop
		await expect(
			page.locator("td.email-subject", { hasText: "Welcome to E2E Testing" }),
		).toBeVisible({ timeout: 15_000 });

		await expect(
			page.locator("td.email-sender", { hasText: "Alice Sender" }),
		).toBeVisible();

		// Second email should also be visible
		await expect(
			page.locator("td.email-subject", { hasText: "Second Test Email" }),
		).toBeVisible();
		await expect(
			page.locator("td.email-sender", { hasText: "Bob Tester" }),
		).toBeVisible();
	});

	test("opens email detail view when clicking an email", async ({ page }) => {
		await page.goto(`/${BUCKET}/email`);
		await expect(
			page.locator("td.email-subject", { hasText: "Welcome to E2E Testing" }),
		).toBeVisible({ timeout: 15_000 });

		// Click on the email row (click the visible subject cell)
		await page
			.locator("td.email-subject", { hasText: "Welcome to E2E Testing" })
			.click();

		// Should navigate to email detail view showing sender info
		await expect(page.locator("text=alice@example.com")).toBeVisible({
			timeout: 10_000,
		});
	});

	test("navigates between email list and Files", async ({ page }) => {
		await page.goto(`/${BUCKET}/email`);
		await expect(
			page.locator("td.email-subject", { hasText: "Welcome to E2E Testing" }),
		).toBeVisible({ timeout: 15_000 });

		// Click Files button in sidebar
		await page.getByRole("button", { name: "Files" }).click();

		// Should be on the files page
		await expect(page.locator(".q-table")).toBeVisible({ timeout: 10_000 });

		// Click Email button to go back
		await page.getByRole("button", { name: "Email" }).click();

		// Should be back on email page
		await expect(
			page.locator("td.email-subject", { hasText: "Welcome to E2E Testing" }),
		).toBeVisible({ timeout: 15_000 });
	});
});
