# R2-Explorer Agent Guide

## Project Overview

R2-Explorer is a Google Drive-like interface for Cloudflare R2 storage buckets, built as a serverless application on Cloudflare Workers. It provides an intuitive web-based UI for managing R2 object storage with features like drag-and-drop uploads, file previews, folder management, and email integration.

**Key Characteristics:**
- Serverless architecture using Cloudflare Workers
- Monorepo structure managed with pnpm workspaces
- TypeScript-based backend with Hono framework
- Vue 3 + Quasar frontend
- Published as an npm package for easy deployment
- Zero dependencies on external servers (fully self-hosted on Cloudflare)

## Architecture

### Project Structure

```
R2-Explorer/
├── packages/
│   ├── worker/          # Backend API (Cloudflare Worker)
│   ├── dashboard/       # Frontend UI (Vue 3 + Quasar)
│   ├── docs/           # Documentation site
│   └── github-action/  # GitHub Action for deployment
├── template/           # Starter template for users
├── package.json        # Root workspace config
└── pnpm-workspace.yaml # Monorepo configuration
```

### Core Components

#### 1. Worker Package (`packages/worker/`)
- **Technology:** TypeScript, Hono, Chanfana (OpenAPI framework)
- **Entry Point:** `src/index.ts`
- **Purpose:** REST API that interfaces with Cloudflare R2 buckets
- **Key Features:**
  - R2 bucket operations (CRUD)
  - Multipart upload support
  - Public sharing links with password protection and expiration
  - Email routing integration
  - Basic auth and Cloudflare Access authentication
  - Read-only mode support

**Main Export:**
```typescript
export function R2Explorer(config?: R2ExplorerConfig)
```

**API Routes:**
- `/api/server/config` - Server configuration
- `/api/buckets/:bucket` - List objects
- `/api/buckets/:bucket/:key` - Get/Head/Post object
- `/api/buckets/:bucket/move` - Move objects
- `/api/buckets/:bucket/folder` - Create folders
- `/api/buckets/:bucket/upload` - Upload files
- `/api/buckets/:bucket/multipart/*` - Multipart upload endpoints
- `/api/buckets/:bucket/delete` - Delete objects
- `/api/buckets/:bucket/:key/share` - Create public share link
- `/api/buckets/:bucket/shares` - List all share links
- `/api/buckets/:bucket/share/:shareId` - Delete/revoke share link
- `/share/:shareId` - Public access to shared file (no auth required)
- `/api/emails/send` - Send emails

#### 2. Dashboard Package (`packages/dashboard/`)
- **Technology:** Vue 3, Quasar Framework, Vite
- **Purpose:** Single-page application for file management UI
- **Key Features:**
  - Drag-and-drop file uploads
  - File preview (PDF, images, text, markdown, CSV)
  - Folder navigation
  - Context menus for file operations
  - Public share link creation and management
  - Email viewer for attachments

**Build Output:** 
- Compiled to `dist/spa/` directory
- Bundled with worker package as static assets
- Served via Cloudflare Workers Assets binding

#### 3. Template (`template/`)
- **Purpose:** User-facing starter template
- **Contents:**
  - Minimal `src/index.ts` that imports and configures `r2-explorer` package
  - `wrangler.toml` for Cloudflare Workers configuration
  - Example configuration options

## Configuration

### R2ExplorerConfig Type

```typescript
type R2ExplorerConfig = {
  readonly?: boolean;           // Default: true (prevents write operations)
  cors?: boolean;               // Enable CORS for API endpoints
  cfAccessTeamName?: string;    // Cloudflare Access team name
  dashboardUrl?: string;        // Custom dashboard URL
  emailRouting?: {              // Email routing configuration
    targetBucket: string;
  } | false;
  showHiddenFiles?: boolean;    // Show files starting with .
  basicAuth?: BasicAuth | BasicAuth[]; // Basic authentication
};

type BasicAuthType = {
  username: string;
  password: string;
};
```

### Environment Bindings (wrangler.toml)

