import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Rewrite the cookie domain on proxied responses so the browser
        // stores it against localhost:3000, not localhost:4000
        cookieDomainRewrite: 'localhost',
      }
    }
  }
})
