// module: combat-runtime/chinkon-flow | 鎮魂の穢変動・実行可否（純関数・副作用なし）
// 00b §2.4: 救済=穢 −10〜20（代表 −15）／討伐=穢 +5〜10（代表 +7）。気消費でチャネル発動。
import type { KegareGauge } from '../combat/kegare';
import { isChinkonWindowOpen } from '../combat/chinkon';

export const CHINKON_KI_COST = 20;
export const SOOTHE_KEGARE_DELTA = -15;
export const SUBJUGATE_KEGARE_DELTA = 7;

// 救済成功 → 穢を減らした新ゲージ（KegareGauge.add がクランプ＆immutable）
export function applySootheKegare(gauge: KegareGauge): KegareGauge {
  return gauge.add(SOOTHE_KEGARE_DELTA);
}

// 討伐（鎮魂せず倒した）→ 穢を増やした新ゲージ
export function applySubjugateKegare(gauge: KegareGauge): KegareGauge {
  return gauge.add(SUBJUGATE_KEGARE_DELTA);
}

// 鎮魂を開始できるか（窓が開く＝HP30%以下＋未練あり、かつ気がコスト以上）
export function canBeginChinkon(hp: number, maxHp: number, hasMiren: boolean, ki: number): boolean {
  return isChinkonWindowOpen(hp, maxHp, hasMiren) && ki >= CHINKON_KI_COST;
}
