<!-- module: Phase0 共有契約 (Shared Contract) | onmyoji-rpg | generated 2026-06-17 | STATUS: canon for Phase0 impl -->

# Phase0 技術プロト ─ 共有契約（唯一の正典 / Shared Contract）

> 本書は Phase0 技術プロトを bite-sized TDD タスクに展開する**全エージェントが従う唯一の正典**である。
> 型・命名・ファイルパス・シグネチャはここに書かれた通り**逐語使用**すること。本書と食い違う実装は本書に合わせて修正する。
> 上位権威: `00-README.md` §5 ＞ `00b-data-master.md` ＞ 本書（Phase0スコープに限る）。数値が本書と 00b で食い違う場合は 00b を正とし本書を修正する。

---

## 1. Goal / Architecture / Tech Stack

### 1.1 Goal（1文）
Vite+TypeScript+Three.js の単一テストシーンで、オルソ・アイソメ（仰角30°/yaw45°）カメラの下、2Dビルボードの主人公「凪沙」をWASD移動させ、召喚式神「玄」が追従し、敵「鬼火童子」とリアルタイム戦闘（符・呪・玄の攻撃・回避i-frame・鎮魂・穢）を成立させる、面白さ検証前の**最小の技術的確認**を作る。

### 1.2 Architecture（2-3文）
副作用のない**純粋ロジック層**（`src/combat/*`：五行・ダメージ・ステ・穢・レベル）と、Three.js に依存する**描画/手触り層**（`src/engine/*`・`src/entities/*`・`src/world/*`・`src/ui/*`）を厳格に分離する。純粋層は Vitest で TDD し描画層から import されるが逆依存しない。アプリは固定タイムステップの更新ループ（`Game`）が `World`（エンティティ管理）と `Renderer`（Three.js）を駆動し、入力→ロジック更新→描画の一方向データフローで動く。

### 1.3 Tech Stack
| 項目 | 確定 |
|---|---|
| ビルド | **Vite 6.x**（`^6.0.0`） |
| 言語 | **TypeScript 5.x**（`^5.6.0`・`strict: true`） |
| 3D | **Three.js r0.171.0**（`three@^0.171.0` + `@types/three@^0.171.0`）※バージョン固定。range更新で API drift しないよう lockfile を必ずコミット |
| テスト | **Vitest 2.x**（`^2.1.0`・環境 `node`。純粋ロジック専用） |
| 検証(描画) | **Playwright 1.x**（`^1.49.0`・headless Chromium スクリーンショット）＋手動チェックリスト |
| パッケージ管理 | npm（lockfile = `package-lock.json` を必ずコミット） |
| 配信 | GitHub Pages（`vite.config.ts` の `base` を相対 `./` に設定） |
| 作業場所 | `~/projects/onmyoji-rpg/`（**非iCloud**・git破壊回避） |

---

## 2. Global Constraints（00-README / 00b から逐語コピー）

以下は変更不可。全タスクが前提として共有する。

