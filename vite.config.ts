import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.COMMIT_REF': JSON.stringify(process.env.COMMIT_REF),
    'import.meta.env.CONTEXT': JSON.stringify(process.env.CONTEXT),
    'import.meta.env.DEPLOY_ID': JSON.stringify(process.env.DEPLOY_ID),
  }
})
