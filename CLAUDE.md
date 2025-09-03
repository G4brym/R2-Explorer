# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SpendRule Document Management System** built on the R2-Explorer framework. SpendRule is a healthcare contract validation platform where health groups upload contracts, invoices, and workflow diagrams for validation.

### Base Framework: R2-Explorer
R2-Explorer provides a Google Drive-like interface for Cloudflare R2 storage buckets, built as a monorepo with:

- **Worker Package** (`packages/worker/`): TypeScript Cloudflare Worker built with Hono framework, Chanfana for OpenAPI, and Zod for validation
- **Dashboard Package** (`packages/dashboard/`): Vue.js 3 frontend built with Quasar framework
- **GitHub Action Package** (`packages/github-action/`): Deployment automation
- **Docs Package** (`packages/docs/`): Documentation site

### SpendRule Customizations

#### Business Requirements
- Health groups upload contracts, invoices, and workflow diagrams
- Each health group has isolated access to their folder only
- Auto-categorization by document type from filename
- Currently supports Henry Ford Health, designed for easy expansion
- Files stored in Cloudflare R2 bucket named 'secure-uploads'

#### Folder Structure
```
henry_ford/
  contracts/     # contract, agreement, msa, sow files
  invoices/      # invoice, inv, bill, statement files  
  workflows/     # workflow, process, diagram, flow files
  other/         # everything else
```

#### Authentication & Access Control
- **henry_ford user**: username='henryford_user', password='HF_Secure_2025' (can only access henry_ford/ folder)
- **admin user**: username='spendrule_admin', password='Admin_2025' (full access, can add new health groups)
- Health groups cannot see each other's documents

#### Auto-Organization Logic
Document type detection from filename:
- `contract|agreement|msa|sow` → `contracts/`
- `invoice|inv|bill|statement` → `invoices/`
- `workflow|process|diagram|flow` → `workflows/`
- Everything else → `other/`

## Commands

### Build Commands
```bash
# Build dashboard only
pnpm build-dashboard

# Build worker only  
pnpm build-worker

# Build everything
pnpm build
```

### Linting
```bash
# Lint and auto-fix with Biome (uses tab indentation, double quotes)
pnpm lint
```

### Testing
```bash
# Run worker tests (uses Vitest with Cloudflare Workers pool)
cd packages/worker && pnpm test
```

### Development
```bash
# Start dashboard dev server
cd packages/dashboard && pnpm dev

# Worker development
cd packages/worker && pnpm dev
```

### Deployment
```bash
# Deploy dashboard to production
pnpm deploy-dashboard

# Deploy dashboard to dev
pnpm deploy-dashboard-dev

# Deploy worker to dev
pnpm deploy-dev-worker
```

## Architecture

### Worker Architecture (SpendRule-Modified)
- **Framework**: Hono with TypeScript
- **API**: RESTful with OpenAPI spec via Chanfana
- **Authentication**: Basic auth with role-based folder access
- **Storage**: Cloudflare R2 'secure-uploads' bucket
- **Auto-Organization**: Custom middleware for document type detection
- **Entry Point**: `packages/worker/src/index.ts`
- **Key SpendRule Modules**:
  - `modules/buckets/`: Extended with auto-categorization logic
  - `modules/auth/`: Health group isolation middleware
  - `modules/metadata/`: Custom metadata (healthGroup, documentType, uploadedAt, fileSize)

### Dashboard Architecture (SpendRule-Modified)
- **Framework**: Vue.js 3 with Composition API
- **UI**: Quasar framework with healthcare-focused styling
- **State**: Pinia for state management with health group context
- **Features**: 
  - Drag-and-drop multiple file uploads
  - Auto-folder assignment preview
  - Health group folder isolation
  - Special handling for workflow diagrams (images, PDFs, Visio)
  - Filename sanitization (preserve original, remove dangerous characters)

### Package Structure
```
packages/
├── worker/          # Cloudflare Worker with SpendRule auth/organization
├── dashboard/       # Vue.js frontend with health group UI
├── github-action/   # Deployment automation
└── docs/           # Documentation site
```

## SpendRule Usage Instructions

### For Health Groups (Henry Ford Health)
1. **Login**: Use credentials `henryford_user` / `HF_Secure_2025`
2. **Upload Files**: Drag and drop multiple files - they'll auto-organize by type:
   - Contract files go to `contracts/` folder
   - Invoice files go to `invoices/` folder  
   - Workflow diagrams go to `workflows/` folder
   - Other files go to `other/` folder
3. **Create Subfolders**: Organize by vendor as needed within each category
4. **File Access**: Only see files in your `henry_ford/` folder

### For Administrators
1. **Login**: Use credentials `spendrule_admin` / `Admin_2025`
2. **Full Access**: View all health group folders
3. **Add New Health Groups**: Create new top-level folders and user accounts
4. **Monitor Usage**: View all uploaded documents and metadata

### Document Types Recognized
- **Contracts**: Files containing words like 'contract', 'agreement', 'msa', 'sow'
- **Invoices**: Files containing words like 'invoice', 'inv', 'bill', 'statement'
- **Workflows**: Files containing words like 'workflow', 'process', 'diagram', 'flow'
- **Other**: All other files

### Supported File Types
- **Workflow Diagrams**: Images (PNG, JPG), PDFs, Visio files (.vsd, .vsdx)
- **Contracts**: PDFs, Word documents, text files
- **Invoices**: PDFs, Excel files, images, text files
- **General**: All file types supported

## Code Conventions

- **Code Style**: Enforced by Biome with tab indentation and double quotes
- **TypeScript**: Strict mode enabled in worker package
- **Vue**: Composition API preferred, uses `<script setup>` syntax
- **API**: RESTful design with OpenAPI documentation
- **SpendRule Modules**: Feature-based organization with health group isolation

## Important Files

- `biome.json`: Code formatting and linting configuration
- `pnpm-workspace.yaml`: Monorepo workspace configuration  
- `DEVELOPMENT.md`: Additional development commands and PWA asset generation
- `packages/worker/src/types.d.ts`: Core TypeScript type definitions
- `packages/worker/src/modules/auth/`: SpendRule authentication and authorization
- `packages/worker/src/modules/organization/`: Document auto-categorization logic

## Deployment Configuration

- **R2 Bucket**: `secure-uploads`
- **Environment**: Cloudflare Workers
- **Authentication**: Basic Auth with health group isolation
- **Domain**: Configure custom domain for production use