- **規模**: 1人用ブラウザゲーム。サーバー/通信/マルチプレイ無し。
- **エンジン**: Three.js（2.5D/3D）。
- **視点**: アイソメトリック。**オルソ（平行投影）カメラを斜め固定**。深度は z で自動ソート。
- **カメラ角**: **方位角 yaw = 45°**（クラシックアイソメ）／**仰角 pitch = 30°固定**（確定・裁定。35.264°は撤回）。カメラは回転しない＝ターゲットを中点に平行移動のみ。
- **描画**: フル2.5Dビルボード（2D画像を板ポリ＝`PlaneGeometry`に貼り3D空間に立てる）。板は回さず固定回転Mesh。常時 `lookAt` は呼ばない。
- **facing 方向数**: **4方向で確定**（`down`/`left`/`right`/`up`）。**右＝左の水平反転（flipX＝`scale.x` 反転 or UV反転）**で表現し別テクスチャを持たない。8方向・斜め4方向は撤回。
- **移動入力**: WASD/矢印。**4方向入力＋斜め同時押し許容**で正規化（斜めが速くならない）。`facing` は4方向へ丸める。ワールド座標は **float 保持**、**描画時のみ整数（内部解像度ピクセル）へスナップ**。
- **戦闘**: リアルタイム/アクション。`battle` は `field` 内のサブ状態（マップ遷移を伴わない）。
- **主人公の手段（式神オンリー・直接近接で殴らない）**: **符（ふだ・遠隔の基本攻撃・skillMul=1.0・気消費なし）＋呪（じゅ・詠唱スキル・気消費・術力依存・個別CD）＋式神の召喚/切替/指揮＋鎮魂**のみ。
- **対象プラットフォーム**: **v1はPC（デスクトップChrome）専用**。モバイルはv2。
- **ボイス**: **v1はボイス無し**（BGM/SEのみ）。
- **通貨**: **文（もん）**（Phase0では未使用だが語彙固定。旧「銭/zeni」は全廃）。
- **MP相当**: **気（き）**に一本化（旧「呪力/MP/JURYOKU」は全廃）。
- **ステータス列（正典8項目・00b §2.1）**: `HP` / `気(ki)` / `体(tai)` / `護(go)` / `術力(jutsuryoku)` / `速(spd)` / `CRT率(critRate %)` / `critMul(会心倍率)`。HIT/EVA は廃止（命中100%固定・手動i-frameのみ）。
- **五行（00b §3）**: 相生（与ダメ減・不利方向）`木→火→土→金→水→木` = **×0.85**／相克（攻撃側有利）`木→土→水→火→金→木` = **×1.25**／無関係・同属性 = **×1.00**。
- **ダメージ式（00b §2.2）**: `物理基礎=体×skillMul`／`呪術基礎=術力×skillMul`／`防御後=基礎×(100/(100+護))`／`属性後=防御後×elemMul`／`会心後=属性後×(会心ならcritMul else 1.0)`／`最終=max(1, floor(会心後×random(0.95,1.05)))`。符 skillMul=1.0、呪術 1.4〜3.0。
- **鎮魂（00b §2.4）**: 未練を持つ敵のHPが **30%以下** で鎮魂窓が開く → 鎮魂発動 → 約 **1.5秒チャネル**（気消費・主人公は無防備）→ 成功＝救済（穢 −10〜20）／討伐＝穢増（+5〜10）・契約不可・報酬減。
- **穢（けがれ）ゲージ（00b §2.3）**: 0〜100。段階＝**平常 0-39（なし）／軽い穢 40-69（気回復−25%）／重い穢 70-99（体・護−15%＋式神制御低下）／暴走 100（行動制限）**。閾値 = 40 / 70 / 100。
- **縛（ばく・編成スロット）**: **v1は1枠固定**（同時召喚1体）。複数枠はv2。
- **v1使役式神**: **玄（げん・烏天狗・木/風）のみ**。風は演出/牽制で倍率非関与、五行上は「木」として計算。
- **UI思想（デウス UIPanel）**: 固定枠＋ページ送り。**webスクロールバー厳禁**。
- **i-frame（回避・B1.2）**: 距離2.5unit / 全体0.45s / 無敵 0.05〜0.28s / クールダウン 0.6s。
- **移動速度（A2-1 / B1.2）**: `baseMoveSpeed = 4.0 unit/s`。`移動速度 = baseMoveSpeed × (1 + 速/200)`。
- **内部解像度**: 1280×720（CSS等比フィット）。fog 藍墨 `#10131c`（near=12u / far=40u）。near/far = −1000 / 1000。
- **アンカー**: 全ビルボードは足元中心（下端中央）原点。

---

## 3. File Structure（src/配下 全ファイル・各1責務）

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

- `combat-runtime/` は純粋ロジック（`combat/`）を消費する**実行時アクション層**。`combat/` 自体は副作用なしを厳守し `combat-runtime/` から import される（逆は禁止）。

---

## 4. Interface Contract（主要 export・後続タスクの正典・逐語使用）

> シグネチャはこの通りに実装する。型名・引数名・戻り値を変えないこと。

### 4.1 `src/types.ts`
```typescript
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type Facing = 'down' | 'left' | 'right' | 'up';
export type SceneState = 'title' | 'field' | 'battle' | 'menu' | 'event' | 'gameover';
export interface Vec2 { x: number; z: number; }            // XZ平面（地表）座標。yは描画専用で判定に使わない
export interface Rect { x: number; z: number; w: number; h: number; } // 中心(x,z)・幅w・奥行h
```

