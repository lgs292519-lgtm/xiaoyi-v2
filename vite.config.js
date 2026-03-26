import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['9929gp34ri90.vicp.fun'],
    open: false,
    // 本地开发用：把 /api/* 代理到线上，避免缺少 Cloudflare Pages Functions
    proxy: {
      '/api': {
        target: 'https://xiaoyi-v2.pages.dev',
        changeOrigin: true,
      },
    },
  }
})
