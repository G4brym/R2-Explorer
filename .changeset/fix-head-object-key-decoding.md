---
"r2-explorer": patch
---

Fix HeadObject OpenAPI summary from "Get Object" to "Head Object" and align base64 key decoding in HeadObject and PutMetadata with GetObject's three-level fallback to handle edge-case encoded keys consistently across all endpoints.