### 4.2 `src/combat/elements.ts`（純）
```typescript
import type { Element } from '../types';
// 相生(攻撃属性が防御属性を「生む」=不利方向)なら 0.85、相克(攻撃属性が防御属性に「克つ」)なら 1.25、それ以外 1.00
export function relation(attacker: Element, defender: Element): number;
// relation の別名（呼び出し側の意図明示用）。同値を返す
export function elemMul(attacker: Element, defender: Element): number;
// 相克マトリクス（行=攻撃, 列=防御, 順序 wood,fire,earth,metal,water）。テスト用に公開
export const ELEMENT_MATRIX: Readonly<Record<Element, Readonly<Record<Element, number>>>>;
```
相克（×1.25）の組: wood→earth, fire→metal, earth→water, metal→wood, water→fire。
相生（×0.85）の組: wood→fire, fire→earth, earth→metal, metal→water, water→wood。

### 4.3 `src/combat/stats.ts`（純）
```typescript
import type { Element } from '../types';
export interface Stats {
  hp: number;        // 最大HP
  ki: number;        // 気（最大値。行動資源）
  tai: number;       // 体（物理）
  go: number;        // 護（防御）
  jutsuryoku: number;// 術力（呪術）
  spd: number;       // 速
  critRate: number;  // CRT率（%・0..100）
  critMul: number;   // 会心倍率（例 1.5）
}
export interface StatModifier { hp?: number; ki?: number; tai?: number; go?: number;
  jutsuryoku?: number; spd?: number; critRate?: number; critMul?: number; }
// 素値(immutable) + 装備補正 + 穢デバフ から実効ステを算出（元を破壊せず新オブジェクトを返す）
export function effectiveStats(base: Stats, equip?: StatModifier, kegareLevel?: number): Stats;
export function moveSpeed(spd: number, baseMoveSpeed?: number): number;   // base × (1 + spd/200)
export function juAttackRecovery(spd: number, base: number): number;      // base × (1 - spd/300)
export function juResist(ki: number, equip?: number): number;             // floor(ki/10) + equip
```
`kegareLevel`（穢段階の数値0-100）に応じ effectiveStats は重い穢(70-99)で体・護 ×0.85 を適用する。

### 4.4 `src/combat/damage.ts`（純）
```typescript
import type { Element } from '../types';
export interface DamageOpts {
  skillMul: number;             // 符=1.0 / 呪=1.4..3.0
  defenderGo: number;           // 対象の護
  attackerElement?: Element;    // 属性技のみ
  defenderElement?: Element;
  isMagic?: boolean;            // true=術力基礎 / false=体基礎
  critRate?: number;            // %。省略時0（会心なし）
  critMul?: number;             // 省略時1.0
  rng?: () => number;           // [0,1) 乱数注入（テスト決定化用）。省略時 Math.random
}
// atkStat = isMagic ? 術力 : 体。00b §2.2 の式に厳密準拠。最終ダメージ(整数・最低1)を返す
export function computeDamage(atkStat: number, opts: DamageOpts): number;
```

### 4.5 `src/combat/leveling.ts`（純）
```typescript
export function nextExp(level: number): number;          // floor(50 × L^1.5 + 20 × L)
export function totalExpToReach(level: number): number;  // Σ nextExp(1..level-1)
export function levelFromExp(totalExp: number): number;  // 累計EXPから到達レベル
export function playerStatsAtLevel(level: number): import('./stats').Stats; // 主人公成長テーブル(B2.3)
```

### 4.6 `src/combat/kegare.ts`（純・小クラス）
```typescript
export type KegareStage = 'normal' | 'light' | 'heavy' | 'berserk';
export class KegareGauge {
  constructor(initial?: number);     // 既定0。0..100 にクランプ
  get value(): number;
  get stage(): KegareStage;          // 0-39 normal / 40-69 light / 70-99 heavy / 100 berserk
  add(amount: number): KegareGauge;  // immutable: 新インスタンスを返しクランプ
  sub(amount: number): KegareGauge;  // immutable
  // 段階デバフ係数（effectiveStats が参照）
  get kiRecoveryMul(): number;       // light以上 0.75 / それ以外 1.0
  get statMul(): number;             // heavy以上 0.85 / それ以外 1.0
}
export const KEGARE_THRESHOLDS: { light: 40; heavy: 70; berserk: 100 };
```

