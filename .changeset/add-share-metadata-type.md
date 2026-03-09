---
"r2-explorer": patch
---

Add `ShareMetadata` type interface for share link metadata, replacing untyped `any` in `getShareLink` and implicit `any` in `listShares`. Also fix `readOnlyMiddleware` to use Hono's `Next` type instead of `CallableFunction`.
