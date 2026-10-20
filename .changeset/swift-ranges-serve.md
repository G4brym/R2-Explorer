---
"r2-explorer": patch
---

Serve HTTP Range requests on `GET /api/buckets/:bucket/:key`: 206 Partial Content for satisfiable ranges and 416 for unsatisfiable ones, so API clients and direct URLs can fetch byte ranges. The dashboard preview download and share links are unchanged.
