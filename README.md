# R2-Explorer

A Google Drive Interface for your Cloudflare R2 Buckets!

This project is deployed/self-hosted in your own Cloudflare Account as a Worker, and no credential/token is required to
start using it.

You can see an live example, in `read-only` mode, in your browser at https://r2-explorer.massadas.com/

This project is still in development, and there are definitely going to be some weird issues sometimes, but when you
find something
please [open an new issue](https://github.com/G4brym/R2-Explorer/issues/new) for it to get solved.

## Features

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

## Configurations

These options are defined in the `index.js` file, in the `R2Explorer({ readonly: false, ... })`.

| Name               | Type(s)                  | Description                                                           | Examples                                                  |
|--------------------|--------------------------|-----------------------------------------------------------------------|-----------------------------------------------------------|
| `readonly`         | `boolean` or `undefined` | Controls the write access globally, default: `true`                   | `true`                                                    |
| `cors`             | `boolean` or `undefined` | Enables or disables CORS access to the internal API, default: `false` | `true`                                                    |
| `cfAccessTeamName` | `string`  or `undefined` | When set enforces Cloudflare Access in all requests                   | `radar`  (taken from https://radar.cloudflareaccess.com/) |


## FAQ

Q. Is there any Authentication for r2-explorer?

A. No. If you want authenticated access, you must
setup [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/) in your account.
Access is free up to 50 users.

___

Q. Can i upload files bigger than 100MB?

A. Yes! R2-Explorer now
support's [Multipart Upload](https://developers.cloudflare.com/r2/data-access/workers-api/workers-multipart-usage/),
that splits the files you are uploading in about 95MB chunks for uploading within the Cloudflare 100MB uploading limit.

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

If you want to be able to upload/modify your buckets, you must update the `readonly` flag in `src/index.ts` file.

After that just run publish and the project will be up and running for you and everyone you invite to use the Buckets

```bash
wrangler publish
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
- Download files bigger than 2gb with presigned url's
- set file navigation in the url to allow direct share of a specific file
- only support previews to files under 100mb

## Known issues

- Rename files with special characters is not possible with
  current [sdk issue here](https://github.com/aws/aws-sdk-js/issues/1949)

## Images

Home Page
![Home](https://github.com/G4brym/R2-Explorer/raw/main/docs/images/home.png)

Image Previewer
![Home](https://github.com/G4brym/R2-Explorer/raw/main/docs/images/image-preview.png)

Pdf Previewer
![Home](https://github.com/G4brym/R2-Explorer/raw/main/docs/images/pdf-preview.png)

New Folder
![Home](https://github.com/G4brym/R2-Explorer/raw/main/docs/images/new-folder.png)

Uploading Files
![Home](https://github.com/G4brym/R2-Explorer/raw/main/docs/images/uploading-files.png)

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