### 4.7 `src/combat/chinkon.ts`（純・state machine）
```typescript
export type ChinkonPhase = 'closed' | 'open' | 'channeling' | 'succeeded' | 'cancelled';
export const CHINKON_HP_RATIO = 0.30;       // HP30%以下で窓が開く
export const CHINKON_CHANNEL_SEC = 1.5;     // チャネル時間
// 未練持ち敵に対し窓が開くか
export function isChinkonWindowOpen(hp: number, maxHp: number, hasMiren: boolean): boolean;
export class ChinkonState {
  constructor();
  get phase(): ChinkonPhase;
  get progress(): number;                   // 0..1（channeling中のチャネル進捗）
  open(): ChinkonState;                      // closed→open（窓成立時）
  beginChannel(): ChinkonState;              // open→channeling
  tick(dt: number): ChinkonState;            // channeling中 progress加算。1.0到達でsucceeded
  cancel(): ChinkonState;                    // 被弾/離脱でchannelingを中断→cancelled
}
```

### 4.8 `src/combat-runtime/hitbox.ts`（純）
```typescript
import type { Vec2 } from '../types';
// 距離二乗で円内判定
export function circleHit(center: Vec2, radius: number, target: Vec2, targetRadius: number): boolean;
// 扇形判定（origin発・facingDir方向・半径range・中心角arcDeg）
export function fanHit(origin: Vec2, facingDir: Vec2, range: number, arcDeg: number,
  target: Vec2, targetRadius: number): boolean;
// 矩形(中心・幅奥行)内判定
export function rectHit(rect: import('../types').Rect, target: Vec2, targetRadius: number): boolean;
```

### 4.9 `src/engine/camera.ts`
```typescript
import * as THREE from 'three';
export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  constructor(viewWorldWidth: number, aspect: number); // yaw45/pitch30固定で生成
  follow(targetX: number, targetZ: number): void;       // デッドゾーン付きlerp追従
  clampToBounds(bounds: import('../types').Rect): void;  // マップ境界クランプ
  applyPixelSnap(internalWidth: number, internalHeight: number): void; // 描画前ピクセルスナップ
  resize(aspect: number): void;
}
```

### 4.10 `src/engine/billboard.ts`
```typescript
import * as THREE from 'three';
import type { Facing } from '../types';
export interface BillboardOptions {
  texture: THREE.Texture;
  worldSize: { w: number; h: number };   // 板サイズ（unit）。既定 1×1.8
  blend?: 'normal' | 'add';
}
export class BillboardSprite {
  readonly id: number;                    // 生成順固定ID（深度ソート第二キー）
  readonly mesh: THREE.Mesh;              // 足元アンカー（下端中央）の固定回転Mesh
  constructor(opts: BillboardOptions);
  setPosition(x: number, z: number, y?: number): void;  // ワールド配置（足元）
  setFacing(facing: Facing): void;        // right は left の flipX（scale.x反転）で表現
  setFrame(frame: number): void;          // コマ送り（UVオフセット）
  footScreenDepth(camera: THREE.Camera): number; // 深度ソート用スクリーン深度
  dispose(): void;
}
```

### 4.11 `src/engine/input.ts`
```typescript
export interface InputState {
  moveX: number; moveZ: number;   // 正規化済み移動ベクトル（斜めでも長さ≤1）
  fuda: boolean;                  // J（符・edge）
  ju1: boolean; ju2: boolean;     // K/L（呪・edge）
  dodge: boolean;                 // Space（回避・edge）
  summon: boolean;                // 1（玄召喚/帰還・edge）
  switchShiki: boolean;           // E（切替・edge。v1実質無効）
  item: boolean;                  // Q（道具・edge）
  chinkon: boolean;               // 鎮魂キー（窓中・edge）
}
export class Input {
  constructor(target?: HTMLElement | Window);
  sample(): InputState;           // 当フレームの状態を返し edge をリセット
  dispose(): void;
}
```

