# 京音都・陰陽師RPG Phase0 技術プロト Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Vite+TypeScript+Three.js の単一テストシーンで、オルソ・アイソメ（仰角30°/yaw45°）カメラの下、2Dビルボードの主人公「凪沙」をWASD移動させ、召喚式神「玄」が追従し、敵「鬼火童子」とリアルタイム戦闘（符・呪・玄の攻撃・回避i-frame・鎮魂・穢）を成立させる、面白さ検証前の最小の技術的確認を作る。

**Architecture:** 副作用のない純粋ロジック層（`src/combat/*`：五行・ダメージ・ステ・穢・レベル）と、Three.js に依存する描画/手触り層（`src/engine/*`・`src/entities/*`・`src/world/*`・`src/ui/*`）を厳格に分離する。純粋層は Vitest で TDD し描画層から import されるが逆依存しない。アプリは固定タイムステップの更新ループ（`Game`）が `World`（エンティティ管理）と `Renderer`（Three.js）を駆動し、入力→ロジック更新→描画の一方向データフローで動く。

**Tech Stack:** Vite 6.x（`^6.0.0`）／TypeScript 5.x（`^5.6.0`・`strict: true`）／Three.js r0.171.0（`three@^0.171.0` + `@types/three@^0.171.0`・バージョン固定。range更新で API drift しないよう lockfile を必ずコミット）／Vitest 2.x（`^2.1.0`・環境 `node`。純粋ロジック専用）／Playwright 1.x（`^1.49.0`・headless Chromium スクリーンショット）＋手動チェックリスト。パッケージ管理は npm（lockfile = `package-lock.json` を必ずコミット）。配信は GitHub Pages（`vite.config.ts` の `base` を相対 `./`）。作業場所は `~/projects/onmyoji-rpg/`（非iCloud・git破壊回避）。

## Global Constraints

以下は変更不可。全タスクが前提として共有する（00-README / 00b から逐語）。

