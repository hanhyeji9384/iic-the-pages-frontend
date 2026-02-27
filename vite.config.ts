import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React SWC: 빠른 빌드를 위한 React 플러그인
    react(),
    // Tailwind CSS v4: 새로운 방식의 Tailwind 통합
    tailwindcss(),
  ],
  resolve: {
    // @ 경로를 src/ 폴더로 매핑
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
