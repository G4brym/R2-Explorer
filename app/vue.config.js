const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    extract: false,
  },
  outputDir: path.resolve(__dirname, '../spa'),
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
  },
  filenameHashing: false,
})
