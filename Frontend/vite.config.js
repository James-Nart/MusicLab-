import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'Media Files',        // ← ADD THIS LINE (use YOUR folder name)
})