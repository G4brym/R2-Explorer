import { test, expect } from "@playwright/test";
import { uploadFile, deleteObject, BUCKET } from "./helpers";

const PDF_KEY = "e2e-preview.pdf";
const PDF_MARKER = "R2EXPLORER-PDF-OK";

/** Build a minimal single-page PDF containing `marker` as its only text. */
function buildMarkerPdf(marker: string): Buffer {
  const stream = `BT /F1 24 Tf 72 720 Td (${marker}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, "utf-8");
}

/**
 * Pad a PDF past ~1 MB with inert `%` comment lines inserted before `%%EOF`.
 * Offsets before the insertion point (including `startxref`) stay valid, so
 * the file remains a well-formed PDF.
 */
function padPdfPastOneMb(pdf: Buffer): Buffer {
  const text = pdf.toString("utf-8");
  const line = `%${"0123456789abcdef".repeat(12)}\n`;
  const target = 1_100_000;
  const lines = Math.max(0, Math.ceil((target - text.length) / line.length));
  return Buffer.from(text.replace("%%EOF", `${line.repeat(lines)}%%EOF`), "utf-8");
}

test.describe("PDF preview", () => {
  test.beforeAll(async ({ request }) => {
    await uploadFile(
      request,
      PDF_KEY,
      buildMarkerPdf(PDF_MARKER),
      "application/pdf",
    );
  });

  test.afterAll(async ({ request }) => {
    await deleteObject(request, PDF_KEY);
  });

  test("renders the PDF as canvas and exposes the text layer", async ({
    page,
  }) => {
    await page.goto(`/${BUCKET}/files`);
    await expect(page.locator(`text=${PDF_KEY}`)).toBeVisible({
      timeout: 10_000,
    });

    await page.locator(`text=${PDF_KEY}`).dblclick();

    const dialog = page.locator(".q-dialog");

    // The rendered page must show up as a non-zero-size canvas.
    const canvas = dialog.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // The text layer must contain the marker text.
    await expect(
      dialog.locator(".textLayer", { hasText: PDF_MARKER }),
    ).toBeVisible({ timeout: 10_000 });

    // No loading/rendering failure UI may be shown.
    await expect(dialog.locator(".pdf-error")).toHaveCount(0);
  });

  test("renders a ~1 MB PDF that the dashboard downloads as a blob", async ({
    page,
    request,
  }) => {
    const largeKey = "e2e-preview-large.pdf";
    const largeMarker = "R2EXPLORER-PDF-LARGE";
    await uploadFile(
      request,
      largeKey,
      padPdfPastOneMb(buildMarkerPdf(largeMarker)),
      "application/pdf",
    );
    try {
      await page.goto(`/${BUCKET}/files`);
      await expect(page.locator(`text=${largeKey}`)).toBeVisible({
        timeout: 10_000,
      });

      await page.locator(`text=${largeKey}`).dblclick();

      const dialog = page.locator(".q-dialog");

      // The rendered page must show up as a non-zero-size canvas.
      const canvas = dialog.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 20_000 });
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);

      // The text layer must contain the marker text.
      await expect(
        dialog.locator(".textLayer", { hasText: largeMarker }),
      ).toBeVisible({ timeout: 10_000 });

      // No loading/rendering failure UI may be shown.
      await expect(dialog.locator(".pdf-error")).toHaveCount(0);
    } finally {
      await deleteObject(request, largeKey);
    }
  });

  test("scales the page down when the window narrows", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/${BUCKET}/files`);
    await page.locator(`text=${PDF_KEY}`).dblclick();

    const canvas = page.locator(".q-dialog canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });

    await page.setViewportSize({ width: 900, height: 800 });
    // The page must fit the narrower dialog instead of keeping its old width.
    await expect
      .poll(async () => (await canvas.boundingBox())?.width ?? Infinity)
      .toBeLessThanOrEqual(900);
  });
});
