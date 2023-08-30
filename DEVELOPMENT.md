# Development instruction for R2 Explorer

## Build and publish Dashboard into Dev

```bash
cd packages/dashboard/
npm run build
wrangler pages publish --branch dev --project-name r2-explorer-dashboard dist/
```

## Publish create-r2-explorer package

Increase version in `packages/create-r2-explorer/package.json`

```bash
cd packages/create-r2-explorer/
npm run build
npm publish --access public
```

## Manually publish worker

```bash
cd worker
export RELEASE_VERSION=v1.0.0
node config/preparePublish.js
npm run build
npm publish --access public
```
