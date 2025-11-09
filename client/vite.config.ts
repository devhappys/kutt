import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://surl-api.hapxs.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    // 开发环境使用 true，生产环境建议使用 'hidden'
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    // 优化分块
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true, // 不在 source map 中包含源代码
      }
    }
  },
})
