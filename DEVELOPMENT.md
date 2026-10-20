# Development guide for R2-Explorer

This repo is a pnpm monorepo (`pnpm-workspace.yaml`). Node.js v22+ required
(workflows use `22.x`, publish uses `24.x`).

## Setup

```bash
pnpm install
pnpm build
```

## Build

```bash
pnpm build             # dashboard + worker
pnpm build-dashboard   # Vue SPA only
pnpm build-worker      # worker bundle (includes dashboard assets)
pnpm package           # npm tarball for the worker package
```

## Lint & tests

```bash
pnpm lint              # Biome check on dashboard + worker sources
pnpm test              # worker + dashboard unit tests
pnpm test:e2e          # Playwright E2E (builds dashboard first)
```

Run a single package:

```bash
pnpm --filter r2-explorer test        # worker tests
pnpm --filter r2-explorer-dashboard test  # dashboard tests
```

## Local dev

```bash
# Dashboard UI with hot reload
cd packages/dashboard && pnpm dev

# Worker against local R2 bindings (see template/wrangler.toml)
cd template && pnpm exec wrangler dev
```

## Changesets

Every PR needs a changeset (`pnpm changeset`; use `pnpm changeset --empty`
for internal-only changes such as CI/docs/tooling).

## Generate PWA assets

```bash
cd packages/dashboard/public/img
convert logo.png -resize '192x192' android-chrome-192x192.png
convert logo.png -resize '512x512' android-chrome-512x512.png
convert logo.png -resize '154x154' -gravity center -background transparent -extent 192x192 android-chrome-maskable-192x192.png
convert logo.png -resize '410x410' -gravity center -background transparent -extent 512x512 android-chrome-maskable-512x512.png
convert logo.png -resize '180x180' -background white apple-touch-icon.png
convert logo.png -resize '60x60' -background white apple-touch-icon-60x60.png
convert logo.png -resize '76x76' -background white apple-touch-icon-76x76.png
convert logo.png -resize '120x120' -background white apple-touch-icon-120x120.png
convert logo.png -resize '180x180' -background white apple-touch-icon-180x180.png
convert logo.png -resize '152x152' -background white apple-touch-icon-152x152.png
convert logo.png -resize '16x16' favicon-16x16.png
convert logo.png -resize '32x32' favicon-32x32.png
convert logo.png -resize '144x144' msapplication-icon-144x144.png
convert logo.png -resize '150x150' -background transparent -compose Copy -gravity center -extent 270x270 mstile-150x150.png
convert logo.png -resize '512x512' safari-pinned-tab.svg
```
