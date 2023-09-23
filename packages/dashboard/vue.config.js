module.exports = {
  pwa: {
    name: 'R2 Explorer',
    themeColor: '#4DBA87',
    background_color: '#ffffff',
    display: 'standalone',
    msTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'white',
    shortcuts: [
      {
        name: 'Email Explorer',
        description: 'Navigate your R2 Explorer Emails',
        url: '/emails/',
        icons: [{ src: '/img/icons/android-chrome-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'R2 Explorer',
        description: 'Navigate your R2 Explorer Files',
        url: '/storage',
        icons: [{ src: '/img/icons/android-chrome-192x192.png', sizes: '192x192' }]
      }
    ],
    workboxOptions: {
      skipWaiting: true
    }

    // configure the workbox plugin
    // workboxPluginMode: "InjectManifest",
    // workboxOptions: {
    // swSrc is required in InjectManifest mode.
    // swSrc: "dev/sw.js"
    // ...other Workbox options...
    // }
  }
}
