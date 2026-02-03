# R2-Explorer Roadmap

This document outlines future features and enhancements for R2-Explorer, with detailed implementation strategies for each.

## Design Principles

- **Zero External Dependencies:** No KV, D1, or Analytics Engine required - all data stored in R2 buckets
- **Cost Effective:** Leverage free R2 storage and metadata capabilities
- **Simple Architecture:** Maintain serverless-first design with minimal complexity
- **User-Focused:** Prioritize features that directly improve file management workflows

---

## Priority 1: Core Features

### 1. Public Sharing Links (Presigned URLs)

**Description:** Generate temporary or permanent shareable links for files with configurable expiration, password protection, and download limits.

**Value:** Enables easy file sharing without requiring authentication, major use case for file management systems.

**Implementation:**

#### Backend (Worker)
1. **New Endpoint:** `POST /api/buckets/:bucket/:key/share`
   - Create new module: `packages/worker/src/modules/buckets/createShareLink.ts`
   - Extend `OpenAPIRoute` with Zod schema:
     ```typescript
     schema = {
       request: {
         params: z.object({
           bucket: z.string(),
           key: z.string(),
         }),
         body: z.object({
           expiresIn: z.number().optional(), // seconds
           password: z.string().optional(),
           maxDownloads: z.number().optional(),
         }),
       },
     }
     ```

2. **Storage:** Store share metadata in R2 using special path (similar to email storage):
   ```typescript
   // Store in: .r2-explorer/sharable-links/{shareId}.json
   const shareMetadata = {
     bucket: string,
     key: string,
     expiresAt: number,           // Unix timestamp
     passwordHash: string?,       // Hashed with Web Crypto API
     maxDownloads: number?,
     currentDownloads: number,
     createdBy: string,
     createdAt: number,
   };
   
   // Generate short 10-character share ID (trim UUID and remove dashes)
   const shareId = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
   // Example: "550e8400e2" instead of full UUID
   // Note: Check if shareId already exists and regenerate if collision occurs
   
   await env[bucket].put(
     `.r2-explorer/sharable-links/${shareId}.json`,
     JSON.stringify(shareMetadata),
     {
       httpMetadata: { contentType: 'application/json' },
       customMetadata: {
         targetBucket: bucket,
         targetKey: key,
       }
     }
   );
   ```

