# Troubleshooting

Common issues and solutions for R2 Explorer.

## Downloads return HTML instead of the actual file

**Symptoms:** Clicking "Download" in the context menu downloads a small (~2KB) HTML file instead of the actual object. Browsing and previewing files works normally.

**Cause:** When using Cloudflare Workers with [static assets](https://developers.cloudflare.com/workers/static-assets/), the `not_found_handling = "single-page-application"` setting in `wrangler.toml` tells Cloudflare to serve `index.html` for any request that doesn't match a static file. This happens **before** your Worker code runs, so API requests like `/api/buckets/<bucket>/<key>` never reach the R2 Explorer backend — Cloudflare intercepts them and returns the SPA's HTML.

**Fix:** Add `run_worker_first` to your `wrangler.toml` assets configuration so that API and share routes are always handled by the Worker:

```toml
# Before (broken)
assets = { directory = "node_modules/r2-explorer/dashboard", binding = "ASSETS", html_handling = "auto-trailing-slash", not_found_handling = "single-page-application" }

# After (fixed)
assets = { directory = "node_modules/r2-explorer/dashboard", binding = "ASSETS", html_handling = "auto-trailing-slash", not_found_handling = "single-page-application", run_worker_first = ["/api/*", "/share/*"] }
```

After updating, redeploy with `wrangler deploy`.

::: tip
New projects created from the template already include this fix. This only affects existing deployments that were set up before this change.
:::

## Downloads fail with 401 when using Basic Auth

**Symptoms:** File downloads from the right-click context menu fail with a `401 Unauthorized` error. Browsing and previewing files works fine. May work in Safari but fail in Chrome.

**Cause:** The download function was creating a raw `<a>` HTML element pointing directly at the API URL and triggering `link.click()`. Browser-initiated downloads via `<a>` links do **not** include custom HTTP headers like `Authorization: Basic ...`, so the request arrives at the Worker without credentials. Chrome enforces this strictly; Safari is more lenient.

**Fix:** This was fixed in [v0.5.2](https://github.com/G4brym/R2-Explorer/releases). Update your R2 Explorer dependency:

```bash
npm update r2-explorer
wrangler deploy
```

## Dashboard shows a blank page or routing errors

**Symptoms:** The dashboard loads but shows a blank page, or navigating between pages results in errors like `TypeError: Cannot read properties of undefined (reading 'name')`.

**Cause:** This can happen when the Vue router's `this.$route.name` is `undefined` during navigation transitions.

**Fix:** This was fixed in [v0.5.2](https://github.com/G4brym/R2-Explorer/releases). Update your R2 Explorer dependency:

```bash
npm update r2-explorer
wrangler deploy
```
