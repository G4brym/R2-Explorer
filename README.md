# R2-Explorer

A Google Drive Interface for your Cloudflare R2 Buckets!

This project is an easy to use browser interface to upload and manage your Cloudflare R2 buckets.

This project is deployed in your own Cloudflare Account as a Worker, and no credential is required to start using it.

You can see an example `read-only` right now in your browser in https://r2.massadas.com/

TODO:
- allow bucket names with spaces
- write docs on how to setup cloudflare access
- txt file previewer

## Features

- **Near instant** bucket/folder navigation
- PDF previewer
- Image previewer
- Upload one or multiple files
- Create folders
- Rename files
- Download files
- Delete files
- Right click dropdown menu with file options

## Getting Started

Run this command to get an example project setup

```bash
npx r2-explorer my-r2-explorer
```

Change into the newly created directory and install the packages

```bash
cd my-r2-explorer
npm install
```

Update the `wrangler.toml` with your R2 Buckets (tip: you can setup as many Buckets as your want)

```
- wrangler.toml -
...
[[r2_buckets]]
binding = 'my-bucket-name'
bucket_name = 'my-bucket-name'
preview_bucket_name = 'my-bucket-name'
```

After that just run publish and the project will be up and running for you and everyone you invite to use the Buckets

```bash
wrangler publish
```

## TODO

- Search files
- CSV Previewer
- Upload folders
- Rename folders
- Delete folders
- Image thumbnail's using Cloudflare workers
- Tooltip when hovering a file with absolute time in "x days time ago" format
- Upload folders with files
- Automatically load more files, when the bottom is reached (current limit is 1000 files)
- Download files bigger than 2gb with presigned url's
- Allow user to pick to save credentials in cloud or in browser local storage

## Known issues

- Rename files with special characters is not possible with current [sdk issue here](https://github.com/aws/aws-sdk-js/issues/1949)

## Images

Home Page
![Home](https://github.com/G4brym/R2-Explorer/raw/master/docs/images/home.png)

Image Previewer
![Home](https://github.com/G4brym/R2-Explorer/raw/master/docs/images/image-preview.png)

Pdf Previewer
![Home](https://github.com/G4brym/R2-Explorer/raw/master/docs/images/pdf-preview.png)

New Folder
![Home](https://github.com/G4brym/R2-Explorer/raw/master/docs/images/new-folder.png)

Uploading Files
![Home](https://github.com/G4brym/R2-Explorer/raw/master/docs/images/uploading-files.png)

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```
