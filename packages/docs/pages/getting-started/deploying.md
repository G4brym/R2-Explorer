To deploy your application is just need to be in its root folder, in the same level as the `wrangler.toml` file.

To deploy, run the `wrangler deploy` command, wrangler will then start to build and deploy your application.

If you are not logged in yet, it will prompt you to do so.
Otherwise, the deploy will go trough and print you the application url.

```bash
$ wrangler deploy
 ⛅️ wrangler 3.5.1
------------------
Total Upload: 2161.41 KiB / gzip: 662.18 KiB
Uploaded my-r2-explorer (4.09 sec)
Published my-r2-explorer (6.69 sec)
  https://my-r2-explorer.g4brym.workers.dev
Current Deployment ID: efa04204-488e-4145-bb2d-7805c8e0c6b1
```