### 4.12 `src/entities/entity.ts`
```typescript
import type { Facing, Element } from '../types';
import type { Stats } from '../combat/stats';
import type { BillboardSprite } from '../engine/billboard';
export abstract class Entity {
  readonly id: number;
  x: number; z: number;              // ワールド座標（float保持）
  facing: Facing;
  element: Element;
  hp: number; maxHp: number;
  baseStats: Stats;                  // immutable素値
  sprite: BillboardSprite | null;
  radius: number;                    // XZ円衝突半径
  alive: boolean;
  constructor(init: { x: number; z: number; element: Element; baseStats: Stats; radius?: number });
  abstract update(dt: number, ctx: import('./manager').UpdateContext): void;
  takeDamage(amount: number): void;  // hp減算・alive更新
  syncSprite(): void;                // x/z/facing/frame をBillboardSpriteへ反映
}
```

### 4.13 `src/entities/player.ts`
```typescript
import { Entity } from './entity';
export type PlayerAction = 'idle' | 'move' | 'fuda' | 'cast' | 'summon' | 'chinkon' | 'dodge' | 'hit' | 'down';
export class Player extends Entity {
  ki: number; maxKi: number;
  action: PlayerAction;
  iFrameUntilMs: number;
  level: number; exp: number;
  kegare: import('../combat/kegare').KegareGauge;
  update(dt: number, ctx: import('./manager').UpdateContext): void;
  isInvincible(nowMs: number): boolean;
}
```

### 4.14 `src/entities/shikigami.ts`
```typescript
import { Entity } from './entity';
export type ShikiAiIntent = 'follow' | 'attack' | 'regroup';
export class Shikigami extends Entity {
  readonly shikiId: 'gen';           // v1は玄のみ
  summoned: boolean;
  intent: ShikiAiIntent;
  summon(): void;                    // 召喚（気消費はPlayer側で処理）
  recall(): void;                    // 帰還
  update(dt: number, ctx: import('./manager').UpdateContext): void; // 意図駆動追従＋攻撃
}
```

### 4.15 `src/entities/enemy.ts`
```typescript
import { Entity } from './entity';
export type EnemyAiState = 'idle' | 'alert' | 'chase' | 'attack' | 'recover' | 'hurt' | 'down';
export class Enemy extends Entity {
  readonly kind: 'onibidoji';        // 鬼火童子（火）
  aiState: EnemyAiState;
  hasMiren: boolean;                 // 鎮魂対象か
  sightRange: number; senseRange: number;
  leashOrigin: { x: number; z: number };
  update(dt: number, ctx: import('./manager').UpdateContext): void; // ステートマシン
  chinkonWindowOpen(): boolean;      // HP30%以下 && hasMiren
}
```

### 4.16 `src/entities/manager.ts`
```typescript
import type { Entity } from './entity';
import type { Player } from './player';
export interface UpdateContext {
  player: Player;
  entities: readonly Entity[];
  nowMs: number;
  collide: (x: number, z: number, radius: number) => { x: number; z: number }; // 衝突解決後座標
}
export class EntityManager {
  add(e: Entity): void;
  remove(id: number): void;
  get entities(): readonly Entity[];
  update(dt: number, ctx: UpdateContext): void;  // 全エンティティtick
  sortForRender(camera: import('three').Camera): void; // 深度ソート→renderOrder付与
  dispose(): void;
}
```

### 4.17 `src/combat-runtime/actions.ts`
```typescript
import type { Entity } from '../entities/entity';
import type { Player } from '../entities/player';
export interface ActionResult { hits: { target: Entity; damage: number }[]; }
// 符（前方扇・気消費なし・skillMul=1.0）
export function castFuda(player: Player, enemies: readonly Entity[]): ActionResult;
// 呪（前方扇/円・気消費・術力依存・CD。skillMul/kiCost指定）
export function castJu(player: Player, enemies: readonly Entity[],
  opts: { skillMul: number; kiCost: number; arcDeg: number; range: number }): ActionResult;
// 玄の攻撃（疾風斬・木）
export function castGenAttack(gen: import('../entities/shikigami').Shikigami,
  enemies: readonly Entity[]): ActionResult;
```

