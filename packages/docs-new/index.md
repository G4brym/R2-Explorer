---
sidebar: false
outline: false
---

<div align="center">
  <a href="https://r2explorer.com/">
    <img src="/assets/r2-explorer-logo.png" width="500" height="auto" alt="R2-Explorer"/>
  </a>
</div>

<p align="center">
    <em>A Google Drive Interface for your Cloudflare R2 Buckets!</em>
</p>

<p align="center">
    <a href="https://github.com/G4brym/R2-Explorer/commits/main" target="_blank">
      <img src="https://img.shields.io/github/commit-activity/m/G4brym/R2-Explorer?label=Commits&style=social" alt="R2-Explorer Commits">
  </a>
    <a href="https://github.com/G4brym/R2-Explorer/issues" target="_blank">
      <img src="https://img.shields.io/github/issues/G4brym/R2-Explorer?style=social" alt="Issues">
  </a>
    <a href="https://github.com/G4brym/R2-Explorer/blob/main/LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social" alt="Software License">
  </a>
</p>

<hr />

Read this in other languages: [Español](https://r2explorer-com.translate.goog/?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=wapp),
[Português](https://r2explorer-com.translate.goog/?_x_tr_sl=en&_x_tr_tl=pt-PT&_x_tr_hl=pt-PT&_x_tr_pto=wapp),
[Français](https://r2explorer-com.translate.goog/?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=fr&_x_tr_pto=wapp)

## Features

- Self-hosted/Deployed on your own Cloudflare Account
- [Receive and read emails](/guides/setup-email-explorer.html) (via Cloudflare Email Routing)

### Security:
- [Basic Auth](/getting-started/security.html#basic-auth)
- [Cloudflare Access](/getting-started/security.html#authenticating-with-cloudflare-access)

### Managing files:
- In-browser File preview (pdf, image, txt, markdown, csv, logpush...)
- In-browser File editing
- Drag-and-Drop upload
- Upload files or folders with files
- Multipart upload for big files
- HTTP/Custom metadata edit

### Organization:
- Create folders
- Upload/Rename/Download/Delete files
- Right click in file for extra options

## Coming soon

- allow bucket names with spaces
- Search files
- Rename folders
- Image thumbnail's ?
- Object detection on images using workers-ai ?
- Tooltip when hovering a file with absolute time in "x days time ago" format
- support for responding to emails
- More advanced file editing with more validations per file type

## Known issues

- Email inline images and assets don't load when using basic auth