```toml
[[r2_buckets]]
binding = "BUCKET_NAME"  # Access via env.BUCKET_NAME in code
bucket_name = "actual-bucket-name"

# Assets binding (automatic)
assets = { 
  directory = "node_modules/r2-explorer/dashboard",
  binding = "ASSETS",
  html_handling = "auto-trailing-slash",
  not_found_handling = "single-page-application"
}
```

## Development Workflow

### Prerequisites
- Node.js (v16+)
- pnpm package manager
- Cloudflare account with R2 enabled
- Wrangler CLI (included as dev dependency)

### Setup
```bash
# Install dependencies
pnpm install

# Build everything
pnpm build

# Build individual packages
pnpm build-dashboard  # Builds Vue SPA
pnpm build-worker     # Builds TypeScript + bundles dashboard
```

### Development Commands
```bash
# Lint code (uses Biome)
pnpm lint

# Build dashboard
pnpm build-dashboard

# Build worker
pnpm build-worker

# Deploy dashboard to Cloudflare Pages
pnpm deploy-dashboard      # Production
pnpm deploy-dashboard-dev  # Development

# Package for npm
pnpm package

# Publish to npm
pnpm publish-npm
```

### Testing
```bash
# Run worker tests
cd packages/worker
pnpm test
```

Tests use Vitest with `@cloudflare/vitest-pool-workers` for Worker runtime testing.

## Key Technical Concepts

### 1. Monorepo Structure
- Uses pnpm workspaces for package management
- Packages are linked locally during development
- Template is excluded from workspace (standalone user template)

### 2. Build Pipeline
1. **Dashboard Build:** Quasar builds Vue app to `packages/dashboard/dist/spa/`
2. **Worker Build:** 
   - tsup compiles TypeScript to CJS/ESM
   - Copies dashboard `dist/spa/` to `packages/worker/dashboard/`
   - Copies README.md and LICENSE
   - Creates npm package with all assets

### 3. Deployment Model
Users install the npm package and deploy via Wrangler:
```typescript
import { R2Explorer } from "r2-explorer";
export default R2Explorer({ /* config */ });
```

### 4. Authentication Middleware
Two authentication methods supported:
- **Basic Auth:** Hono's `basicAuth` middleware with custom verifier
- **Cloudflare Access:** `@hono/cloudflare-access` middleware

Middleware chain: CORS → ReadOnly → Authentication → API Routes

### 5. Read-Only Mode
- Default mode for safety
- Middleware blocks write operations (POST, PUT, DELETE)
- Can be disabled via config for full access

### 6. Email Integration
- Cloudflare Email Routing integration
- `receiveEmail` handler processes incoming emails
- Emails stored in configured R2 bucket
- Parsed with `postal-mime` library
- Dashboard displays email with attachments

## Code Style & Conventions

### Linting
- **Tool:** Biome (replaces ESLint/Prettier)
- **Config:** `biome.json` at root
- **Auto-fix:** `npx @biomejs/biome check --write`

### TypeScript
- Strict mode enabled
- Types defined in `packages/worker/src/types.d.ts`
- OpenAPI schema generation via Chanfana

### Vue Components
- Composition API preferred
- Quasar components for UI
- Component structure:
  ```
  packages/dashboard/src/
  ├── components/     # Reusable components
  ├── pages/         # Route pages
  ├── layouts/       # Page layouts
  ├── stores/        # Pinia stores
  └── router/        # Vue Router config
  ```

## Common Agent Tasks

### Adding a New API Endpoint

1. Create endpoint class in `packages/worker/src/modules/`
2. Extend `OpenAPIRoute` from Chanfana
3. Define schema with Zod
4. Implement handler logic
5. Register in `packages/worker/src/index.ts`

Example:
```typescript
import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class MyEndpoint extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({
        bucket: z.string(),
      }),
    },
    responses: {
      "200": { description: "Success" },
    },
  };

  async handle(c) {
    const { bucket } = await this.getValidatedData<typeof this.schema>();
    // Implementation
    return c.json({ success: true });
  }
}
```

### Modifying Dashboard UI

1. Locate relevant component in `packages/dashboard/src/`
2. Edit Vue component (template/script/style sections)
3. Use Quasar components for consistency
4. Update API calls in `appUtils.js` if needed
5. Rebuild dashboard: `pnpm build-dashboard`

