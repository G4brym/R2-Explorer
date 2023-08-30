# My Personal R2 Explorer

This is my personal [R2 Explorer](https://github.com/G4brym/R2-Explorer) application self hosted on my Cloudflare
account.

You can read the full [documentation here](https://r2explorer.dev/).

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for this, you will only pay
for the [R2 storage](https://developers.cloudflare.com/r2/pricing/).
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish to Cloudflare Workers

### Optional Steps

1. Read only mode is enabled by default, disable it in `src/index.ts`.
2. Learn how to secure your R2 Explorer in the official [documentation here](https://r2explorer.dev/getting-started/security/).


## Updating the instance

Install latest version
```bash
npm install r2-explorer@latest --save
```

Deploy to Cloudflare Workers
```bash
wrangler deploy
```

## Deploying

Deploy to Cloudflare Workers
```bash
wrangler deploy
```
