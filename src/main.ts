// エントリ。G2 スモークとして IsoCamera + Renderer + GameLoop でアイソメ床を表示する。
import { mountSmokeScene } from './engine/smoke';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app マウント点が見つかりません（index.html を確認）');
}
mountSmokeScene(app);
