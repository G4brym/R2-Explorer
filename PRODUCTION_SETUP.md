# SpendRule Document Management System - Production Setup

## Overview
A secure, auto-organizing document management system built on R2-Explorer with health group isolation and intelligent categorization.

## Features
- ✅ **Health Group Isolation**: Each health group has isolated access to their documents
- ✅ **Auto-Categorization**: Documents automatically organized by type (invoices, contracts, workflows, other)
- ✅ **Secure Authentication**: Basic Auth with health group mapping
- ✅ **Modern UI**: shadcn/ui components with dark mode support
- ✅ **File Operations**: Upload, download, preview, rename, delete, move
- ✅ **PDF Preview**: Built-in PDF viewer with vue-pdf-embed
- ✅ **Bulk Operations**: Multiple file selection and operations

## Production Deployment

### 1. Worker Deployment (Backend)
```bash
# Set Cloudflare API Token
export CLOUDFLARE_API_TOKEN=your_token_here

# Deploy worker
cd /path/to/R2-Explorer
npx wrangler deploy
```

### 2. Dashboard Deployment (Frontend)

Option A — Cloudflare Pages via GitHub Actions (recommended)

1) Set repository secrets in GitHub:
- `CLOUDFLARE_API_TOKEN` (Pages + Pages Write + Account Read permissions)
- `CLOUDFLARE_ACCOUNT_ID` (found in Cloudflare dashboard)

2) Ensure your Pages project name matches the workflow (default: `explorer-dashboard`).
   - Update `.github/workflows/pages-deploy.yml` `CF_PAGES_PROJECT` if needed.

3) Push to `main` or `dev`. The workflow will:
- Build the dashboard (`packages/dashboard/dist`)
- Deploy via `wrangler pages deploy` to the Pages project

Option B — Manual build + deploy
```bash
# Build for production
cd packages/dashboard
npm run build

# Deploy to Cloudflare Pages
# Either use the Cloudflare dashboard to upload packages/dashboard/dist
# Or use wrangler directly:
wrangler pages deploy packages/dashboard/dist --project-name <your-project> --branch main
```

### 3. Environment Configuration

#### Worker Environment Variables
- `BASIC_AUTH_USERS`: JSON string of user credentials
- `DEFAULT_BUCKET`: R2 bucket name for file storage

#### R2 Bucket Setup
Create R2 buckets:
- `secure-uploads` (production)
- `secure-uploads-preview` (preview/staging)

### 4. Health Group Configuration

Edit `/packages/worker/src/foundation/middlewares/healthGroupIsolation.ts`:

```typescript
const healthGroupMapping: Record<string, string> = {
  henryford_user: "henry_ford",
  cleveland_user: "cleveland_clinic", 
  mayo_user: "mayo_clinic",
  // Add more health groups as needed
};
```

## User Management

### Admin Users
- Full access to all health groups
- Can manage files across all organizations
- Configure in `adminUsers` array

### Health Group Users  
- Isolated access to their organization's files
- Auto-categorization applies to their uploads
- Cannot see other health groups' data

## Document Categories
Files are automatically categorized into:
- **invoices/**: Files containing "invoice", "inv", "bill", "statement"
- **contracts/**: Files containing "contract", "agreement", "msa", "sow"  
- **workflows/**: Files containing "workflow", "process", "diagram", "flow"
- **other/**: All other files

## Security Features
- Basic Authentication with username/password
- Health group data isolation
- Encrypted file storage in R2
- Secure file access with signed URLs
- No client-side storage of credentials

## Additional Notes
- `wrangler.toml` includes `pages_build_output_dir = "packages/dashboard/dist"` so Cloudflare Pages auto-detects the correct build output.
- The dashboard `api` base URL can be configured via `VITE_SERVER_URL` in development.

## Support
For technical support or feature requests, contact the development team.