- 規模: 1人用ブラウザゲーム。サーバー/通信/マルチプレイ無し。
- エンジン: Three.js（2.5D/3D）。
- 視点: アイソメトリック。オルソ（平行投影）カメラを斜め固定。深度は z で自動ソート。
- カメラ角: 方位角 yaw = 45°（クラシックアイソメ）／仰角 pitch = 30°固定（確定・裁定。35.264°は撤回）。カメラは回転しない＝ターゲットを中点に平行移動のみ。
- 描画: フル2.5Dビルボード（2D画像を板ポリ＝`PlaneGeometry`に貼り3D空間に立てる）。板は回さず固定回転Mesh。常時 `lookAt` は呼ばない。
- facing 方向数: 4方向で確定（`down`/`left`/`right`/`up`）。右＝左の水平反転（flipX＝`scale.x` 反転 or UV反転）で表現し別テクスチャを持たない。8方向・斜め4方向は撤回。
- 移動入力: WASD/矢印。4方向入力＋斜め同時押し許容で正規化（斜めが速くならない）。`facing` は4方向へ丸める。ワールド座標は float 保持、描画時のみ整数（内部解像度ピクセル）へスナップ。
- 戦闘: リアルタイム/アクション。`battle` は `field` 内のサブ状態（マップ遷移を伴わない）。
- 主人公の手段（式神オンリー・直接近接で殴らない）: 符（ふだ・遠隔の基本攻撃・skillMul=1.0・気消費なし）＋呪（じゅ・詠唱スキル・気消費・術力依存・個別CD）＋式神の召喚/切替/指揮＋鎮魂のみ。
- 対象プラットフォーム: v1はPC（デスクトップChrome）専用。モバイルはv2。
- ボイス: v1はボイス無し（BGM/SEのみ）。
- 通貨: 文（もん）（Phase0では未使用だが語彙固定。旧「銭/zeni」は全廃）。
- MP相当: 気（き）に一本化（旧「呪力/MP/JURYOKU」は全廃）。
- ステータス列（正典8項目・00b §2.1）: `HP` / `気(ki)` / `体(tai)` / `護(go)` / `術力(jutsuryoku)` / `速(spd)` / `CRT率(critRate %)` / `critMul(会心倍率)`。HIT/EVA は廃止（命中100%固定・手動i-frameのみ）。
- 五行（00b §3）: 相生（与ダメ減・不利方向）`木→火→土→金→水→木` = ×0.85／相克（攻撃側有利）`木→土→水→火→金→木` = ×1.25／無関係・同属性 = ×1.00。相克の組: wood→earth, fire→metal, earth→water, metal→wood, water→fire。相生の組: wood→fire, fire→earth, earth→metal, metal→water, water→wood。
- ダメージ式（00b §2.2）: `物理基礎=体×skillMul`／`呪術基礎=術力×skillMul`／`防御後=基礎×(100/(100+護))`／`属性後=防御後×elemMul`／`会心後=属性後×(会心ならcritMul else 1.0)`／`最終=max(1, floor(会心後×random(0.95,1.05)))`。符 skillMul=1.0、呪術 1.4〜3.0。
- 鎮魂（00b §2.4）: 未練を持つ敵のHPが 30%以下 で鎮魂窓が開く → 鎮魂発動 → 約 1.5秒チャネル（気消費・主人公は無防備）→ 成功＝救済（穢 −10〜20）／討伐＝穢増（+5〜10）・契約不可・報酬減。
- 穢（けがれ）ゲージ（00b §2.3）: 0〜100。段階＝平常 0-39（なし）／軽い穢 40-69（気回復−25%）／重い穢 70-99（体・護−15%＋式神制御低下）／暴走 100（行動制限）。閾値 = 40 / 70 / 100。
- 縛（ばく・編成スロット）: v1は1枠固定（同時召喚1体）。複数枠はv2。
- v1使役式神: 玄（げん・烏天狗・木/風）のみ。風は演出/牽制で倍率非関与、五行上は「木」として計算。
- UI思想（デウス UIPanel）: 固定枠＋ページ送り。webスクロールバー厳禁。
- i-frame（回避・B1.2）: 距離2.5unit / 全体0.45s / 無敵 0.05〜0.28s / クールダウン 0.6s。
- 移動速度（A2-1 / B1.2）: `baseMoveSpeed = 4.0 unit/s`。`移動速度 = baseMoveSpeed × (1 + 速/200)`。
- 内部解像度: 1280×720（CSS等比フィット）。fog 藍墨 `#10131c`（near=12u / far=40u）。near/far = −1000 / 1000。
- アンカー: 全ビルボードは足元中心（下端中央）原点。

---

## File Structure

> 高凝集・小ファイル（200-400行目安）。純粋層は Three.js を import 禁止。

