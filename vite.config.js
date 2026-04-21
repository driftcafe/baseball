import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/savant': {
        target: 'https://baseballsavant.mlb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/savant/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://baseballsavant.mlb.com/statcast_search',
        },
      },
    },
  },
})