### 4.18 `src/ui/hud.ts` / `src/ui/chinkon-prompt.ts`
```typescript
// hud.ts
export class Hud {
  constructor(mount: HTMLElement);
  setHp(cur: number, max: number): void;
  setKi(cur: number, max: number): void;
  setKegare(value: number): void;     // 0..100
  dispose(): void;
}
// chinkon-prompt.ts
export class ChinkonPrompt {
  constructor(mount: HTMLElement);
  show(): void;                       // 鎮魂窓表示
  hide(): void;
  setProgress(p: number): void;       // 0..1 チャネルゲージ
}
```

### 4.19 `src/engine/loop.ts` / `src/game.ts`
```typescript
// loop.ts
export const FIXED_DT = 1 / 60;        // 固定タイムステップ秒
export class GameLoop {
  constructor(update: (dt: number) => void, render: (alpha: number) => void);
  start(): void;
  stop(): void;
}
// game.ts
export class Game {
  constructor(mount: HTMLElement);
  scene: import('./types').SceneState;
  start(): void;
  dispose(): void;
}
```

### 4.20 `src/assets/manifest.ts`
```typescript
// プレースホルダー資産マニフェスト。命名規則は C6 §4.1 準拠:
//   <category>_<id>_<variant>_<dir>_<action>_<frame>@<scale>.png
// Phase0 は単色/簡易ビルボードをコード生成（engine/placeholder.ts）。実画像差し替え口=fal.ai Nano Banana(image-to-image)。
export interface PlaceholderDef {
  id: string;            // pc_nagisa / sk_gen / en_onibidoji
  color: number;         // 単色プレースホルダー色（0xRRGGBB）
  worldSize: { w: number; h: number };
}
export const PLACEHOLDERS: Record<'pc_nagisa' | 'sk_gen' | 'en_onibidoji', PlaceholderDef>;
```

---

## 5. Test Strategy

### 5.1 純粋ロジック = Vitest 単体 TDD（RED→GREEN→REFACTOR）
`src/combat/*` と `src/combat-runtime/hitbox.ts` は Three.js を import せず、Vitest（`environment: node`）で TDD する。理由＝決定的で副作用がなく、機械検証できるため。
- `elements.test.ts`: 相生×0.85・相克×1.25・無関係×1.0 を全25組で検証（相克5組・相生5組・残り×1.0）。
- `damage.test.ts`: 00b §2.2 の例（体40, skillMul2.0, 護30, 属性1.25, 会心無）が **76** になること（`rng`固定で中央値）。最低1保証・floor・isMagic分岐・会心分岐。
- `stats.test.ts`: effectiveStats が素値を破壊しない（immutable）・装備合算・重い穢で体護×0.85・派生（moveSpeed/juResist/recovery）。
- `leveling.test.ts`: nextExp(1)=70・累計・levelFromExp の往復・成長テーブル一致。
- `kegare.test.ts`: 段階閾値40/70/100・クランプ0..100・add/sub immutable・kiRecoveryMul/statMul。
- `chinkon.test.ts`: HP30%窓判定・チャネル1.5s到達でsucceeded・被弾cancel・hasMiren=false で開かない。
- `hitbox.test.ts`: 円/扇/矩形の境界（距離二乗・角度差）。
- **カバレッジ目標 80%+**（純粋層）。

### 5.2 描画/手触り = headless Chrome スクショ or 手動チェックリスト
カメラ角・ビルボード正対・移動・AI・戦闘の見た目は数値で表現しづらく、Vitest では検証コストが高い（WebGLコンテキスト・視覚判断が必要）。よって **Playwright headless Chromium のスクリーンショット（`tools/screenshot.mjs` / デウスの render harness 流儀）＋手動チェックリスト**で検証する。
- スクショ検証: dev サーバ起動 → テストシーンを既定状態・移動後・戦闘中の数フレームで撮影し、目視/差分で破綻（z逆転・滲み・正対崩れ）を確認。
- 手動チェックリスト（G8 が成果物として提供。各項目 pass/fail）:
  1. カメラがオルソ・平行投影で yaw45/pitch30 に見える（タイルが菱形・透視ゆがみ無し）。
  2. グリッド地面が表示される。
  3. ビルボードが板を回さずカメラへ正対し、奥行きで縮まない。
  4. WASD で4方向移動し、斜め同時押しが速くならず、facing が4方向に丸まる（右=左反転）。
  5. z深度で前後関係が1フレームも逆転しない（密集チラつき無し）。
  6. 玄が意図駆動で追従し「ふわふわ横滑り」しない。
  7. 鬼火童子が idle/索敵/接近/攻撃で動き、予兆が出る。
  8. 符/呪/玄攻撃/回避(i-frame)が入力で機能し、被弾がi-frame中スキップされる。
  9. HP/気バーが減り、ダメージが五行相性込みで反映される。
  10. 敵HP30%以下で鎮魂窓→約1.5sチャネルで救済（穢−）、討伐で穢+。
  11. 穢ゲージが0-100で増減し段階デバフが効く。
  12. プレースホルダーアートが表示される（差し替え口が用意されている）。
