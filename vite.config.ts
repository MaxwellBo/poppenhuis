import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to serve WASM files with correct MIME type
const wasmPlugin = () => ({
  name: 'wasm',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url?.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm')
      }
      next()
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasmPlugin()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      allow: ['..']
    },
    middlewareMode: false,
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@sparkjsdev/spark'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  define: {
    'import.meta.env.COMMIT_REF': JSON.stringify(process.env.COMMIT_REF),
    'import.meta.env.CONTEXT': JSON.stringify(process.env.CONTEXT),
    'import.meta.env.DEPLOY_ID': JSON.stringify(process.env.DEPLOY_ID),
  },
  worker: {
    format: 'es'
  }
})
