import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { readFileSync } from 'fs'
import ts from 'rollup-plugin-ts'

function r2ExplorerPlugin() {
  return {
    name: 'custom',
    resolveId: (id) => {
      if (id.startsWith('explorer:')) {
        return id
      }
    },
    load: async (id) => {
      if (id.startsWith('explorer:')) {
        const path = id.replace('explorer:', '')

        const fileData = readFileSync(`./spa/${path}`)
        return `export default "${fileData.toString('base64')}";`
      }
    },
  }
}

export default {
  input: 'src/index.ts',
  cache: false,
  output: {
    name: 'r2-explorer',
    format: 'umd',
    file: 'dist/umd/index.js',
    sourcemap: false,
  },
  plugins: [ts(), r2ExplorerPlugin(), commonjs(), json(), nodeResolve({ browser: true })],
}
