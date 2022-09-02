# R2-Explorer

## Project setup
```
npm install
```

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
- Upload folders
- Rename folders
- Delete folders
- image thumbnail using workers
- tooltip with absolute time in over time ago
- upload folders with files
- get connected user info
- pagination
- Download for files bigger than 2gb with presigned url's


## Known issues
- Because r2 don't have signed url's the file downloads is made to local storage then it is downloaded as an url. This as a limitation of around 2gb of max file
- Rename files with special characters is not possible with current [sdk issue](https://github.com/aws/aws-sdk-js/issues/1949)


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

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
