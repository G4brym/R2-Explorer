# Trash / Recycle Bin

R2 Explorer includes a built-in trash feature that makes file deletes recoverable. Instead of permanently removing objects, deleted files and folders are moved to a hidden trash area inside the same R2 bucket. You can restore items or permanently delete them from the dashboard at any time.

## Overview

With Trash enabled, you can:

- **Recover deleted files** - Restore accidentally deleted objects to their original location
- **Restore folders** - Entire folders and their contents are preserved in trash
- **Permanently delete** - Free space by deleting individual items or emptying the whole trash
- **Undo recent deletes** - A one-click undo action appears after moving a file to trash
- **Auto-purge old trash** - Use a cron trigger to automatically remove items after a retention period

## How It Works

When you delete a file or folder:

1. R2 Explorer moves the object to `.r2-explorer/trash/{uuid}/{original-key}` in the same bucket
2. The original metadata is preserved, including `customMetadata`
3. Trash metadata (`trashOriginalKey`, `trashDeletedAt`, `trashDeletedBy`) is added to the object
4. The file disappears from the normal file browser

You can browse trashed items from the **Trash** page in the dashboard. Restoring an item moves it back to its original key. If an object now exists at that key, R2 Explorer restores it to a renamed path like `file (restored 2026-01-01T00-00-00).txt`.

## Enabling and Disabling Trash

Trash is **enabled by default** with a 30-day retention window. To change the retention period or disable trash, update your `src/index.ts`:

```ts
import { R2Explorer } from "r2-explorer";

export default R2Explorer({
  readonly: false,
  trash: {
    retentionDays: 30, // default
  },
});
```

To disable trash and restore hard-delete behavior:

```ts
import { R2Explorer } from "r2-explorer";

export default R2Explorer({
  readonly: false,
  trash: false,
});
```

## Automatic Cleanup with Cron Triggers

You can schedule automatic purging of expired trash by adding a `[triggers]` block to your `wrangler.toml`. Items older than `retentionDays` are permanently deleted.

```toml
[triggers]
crons = ["0 0 * * *"]
```

This example runs once per day at midnight. Cloudflare Workers free plans include support for cron triggers.

## Using the Dashboard

### Moving Files to Trash

1. Right-click any file or folder
2. Select **Delete**
3. Optionally check **Delete permanently (skip trash)**
4. Click **Delete**

For files, a notification appears with an **Undo** button that restores the file immediately.

### Restoring Files

1. Open the **Trash** page from the left sidebar
2. Find the file or folder you want to recover
3. Click the **Restore** button
4. The item returns to its original location

### Permanently Deleting Items

- To delete a single item forever: click the **Delete forever** button on the trash row
- To empty the entire trash: click **Empty trash** at the top of the page and confirm

## API Reference

### Delete Object

**Endpoint:** `POST /api/buckets/:bucket/delete`

**Request Body:**
```json
{
  "key": "base64-encoded-key",
  "permanent": false
}
```

Set `permanent: true` to skip trash and delete the object forever.

**Response:**
```json
{
  "success": true,
  "trashed": true,
  "trashKey": ".r2-explorer/trash/abc123/file.txt"
}
```

### List Trash

**Endpoint:** `GET /api/buckets/:bucket/trash`

**Response:**
```json
{
  "objects": [
    {
      "trashKey": ".r2-explorer/trash/abc123/file.txt",
      "originalKey": "file.txt",
      "deletedAt": 1762819200000,
      "deletedBy": "admin",
      "size": 1024
    }
  ],
  "truncated": false
}
```

### Restore from Trash

**Endpoint:** `POST /api/buckets/:bucket/trash/restore`

**Request Body:**
```json
{
  "trashKey": "base64-encoded-trash-key"
}
```

**Response:**
```json
{
  "success": true,
  "restoredKey": "file.txt"
}
```

### Purge Trash

**Endpoint:** `POST /api/buckets/:bucket/trash/purge`

Delete a single item:
```json
{
  "trashKey": "base64-encoded-trash-key"
}
```

Empty the entire trash:
```json
{}
```

**Response:**
```json
{
  "success": true,
  "deleted": 1
}
```

## Storage Details

Trash is stored under:
```
.r2-explorer/trash/{uuid}/{original-key}
```

The `{uuid}` segment prevents collisions when the same path is deleted multiple times. Because the original key is preserved in the path, you can also inspect or recover items using any R2 tool (for example, the Cloudflare dashboard or `wrangler r2 object get`).

## Important Notes

- Objects under `.r2-explorer/` (shares, emails, thumbnails, and trash itself) are always hard-deleted, never trashed
- Trash metadata is stored as `customMetadata` on the trashed object itself; no sidecar files are used
- Very large objects may not be copyable through the Worker in a single request. If a file cannot be moved to trash, the delete operation returns a clear error and the object is not removed
- Deleting a huge folder happens inside the Worker with pagination. Partial failures are surfaced in the response when possible
