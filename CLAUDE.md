# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

R2-Explorer is a Google Drive-like interface for Cloudflare R2 storage buckets. It's a serverless monorepo with a TypeScript backend (Cloudflare Workers + Hono) and Vue 3 + Quasar frontend, published as an npm package.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build everything (dashboard then worker)
pnpm build

# Build individual packages
pnpm build-dashboard    # Vue SPA to packages/dashboard/dist/spa/
pnpm build-worker       # TypeScript + bundles dashboard into npm package

# Lint (uses Biome - auto-fixes on failure)
pnpm lint

# Run tests (worker only)
pnpm test
# Or directly: cd packages/worker && pnpm test

# Run single test file
cd packages/worker && npx vitest run tests/mytest.test.ts --config tests/vitest.config.mts

# Dashboard dev server
cd packages/dashboard && pnpm dev

# Local worker development (from template directory)
cd template && npx wrangler dev
```

## Architecture

### Monorepo Structure
- `packages/worker/` - Backend API (Hono + Chanfana for OpenAPI)
- `packages/dashboard/` - Frontend SPA (Vue 3 + Quasar + Vite)
- `packages/docs/` - Documentation site
- `template/` - User-facing starter template (excluded from workspace)

### Build Pipeline
1. Dashboard builds Vue SPA to `packages/dashboard/dist/spa/`
2. Worker build (tsup) compiles TypeScript and copies dashboard assets to `packages/worker/dashboard/`
3. Final npm package includes both worker code and dashboard assets

### Request Flow
The worker entry point (`packages/worker/src/index.ts`) creates a Hono app with this middleware chain:
```
Config injection → CORS (optional) → ReadOnly mode → Authentication → API Routes
```

Authentication supports Basic Auth or Cloudflare Access. ReadOnly mode (default: true) blocks write operations.

### Key Patterns

**API Endpoints:** Use Chanfana's `OpenAPIRoute` with Zod schemas:
```typescript
import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class MyEndpoint extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({ bucket: z.string() }),
    },
    responses: { "200": { description: "Success" } },
  };

  async handle(c) {
    const data = await this.getValidatedData<typeof this.schema>();
    return c.json({ success: true });
  }
}
```
Register in `packages/worker/src/index.ts` via `openapi.get/post/delete()`.

**Internal Metadata Storage:** R2-Explorer stores internal data in R2 using special prefixes:
- `.r2-explorer/sharable-links/` - Share link metadata
- `.r2-explorer/emails/inbox/` - Email storage

**Frontend API Calls:** Centralized in `packages/dashboard/src/appUtils.js`

## Configuration

Users configure R2Explorer in their worker entry point:
```typescript
import { R2Explorer } from "r2-explorer";
export default R2Explorer({
  readonly: false,           // Default: true
  basicAuth: { username: "admin", password: "secret" },
  // Or: cfAccessTeamName: "my-team"
  cors: true,
  showHiddenFiles: false,
  emailRouting: { targetBucket: "my-bucket" },
});
```

Types defined in `packages/worker/src/types.d.ts`.

## Testing

Tests use Vitest with `@cloudflare/vitest-pool-workers` for Worker runtime testing. Test files are in `packages/worker/tests/`.
