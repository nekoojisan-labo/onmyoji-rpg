// エントリ。G1 スモーク段階では Three.js シーンを #app に描く最小実装（G1.6 で確定）。
// G2 以降で Game クラス（game.ts）へ差し替える。
import { mountSmokeScene } from './engine/smoke';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app マウント点が見つかりません（index.html を確認）');
}
mountSmokeScene(app);
