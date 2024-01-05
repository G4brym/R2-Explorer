[![Commit rate](https://img.shields.io/github/commit-activity/m/G4brym/R2-Explorer?label=Commits&style=social)](https://github.com/G4brym/R2-Explorer/commits/main) [![Issues](https://img.shields.io/github/issues/G4brym/R2-Explorer?style=social)](https://github.com/G4brym/R2-Explorer/issues) [![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social)](LICENSE)

Read this in other languages: [Español](READMEes.md), [Português](READMEpt.md), [Français](READMEfr.md)

# R2-Explorer

<p align="center">
    <em>A Google Drive Interface for your Cloudflare R2 Buckets!</em>
</p>

<p>
  This project is deployed/self-hosted in your own Cloudflare Account as a Worker, and no credential/token is required to
  start using it.
</p>

---

**Documentation**: <a href="https://r2explorer.dev" target="_blank">https://r2explorer.dev</a>

**Live Demo**: <a href="https://demo.r2explorer.dev" target="_blank">https://demo.r2explorer.dev</a>

---

## Features

- PWA support (install this app on your phone)
- [Email Explorer](https://r2explorer.dev/guides/setup-email-explorer/) (using Cloudflare Email Routing)
- [Basic Auth](https://r2explorer.dev/getting-started/security/#basic-auth)
- [Cloudflare Access Authentication](https://r2explorer.dev/getting-started/security/)
- Very quick bucket/folder navigation
- pdf, image, txt, markdown, csv, etc in-browser preview
- Drag-and-Drop upload
- Multiple files and folder uploads
- Create folders
- Upload/Rename/Download/Delete files
- Right click in file for extra options
- Multipart upload for big files

## Getting Started

You can either deploy with Cloudflare Deploy Button using GitHub Actions or deploy on your own.

### Deploy with Cloudflare Deploy Button

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button?paid=true)](https://deploy.workers.cloudflare.com/?url=https://github.com/G4brym/R2-Explorer&paid=true)

### Deploying manually using npm and Wrangler (command line)

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
- bundle bootstrap icons instead of importing
- support for responding to emails
