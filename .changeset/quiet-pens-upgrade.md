---
"r2-explorer": minor
---

chore: upgrade Biome, zod, chanfana, and replace the PDF viewer

- PDF preview now uses `vue-pdf-embed` (pdf.js 6) instead of `pdfvuer` with pdf.js 2.5. Pages render at the container width and rescale when the window is resized. The text layer and annotation layer are enabled.
- Browser build target raised to Chrome/Edge 128, Firefox 134, and Safari 18.2. pdf.js 4+ requires `Promise.withResolvers` and `Promise.try`, which older browsers lack.
- Worker upgraded to zod 4 and chanfana 3. Validation error responses now use chanfana's `{ errors: [{ code: 7001, message, path }] }` shape with a numeric code instead of raw zod issues. Unknown query parameters are now rejected, because chanfana 3 enforces `raiseUnknownParameters`.
- Biome upgraded to 2.5.15. The worker `lint` script runs through the workspace Biome instead of `npx`.
- Fixed the file preview dialog so the card does not wrap its content. Wide previews, including PDF pages, now scale to the dialog width.