```
onmyoji-rpg/
├─ package.json                  … 依存・dev/build/test/screenshot スクリプト
├─ tsconfig.json                 … strict TS設定
├─ vite.config.ts                … base:'./' (GitHub Pages) ・dev/build設定
├─ index.html                    … #app マウント点・canvas ホスト
├─ playwright.config.ts          … headless Chromium スクショ設定
├─ src/
│   ├─ main.ts                   … エントリ。Game生成→start。DOM #app へ canvas/HUD 装着
│   ├─ game.ts                   … Game クラス。固定タイムステップ・update/render統括・currentScene管理
│   ├─ config.ts                 … 全定数（カメラ角・解像度・fog・移動速度・i-frame・閾値）= 数値の集約点
│   ├─ types.ts                  … 共有型（Element/Facing/Vec2/SceneState 等の横断型のみ）
│   ├─ engine/
│   │   ├─ renderer.ts           … WebGLRenderer/Scene/グループ(world/entity/fx/shadow)初期化・resize追従
│   │   ├─ camera.ts             … OrthographicCamera を yaw45/pitch30 固定生成・追従pan・ピクセルスナップ・境界クランプ
│   │   ├─ billboard.ts          … BillboardSprite クラス（板ポリ・facing差替・flipX・コマ送り・足元アンカー）
│   │   ├─ depth-sort.ts         … entityGroup を足元スクリーン深度で明示ソート・renderOrder付与（第二キー=id）
│   │   ├─ loop.ts               … 固定タイムステップ・accumulator・requestAnimationFrame ラッパ
│   │   ├─ input.ts              … キーボード入力マップ（WASD/矢印/Space/J/K/L/1/E/Q/鎮魂キー）→ InputState
│   │   └─ placeholder.ts        … プレースホルダーテクスチャ生成（単色/簡易ビルボード。fal.ai差し替え口）
│   ├─ world/
│   │   ├─ grid.ts               … グリッド地面メッシュ生成（XZ平面・寝かせ板）
│   │   ├─ collision.ts          … XZ平面 円vs矩形ブラックリスト衝突＋スライド＋マップ外チェック
│   │   └─ scene-test.ts         … 単一テストシーン定義（壁矩形・敵/玄/凪沙の初期配置）
│   ├─ combat/                   … ★純粋ロジック層（Three.js import 禁止・Vitest対象）
│   │   ├─ elements.ts           … 五行 Element 型・relation()・elemMul()
│   │   ├─ damage.ts             … computeDamage()（00b §2.2）・乱数注入可能
│   │   ├─ stats.ts              … Stats型・実効ステ算出・派生（移動速度/呪抵抗/攻撃後隙）
│   │   ├─ leveling.ts           … nextExp()・累計EXP・levelFromExp()・主人公成長テーブル
│   │   ├─ kegare.ts             … KegareGauge クラス（0-100・増減・段階デバフ閾値40/70/100）
│   │   └─ chinkon.ts            … 鎮魂窓判定（HP30%）・チャネル進行（1.5s）の純ロジック state machine
│   ├─ entities/
│   │   ├─ entity.ts             … Entity 基底（位置float/facing/Stats/hp/ki/BillboardSprite参照）
│   │   ├─ player.ts             … Player（凪沙）。入力→アクション状態・符/呪/回避/鎮魂発動
│   │   ├─ shikigami.ts          … Shikigami（玄）。召喚/帰還・意図駆動追従・攻撃
│   │   ├─ enemy.ts              … Enemy（鬼火童子）。AIステートマシン idle/chase/attack/hurt/down
│   │   └─ manager.ts            … EntityManager（登録/更新/破棄・深度ソート連携）
│   ├─ combat-runtime/
│   │   ├─ actions.ts            … 符/呪/玄攻撃/回避 の発生・XZ矩形/扇ヒット判定→damage適用→被弾/死亡
│   │   └─ hitbox.ts             … 矩形/扇ヒット判定の幾何（距離二乗・角度差。純関数）
│   └─ ui/
│       ├─ hud.ts                … HP/気バー描画（DOM/Canvas・UIPanel思想・スクロールバー無し）
│       └─ chinkon-prompt.ts     … 鎮魂プロンプトUI（窓表示・チャネルゲージ）
├─ src/assets/
│   └─ manifest.ts               … プレースホルダー資産マニフェスト（命名規則・fal.ai差し替え口注記）
├─ test/                          … Vitest（純粋ロジックのみ）
│   ├─ elements.test.ts
│   ├─ damage.test.ts
│   ├─ stats.test.ts
│   ├─ leveling.test.ts
│   ├─ kegare.test.ts
│   ├─ chinkon.test.ts
│   └─ hitbox.test.ts
└─ tools/
    └─ screenshot.mjs             … Playwright で dev サーバ起動シーンを撮影（検証ハーネス）
```

- `combat-runtime/` は純粋ロジック（`combat/`）を消費する実行時アクション層。`combat/` 自体は副作用なしを厳守し `combat-runtime/` から import される（逆は禁止）。

---

## Tasks

> 依存順: G1 → G2 → G3 → G4 ／ G5（純粋・並行可） → G6 → G7 → G8。各タスク群は別ファイルに分割している（`2026-06-17-phase0-tasks/G1.md` 〜 `G8.md`）。下記リンクから各群の bite-sized タスク（RED→GREEN→REFACTOR・頻繁コミット）を参照する。

