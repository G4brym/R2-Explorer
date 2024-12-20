## What changed

- Refactored worker to use [hono](https://github.com/honojs/hono) + [chanfana](https://github.com/cloudflare/chanfana)
- Dashboard is now served via [workers static assets](https://developers.cloudflare.com/workers/static-assets/)

## Updating wrangler

```bash
npm install --save wrangler@latest
```

## Updating wrangler.toml

Add this line to the top of your `wrangler.toml` file:
```toml
assets = { directory = "node_modules/r2-explorer/dashboard", binding = "ASSETS", html_handling = "auto-trailing-slash", not_found_handling = "single-page-application" }
```

It should look something like this:
```toml
name = "r2-explorer"
compatibility_date = "2024-11-06"
main = "src/index.ts"
assets = { directory = "node_modules/r2-explorer/dashboard", binding = "ASSETS", html_handling = "auto-trailing-slash", not_found_handling = "single-page-application" }

# ... buckets bellow this line
```

## Installing the latest version


```bash
npm install r2-explorer@latest --save
```

Then proceed to deploy your application:
```bash
wrangler deploy
```
