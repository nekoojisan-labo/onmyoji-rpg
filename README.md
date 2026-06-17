# onmyoji-rpg ─ 京音都・陰陽師アクションRPG（Phase0 技術プロト）

Vite + TypeScript + Three.js (r0.171.0 固定) の単一テストシーン技術プロト。
正典は `docs/bible/phase0-shared-contract.md`。型・命名・パスはそれに逐語一致させる。

## 必要環境
- Node 23 系（`.nvmrc` 参照）
- npm 10 系

## セットアップ
```bash
npm install
npx playwright install chromium
```

## スクリプト
| コマンド | 内容 |
|---|---|
| `npm run dev` | dev サーバ起動（http://127.0.0.1:5173） |
| `npm run build` | 型チェック＋本番ビルド（`dist/`） |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run typecheck` | TypeScript 型チェック（strict） |
| `npm run test` | Vitest watch（純粋ロジック層のみ） |
| `npm run test:run` | Vitest 単発実行 |
| `npm run coverage` | Vitest カバレッジ（純粋層 80%+ 目標） |
| `npm run screenshot` | headless Chromium で `tools/shots/scene.png` を撮影 |

## アーキテクチャ
- 純粋ロジック層 `src/combat/*`・`src/combat-runtime/hitbox.ts`：Three.js を import せず Vitest で TDD。
- 描画/手触り層 `src/engine/*`・`src/entities/*`・`src/world/*`・`src/ui/*`：Three.js 依存。Playwright スクショ＋手動チェックリストで検証。
- 一方向データフロー（入力 → ロジック更新 → 描画）。

## 配信
GitHub Pages 想定。Vite `base: './'`（相対パス）でサブパス配信に対応。