- [ ] [G1: プロジェクト基盤・ビルド](./2026-06-17-phase0-tasks/G1.md) — `package.json`/`tsconfig.json`/`vite.config.ts`(base:`./`)/`index.html`/`src`雛形＋dev/build/test/screenshotスクリプト、Three.js r0.171.0 固定の lockfile、「画面が出る」スモーク。
- [ ] [G2: レンダリング基盤（アイソメ・カメラ・ループ）](./2026-06-17-phase0-tasks/G2.md) — `engine/renderer.ts`・`engine/camera.ts`(IsoCamera yaw45/pitch30固定)・`engine/loop.ts`(固定タイムステップ)・ピクセルスナップ・fog/環境光最小・resize追従。
- [ ] [G3: ビルボード・スプライト系＋深度](./2026-06-17-phase0-tasks/G3.md) — `engine/billboard.ts`(4facing/flipX/コマ送り/足元アンカー)・`engine/depth-sort.ts`・`engine/placeholder.ts`(単色/簡易テクスチャ)。
- [ ] [G4: 入力・移動・カメラ追従・衝突](./2026-06-17-phase0-tasks/G4.md) — `engine/input.ts`(InputState)・`world/collision.ts`(円vs矩形ブラックリスト＋スライド＋マップ外)・`world/grid.ts`・カメラのデッドゾーン追従＋境界クランプ・移動の正規化と4方向丸め。
- [ ] [G5: 戦闘ロジック（純粋・TDD）](./2026-06-17-phase0-tasks/G5.md) — `combat/elements.ts`・`combat/damage.ts`・`combat/stats.ts`・`combat/leveling.ts`・`combat/kegare.ts`・`combat/chinkon.ts`＋`test/*.test.ts`(Vitest・カバレッジ80%+)。【純粋ロジックのため G2〜G4 の描画群と並行着手可】
- [ ] [G6: エンティティ・式神・敵AI](./2026-06-17-phase0-tasks/G6.md) — `entities/entity.ts`・`player.ts`・`shikigami.ts`(玄・1枠追従)・`enemy.ts`(鬼火童子・AI)・`manager.ts`(登録/更新/破棄/深度ソート連携)。
- [ ] [G7: 戦闘アクション・判定・鎮魂・穢](./2026-06-17-phase0-tasks/G7.md) — `combat-runtime/hitbox.ts`・`combat-runtime/actions.ts`(符/呪/玄攻撃/回避i-frame)・鎮魂窓→1.5sチャネル→救済(穢−)/討伐(穢+)・穢段階デバフの戦闘反映。
- [ ] [G8: HUD・プレースホルダー資産・検証ハーネス](./2026-06-17-phase0-tasks/G8.md) — `ui/hud.ts`(HP/気バー・UIPanel固定枠)・`ui/chinkon-prompt.ts`・`assets/manifest.ts`(命名規則/fal.ai差し替え口)・`tools/screenshot.mjs`＋手動チェックリスト・プロト全体スモーク。

---

## 実行方法

1. サブエージェント駆動（推奨）: superpowers:subagent-driven-development でタスク群ごとに新規サブエージェントを起動し、タスク間でレビューしながら進める。
2. インライン実行: superpowers:executing-plans でこのセッション内にチェックポイントを挟みながらバッチ実行する。

## 担当分担（2026-06-17 確定）

**描画関係＝Codex／それ以外＝Claude**（デウス・コードの運用を踏襲）。

| 群 | 主担当 | 内訳 |
|---|---|---|
| G1 プロジェクト基盤 | **Claude** | 設定・雛形（非描画） |
| G2 レンダリング基盤 | **Codex** | renderer/camera/loop（描画） |
| G3 ビルボード・深度 | **Codex** | billboard/depth-sort/placeholder（描画） |
| G4 入力・移動・カメラ・衝突 | 混在 | 衝突算術・移動正規化・入力state=**Claude**／カメラ追従の見た目・ピクセルスナップ=**Codex** |
| G5 戦闘ロジック（純粋） | **Claude** | combat/* 全部（Vitest TDD・Three.js禁止） |
| G6 エンティティ・式神・敵AI | 混在 | AI/追従/takeDamage/管理の決定論ロジック（sprite:nullでVitest）=**Claude**／BillboardSprite配線・見た目=**Codex** |
| G7 戦闘アクション・鎮魂・穢 | 混在 | hitbox幾何・ダメージ適用・鎮魂/穢ロジック=**Claude**／アクションの見た目・エフェクト=**Codex** |
| G8 HUD・資産・検証ハーネス | **Codex** | HUD/プロンプト描画・スクショ検証（資産命名規則のみClaude可） |

着手順: G1(Claude) → 〔G5(Claude) ∥ G2・G3・G4描画(Codex)〕 → G6・G7(混在) → G8(Codex)。純粋ロジック層と描画層が契約で分離されているので並行可能。
