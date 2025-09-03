import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Performance optimizations
    target: 'es2015',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-components': [
            '@/components/ui/Button.vue',
            '@/components/ui/Card.vue',
            '@/components/ui/Input.vue',
            '@/components/ui/LoadingSpinner.vue'
          ],
          'file-components': [
            '@/components/files/FileUploadDialog.vue',
            '@/components/files/FileContextMenu.vue',
            '@/components/files/FolderContextMenu.vue',
            '@/components/files/FilePreviewDialog.vue'
          ],
          'utils': [
            '@/lib/api',
            '@/lib/utils',
            '@/lib/errors',
            '@/lib/performance'
          ]
        }
      }
    },
    // Increase chunk size warning limit for our optimized bundles
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    // Include dependencies that should be pre-bundled
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios'
    ]
  },
  server: {
    // Performance settings for development
    hmr: {
      overlay: false // Reduce overlay noise
    }
  }
})