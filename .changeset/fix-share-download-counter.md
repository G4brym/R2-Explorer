---
"r2-explorer": patch
---

Fix share link download counter incrementing before verifying file exists. Previously, if the shared file was deleted from the bucket, accessing the share link would still increment the download counter before returning a 404 error. This could exhaust the download limit without any actual downloads occurring. The counter now only increments after confirming the file exists.
