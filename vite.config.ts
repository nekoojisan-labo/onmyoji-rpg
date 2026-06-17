import { defineConfig } from 'vite';

// GitHub Pages はリポジトリ名サブパス配信になるため base を相対 './' に固定する。
// （絶対 '/' だとサブパスでアセット 404 になる。契約 §1.3 配信）
export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
  },
});
