---
"r2-explorer": minor
---

Trash / Recycle Bin

Deleted files and folders are now moved to a recoverable trash area inside the same R2 bucket instead of being permanently deleted. A new **Trash** page in the dashboard lets you restore items or delete them forever, and an **Undo** action appears right after deleting a file.

Example configuration:

```ts
export default R2Explorer({
  readonly: false,
  trash: {
    retentionDays: 30,
  },
});
```

To automatically purge expired trash, add a cron trigger to your `wrangler.toml`:

```toml
[triggers]
crons = ["0 0 * * *"]
```

Set `trash: false` to keep the previous hard-delete behavior.
