# R2-Explorer

This project is meant to be an easy interface to browser, upload and manage your Cloudflare R2 buckets.

The interface is heavily inspired by Google Drive navigation, and the features are also based from they.

Cloudflare Access is used as a very basic authentication mechanism, in order to save r2 credentials in the a KV.

You can test this right now in your browser in https://r2.massadas.com/


## Features
- PDF previewer
- Image previewer
- Upload one or multiple files
- Create folders
- Rename files
- Download files
- Delete files
- Right click dropdown menu with file options


## TODO
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
- Because r2 don't have signed url's the file downloads is made to local storage then it is downloaded as an url. 
This as a limitation of around 2gb of max file
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