3. **Public Access Endpoint:** `GET /share/:shareId`
   - No authentication required
   - `:shareId` is a 10-character alphanumeric string (e.g., "550e8400e2")
   - Fetch share metadata from `.r2-explorer/sharable-links/{shareId}.json`
   - **Check expiration manually** (R2 doesn't auto-expire):
     ```typescript
     const metadata = JSON.parse(await shareObject.text());
     if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
       return c.json({ error: 'Share link expired' }, 410);
     }
     ```
   - Validate password if set (use Web Crypto API `crypto.subtle.digest`)
   - Check download limits
   - Increment download counter by re-uploading metadata
   - Return file directly or generate temporary redirect

4. **List Shares Endpoint:** `GET /api/buckets/:bucket/shares`
   - List all objects under `.r2-explorer/sharable-links/`
   - Parse metadata and return active shares
   - Filter out expired shares

5. **Revoke Share Endpoint:** `DELETE /api/buckets/:bucket/share/:shareId`
   - Delete `.r2-explorer/sharable-links/{shareId}.json`

6. **Cleanup Expired Shares:** Add periodic cleanup (optional Cron trigger)
   - List all share metadata files
   - Delete expired ones to save storage

7. **QR Code:** Generate on-the-fly using Workers:
   - Install `qrcode` package
   - Return QR code as SVG or PNG

#### Frontend (Dashboard)
1. **Share Dialog Component:** `packages/dashboard/src/components/dialogs/ShareFileDialog.vue`
   - Quasar Dialog with form for share options
   - Display generated link with copy button
   - Show QR code preview
   - List active shares for file

2. **Context Menu:** Add "Share" option to file context menu in `FilesFolderPage.vue`

3. **Share Management View:** New page to view/revoke all active shares
   - Show expiration status
   - Download counter
   - One-click revoke

**Estimated Effort:** 4-5 days

---

### 2. Batch Operations

**Description:** Select multiple files/folders and perform bulk operations (delete, move, download, metadata edit).

**Value:** Dramatically improves productivity for users managing many files.

**Implementation:**

#### Backend (Worker)
1. **Batch Delete Endpoint:** `POST /api/buckets/:bucket/batch/delete`
   - Modify `DeleteObject` to accept array of keys:
     ```typescript
     body: z.object({
       keys: z.array(z.string()),
     })
     ```
   - Use `Promise.all()` to delete in parallel (limit concurrency to 10)
   - Return success/failure status for each key

2. **Batch Move Endpoint:** `POST /api/buckets/:bucket/batch/move`
   - Accept array of `{ oldKey, newKey }` pairs
   - Execute moves in parallel with concurrency limit

3. **Batch Download:** `POST /api/buckets/:bucket/batch/download`
   - Stream-create ZIP file using `CompressionStream` API (confirmed available in Cloudflare Workers)
   - Use `ReadableStream` to avoid memory limits:
     ```typescript
     // CompressionStream is supported in Workers runtime
     const stream = new CompressionStream('gzip');
     // Pipe multiple files through compression stream
     ```
   - Return as single ZIP download
   - **Note:** CompressionStream supports 'gzip' and 'deflate'. For proper ZIP format, use `fflate` library from dashboard dependencies

4. **Batch Metadata Update:** `POST /api/buckets/:bucket/batch/metadata`
   - Accept array of keys and shared metadata
   - Update in parallel

#### Frontend (Dashboard)
1. **Selection Mode:** Add checkbox column to file table
   - Track selected items in Pinia store: `packages/dashboard/src/stores/selection-store.js`
   - "Select All" checkbox in header
   - Shift-click for range selection
   - CMD/CTRL+Click for multi-select

2. **Batch Action Bar:** Fixed bottom toolbar when items selected
   - Show count of selected items
   - Action buttons: Delete, Move, Download, Edit Metadata
   - Cancel selection button

3. **Progress Dialog:** For long-running batch operations
   - Show progress bar with X/Y complete
   - List failed operations
   - Allow cancellation

4. **Keyboard Shortcuts:**
   - `CMD+A` / `CTRL+A`: Select all
   - `CMD+D` / `CTRL+D`: Deselect all
   - `Delete`: Delete selected

**Estimated Effort:** 5-6 days

---

### 3. Copy Files (Not Just Move)

**Description:** Duplicate files within same bucket or across folders, preserving metadata.

**Value:** Basic file management operation currently missing.

**Implementation:**

#### Backend (Worker)
1. **Copy Endpoint:** `POST /api/buckets/:bucket/copy`
   - Create module: `packages/worker/src/modules/buckets/copyObject.ts`
   - Schema:
     ```typescript
     body: z.object({
       sourceKey: z.string(),
       destinationKey: z.string(),
       preserveMetadata: z.boolean().default(true),
     })
     ```
   - Implementation:
     ```typescript
     const source = await env[bucket].get(sourceKey);
     await env[bucket].put(destinationKey, source.body, {
       httpMetadata: source.httpMetadata,
       customMetadata: preserveMetadata ? source.customMetadata : {},
     });
     ```

2. **Register Route:** Add to `packages/worker/src/index.ts`:
   ```typescript
   openapi.post("/api/buckets/:bucket/copy", CopyObject);
   ```

#### Frontend (Dashboard)
1. **Context Menu:** Add "Copy" and "Duplicate" options
   - Copy: Opens dialog to select destination
   - Duplicate: Creates copy with "- Copy" suffix

2. **Keyboard Shortcut:** `CMD+C` / `CTRL+C` to copy selected file

3. **Copy Dialog:** Reuse/extend move dialog with preserve metadata checkbox

**Estimated Effort:** 1-2 days

---

## Priority 2: Quality of Life Improvements

### 4. Keyboard Shortcuts

**Description:** Comprehensive keyboard shortcuts for all common operations.

**Implementation:**
- Use `@vueuse/core` `useMagicKeys` composable
- Create shortcuts component in `packages/dashboard/src/components/utils/KeyboardShortcuts.vue`
- Map keys to store actions:
  ```javascript
  const { ctrl_a, ctrl_c, ctrl_x, delete: deleteKey, escape } = useMagicKeys();
  
  watch(ctrl_a, (v) => { if (v) selectionStore.selectAll(); });
  watch(deleteKey, (v) => { if (v) deleteSelected(); });
  ```
- Add "?" key to show shortcuts help modal

**Estimated Effort:** 1-2 days

---

### 5. Dark Mode

**Description:** Toggle between light and dark themes.

**Implementation:**
- Quasar has built-in dark mode support
- Add to `packages/dashboard/src/layouts/MainLayout.vue`:
  ```javascript
  import { useQuasar } from 'quasar';
  const $q = useQuasar();
  $q.dark.set(true);
  ```
- Store preference in localStorage
- Add toggle button to header

**Estimated Effort:** 0.5-1 day

---

### 6. File Tagging System

**Description:** Add custom labels and color-coding to files for organization.

**Implementation:**
- Store tags in R2 custom metadata: `{ tags: ['important', 'project-x'] }`
- Create tag management UI component
- Filter files by tags
- Tag-based search

**Estimated Effort:** 2-3 days

---

### 7. Progressive Web App (PWA)

**Description:** Make dashboard installable on mobile/desktop devices.

**Implementation:**
- Quasar has PWA mode built-in
- Enable in `quasar.config.js`:
  ```javascript
  pwa: {
    workboxMode: 'generateSW',
    manifest: {
      name: 'R2 Explorer',
      short_name: 'R2 Explorer',
      theme_color: '#027be3',
    }
  }
  ```
- Add service worker for offline capability
- Configure caching strategies

**Estimated Effort:** 1-2 days

---

## Implementation Priorities Summary

**Phase 1 (Immediate - Core Features):**
1. Public Sharing Links (4-5d)
2. Batch Operations (5-6d)
3. Copy Files (1-2d)

**Total Effort: ~12 days**

**Phase 2 (Quality of Life):**
4. Keyboard Shortcuts (1-2d)
5. Dark Mode (0.5-1d)
6. File Tagging System (2-3d)
7. Progressive Web App (1-2d)

**Total Effort: ~6 days**

**Overall Roadmap: ~18 days of development**

---

## Technical Considerations

### Performance
- Use streaming APIs to avoid Worker memory limits (128MB)
- Implement pagination for large lists
- Use Web Workers in frontend for heavy processing
- Minimize R2 operations (list, get, put) to reduce latency
- Batch operations where possible to reduce API calls

### Security
- All new endpoints must respect readonly mode
- Validate all input with Zod schemas
- Sanitize user-provided metadata
- Rate limit intensive operations
- Add CSRF protection for state-changing operations
- Use Web Crypto API for password hashing (no external libraries needed)
- Validate expiration times on every share link access

### Cost Optimization
- Workers: Most operations within free tier (100k requests/day)
- R2: Free egress for same-region Workers
- R2: Class A operations (write/list) cost $4.50/million - optimize bulk operations
- R2: Class B operations (read) cost $0.36/million - very cheap
- Store metadata in R2 objects (free) instead of external databases
- Use R2 custom metadata for tagging and categorization (no additional cost)

### Testing
- Add unit tests for each new endpoint in `packages/worker/tests/`
- Use `@cloudflare/vitest-pool-workers` for Worker testing
- Add E2E tests for critical user flows (Playwright recommended)
- Test with large files and buckets to validate streaming
- **Verify CompressionStream support:** Test in Workers environment before implementing batch download
  ```typescript
  // Test in wrangler dev or deployed worker
  const stream = new CompressionStream('gzip');
  console.log('CompressionStream supported:', !!stream);
  ```

### Documentation
- Update `AGENTS.md` with new endpoints and patterns
- Add user documentation to `packages/docs/`
- Include API examples in OpenAPI schema
- Create migration guide for breaking changes

### Notes
- **CompressionStream:** Available in Cloudflare Workers runtime. Supports 'gzip' and 'deflate' compression. For proper ZIP file format with headers and directory structure, use `fflate` library (already a dependency in dashboard package).
- **Share Link Storage:** Using `.r2-explorer/sharable-links/` prefix follows the existing pattern used for email storage (`.r2-explorer/emails/inbox/`), keeping all internal metadata organized and hidden from normal file browsing.
