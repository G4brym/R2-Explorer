---
"r2-explorer": patch
---

Fix Content-Disposition header injection in GetObject by sanitizing filenames (replacing non-ASCII with `_` and double quotes with `'`) and adding RFC 5987 `filename*=UTF-8''...` parameter for proper Unicode support.
