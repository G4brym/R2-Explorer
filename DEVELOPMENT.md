# Development instructions for R2 Explorer

## Setup

```bash
pnpm install
```

## Build

```bash
# Build dashboard (Vue SPA → packages/dashboard/dist/spa/)
pnpm build-dashboard

# Build everything (dashboard + worker)
pnpm build

# Build worker only (requires dashboard to be built first)
pnpm build-worker
```

## Local Development

```bash
# Dashboard dev server
cd packages/dashboard && pnpm dev

# Worker dev server (from dev package)
cd packages/dev && npx wrangler dev
```

## Lint

```bash
pnpm lint
```

## Tests

```bash
pnpm test

# Or directly
cd packages/worker && pnpm test

# Single test file
cd packages/worker && npx vitest run tests/mytest.test.ts --config tests/vitest.config.mts
```

## Publishing

Publishing is handled via GitHub Actions (`.github/workflows/publish.yml`).

## Generate PWA assets

```bash
cd packages/dashboard/public
convert logo.png -resize '128x128' icons/favicon-128x128.png
convert logo.png -resize '96x96' icons/favicon-96x96.png
convert logo.png -resize '32x32' icons/favicon-32x32.png
convert logo.png -resize '16x16' icons/favicon-16x16.png
```
