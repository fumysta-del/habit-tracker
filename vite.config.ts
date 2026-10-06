import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 使用 /habit-tracker/；本地和 Vercel 继续使用 /
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? '/habit-tracker/' : '/',
  plugins: [react()],
  server: {
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/.listening-cache/**',
        '**/server/**',
      ],
    },
  },
})