- 描画時のピクセルスナップ・サブピクセル滲みはスクショ拡大で確認。

---

## 6. Task Groups（依存順序・各群の成果物）

> 依存順: G1 → G2 → G3 → G4 ／ G5（純粋・並行可） → G6 → G7 → G8。G5は他描画群と並行着手可（純粋層のため）。

| 群 | 名称 | 依存 | 成果物（1行） |
|---|---|---|---|
| **G1** | プロジェクト基盤・ビルド | なし | `package.json`/`tsconfig.json`/`vite.config.ts`（base:`./`）/`index.html`/`src`雛形＋dev/build/test/screenshotスクリプト、Three.js r0.171.0 固定の lockfile、「画面が出る」スモーク。 |
| **G2** | レンダリング基盤（アイソメ・カメラ・ループ） | G1 | `engine/renderer.ts`・`engine/camera.ts`（IsoCamera yaw45/pitch30固定）・`engine/loop.ts`（固定タイムステップ）・ピクセルスナップ・fog/環境光最小・resize追従。 |
| **G3** | ビルボード・スプライト系＋深度 | G2 | `engine/billboard.ts`（4facing/flipX/コマ送り/足元アンカー）・`engine/depth-sort.ts`・`engine/placeholder.ts`（単色/簡易テクスチャ）。 |
| **G4** | 入力・移動・カメラ追従・衝突 | G3 | `engine/input.ts`（InputState）・`world/collision.ts`（円vs矩形ブラックリスト＋スライド＋マップ外）・`world/grid.ts`・カメラのデッドゾーン追従＋境界クランプ・移動の正規化と4方向丸め。 |
| **G5** | 戦闘ロジック（純粋・TDD） | G1（型のみ） | `combat/elements.ts`・`combat/damage.ts`・`combat/stats.ts`・`combat/leveling.ts`・`combat/kegare.ts`・`combat/chinkon.ts`＋`test/*.test.ts`（Vitest・カバレッジ80%+）。 |
| **G6** | エンティティ・式神・敵AI | G3,G4,G5 | `entities/entity.ts`・`player.ts`・`shikigami.ts`（玄・1枠追従）・`enemy.ts`（鬼火童子・AI）・`manager.ts`（登録/更新/破棄/深度ソート連携）。 |
| **G7** | 戦闘アクション・判定・鎮魂・穢 | G6,G5 | `combat-runtime/hitbox.ts`・`combat-runtime/actions.ts`（符/呪/玄攻撃/回避i-frame）・鎮魂窓→1.5sチャネル→救済(穢−)/討伐(穢+)・穢段階デバフの戦闘反映。 |
| **G8** | HUD・プレースホルダー資産・検証ハーネス | G2-G7 | `ui/hud.ts`（HP/気バー・UIPanel固定枠）・`ui/chinkon-prompt.ts`・`assets/manifest.ts`（命名規則/fal.ai差し替え口）・`tools/screenshot.mjs`＋手動チェックリスト・プロト全体スモーク。 |

---

## 7. Phase0 スコープ外（後続planで扱う）
第1章の町/フィールド/ダンジョン/ショップ/クエスト/会話/ゾーン遷移/フルセーブ・インベントリ・複数式神・装備・アイテム経済・ボス（喰い鬼/泥眼の女）は Phase0 スコープ外。localStorage セーブは Phase0 では最小（シーン状態のみ）で可。fal.ai 生成アートは任意の差し替え口として用意し、Phase0 はコード生成プレースホルダーで成立させる。

---

*Phase0 共有契約 / 00 §5・00b 準拠。後続8タスク群はこの契約の型・命名・パス・シグネチャを逐語使用すること。*