### Testing Changes

1. **Worker:**
   - Add tests in `packages/worker/tests/`
   - Run: `cd packages/worker && pnpm test`

2. **Local Development:**
   - Use `wrangler dev` in template directory
   - Set up local R2 bindings or use remote

3. **Integration:**
   - Build both packages: `pnpm build`
   - Deploy to Cloudflare Workers for testing

### Publishing Updates

1. Update version in `packages/worker/package.json`
2. Build: `pnpm build`
3. Package: `pnpm package`
4. Publish: `pnpm publish-npm`
5. Update template dependency version

## Important Files Reference

| File | Purpose |
|------|---------|
| `packages/worker/src/index.ts` | Main worker entry point, route definitions |
| `packages/worker/src/types.d.ts` | TypeScript type definitions |
| `packages/worker/src/modules/buckets/createShareLink.ts` | Create public share links |
| `packages/worker/src/modules/buckets/getShareLink.ts` | Public share link access |
| `packages/worker/src/modules/buckets/listShares.ts` | List all share links |
| `packages/worker/src/modules/buckets/deleteShareLink.ts` | Revoke share links |
| `packages/dashboard/src/appUtils.js` | API client utilities |
| `packages/dashboard/src/pages/files/FilesFolderPage.vue` | Main file browser UI |
| `packages/dashboard/src/pages/files/FileContextMenu.vue` | File context menu with share options |
| `packages/dashboard/src/components/files/ShareFile.vue` | Share link creation and management UI |
| `packages/dashboard/src/components/utils/DragAndDrop.vue` | Drag-drop upload |
| `template/src/index.ts` | User template entry point |
| `template/wrangler.toml` | Cloudflare Workers config |
| `package.json` (root) | Monorepo scripts |
| `pnpm-workspace.yaml` | Workspace configuration |
| `biome.json` | Linting configuration |

## Debugging Tips

### Worker Issues
- Check Wrangler logs: `wrangler tail`
- Verify R2 bucket bindings in `wrangler.toml`
- Test auth configuration
- Check CORS settings if using external API calls

### Dashboard Issues
- Inspect browser console for API errors
- Verify API endpoint responses
- Check Quasar dev mode: `cd packages/dashboard && pnpm dev`
- Review `appUtils.js` for API call logic

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
- Clean build outputs: `rm -rf packages/*/dist`
- Verify pnpm version compatibility
- Check tsup/vite build logs

## Security Considerations

1. **Authentication:** Always enable either Basic Auth or Cloudflare Access in production
2. **Read-Only Mode:** Keep enabled unless write access is required
3. **CORS:** Only enable if external API access is needed
4. **Secrets:** Use Wrangler secrets for sensitive config (not in code)
5. **R2 Bucket Access:** Ensure Worker only has necessary R2 permissions
6. **Share Links:** 
   - Share metadata stored in `.r2-explorer/sharable-links/` prefix
   - Passwords hashed with SHA-256
   - Expiration checked on every access
   - Public `/share/:shareId` endpoint bypasses authentication
   - Consider setting download limits for sensitive files

## Resources

- **Documentation:** https://r2explorer.com
- **Demo:** https://demo.r2explorer.com
- **Repository:** https://github.com/G4brym/R2-Explorer
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **Hono Framework:** https://hono.dev/
- **Quasar Framework:** https://quasar.dev/
- **Chanfana (OpenAPI):** https://chanfana.pages.dev/

## Quick Start for Agents

To quickly understand a specific part of the codebase:

1. **Backend API logic:** Start with `packages/worker/src/index.ts` and explore `modules/`
2. **Frontend UI:** Check `packages/dashboard/src/pages/` for page components
3. **Configuration:** Review `packages/worker/src/types.d.ts` for available options
4. **User deployment:** See `template/` for end-user setup
5. **Build process:** Check root `package.json` scripts and individual package builds

When making changes, always:
- Run linter: `pnpm lint`
- Build affected packages: `pnpm build-[package]`
- Test locally with `wrangler dev`
- Update documentation if adding features
