# r2-web-drive

## Project setup
```
npm install
```

## TODO
- maybe image previewer/thumbnail using workers
- pdf previewer inside the browser
- tooltip when over time ago
- dropdown menu when right click over file or folder
- create folder
- upload folders with files
- get connected user info
- pagination


## Known issues
- Because r2 don't have signed url's the file downloads is made to local storage then it is downloaded as an url. This as a limitation of around 2gb of max file
- Rename files with special characters is not possible [sdk issue](https://github.com/aws/aws-sdk-js/issues/1949)


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
