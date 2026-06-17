import { defineConfig } from 'vitest/config';

// 純粋ロジック層（src/combat/* ・ combat-runtime/hitbox.ts ・ config）専用。
// 描画層（Three.js）はここで実行せず Playwright スクショで検証する。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/combat/**/*.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
