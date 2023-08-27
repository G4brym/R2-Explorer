# R2-Explorer

A Google Drive Interface for your Cloudflare R2 Buckets!

This project is deployed/self-hosted in your own Cloudflare Account as a Worker, and no credential/token is required to
start using it.

- Documentation: [r2explorer.dev](https://r2explorer.dev)
- Live Demo: [demo.r2explorer.dev](https://demo.r2explorer.dev)


## Features

- [Email Explorer](https://r2explorer.dev/guides/setup-email-explorer/) (using Cloudflare Email Routing)
- Very quick bucket/folder navigation
- pdf, image, txt, markdown, csv, etc in-browser preview
- Drag-and-Drop upload
- Multiple files and folder uploads
- Create folders
- Rename files
- Download files
- Delete files
- Right click in file for extra options
- Multipart upload for big files
- Cloudflare Access validation using jwt

## Getting Started

Run this command to get an example project setup

```bash
npm create r2-explorer@latest
```

## Upgrading your installation

In order to update to the latest version you just need to install the latest r2-explorer package from npm and re-deploy
your application

```bash
npm install r2-explorer@latest --save
```

```bash
wrangler publish
```

## TODO

- allow bucket names with spaces
- Search files
- Rename folders
- Delete folders
- Image thumbnail's using Cloudflare workers
- Tooltip when hovering a file with absolute time in "x days time ago" format
- Automatically load more files, when the bottom is reached (current limit is 1000 files)

## Known issues

- Rename files with special characters is not possible with
  current [sdk issue here](https://github.com/aws/aws-sdk-js/issues/1949)


## Development

Publish Dashboard into dev branch
```
cd packages/dashboard/
npm run build
wrangler pages publish --branch dev --project-name r2-explorer-dashboard dist/
```
