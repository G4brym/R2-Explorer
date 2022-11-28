const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    extract: false
  },
  outputDir: path.resolve(__dirname, '../worker/spa'),
  configureWebpack: {
    optimization: {
      splitChunks: false
    }
  },
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = 'R2-Explorer'
      return args
    })
  }
})
