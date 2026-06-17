import type { Element } from '../types';
import { elemMul } from './elements';

export interface DamageOpts {
  skillMul: number;             // 符=1.0 / 呪=1.4..3.0
  defenderGo: number;           // 対象の護
  attackerElement?: Element;    // 属性技のみ
  defenderElement?: Element;
  isMagic?: boolean;            // true=術力基礎 / false=体基礎（atkStat はどちらも呼び出し側が渡す）
  critRate?: number;            // %。省略時0（会心なし）
  critMul?: number;             // 省略時1.0
  rng?: () => number;           // [0,1) 乱数注入（テスト決定化用）。省略時 Math.random
}

// 乱数係数の幅（00b §2.2: random(0.95, 1.05)）
const RAND_MIN = 0.95;
const RAND_SPAN = 0.1; // 1.05 - 0.95

// atkStat = isMagic ? 術力 : 体（呼び出し側が選んだ値を渡す）。00b §2.2 の式に厳密準拠。
export function computeDamage(atkStat: number, opts: DamageOpts): number {
  const rng = opts.rng ?? Math.random;

  const baseDamage = atkStat * opts.skillMul;                       // 物理基礎 or 呪術基礎
  const afterDefense = baseDamage * (100 / (100 + opts.defenderGo)); // 防御後

  const mul =
    opts.attackerElement && opts.defenderElement
      ? elemMul(opts.attackerElement, opts.defenderElement)
      : 1.0;
  const afterElement = afterDefense * mul;                          // 属性後

  const critRate = opts.critRate ?? 0;
  const critMul = opts.critMul ?? 1.0;
  const isCrit = rng() * 100 < critRate;                            // 会心率=CRT%
  const afterCrit = afterElement * (isCrit ? critMul : 1.0);        // 会心後

  const randFactor = RAND_MIN + rng() * RAND_SPAN;                 // random(0.95, 1.05)
  return Math.max(1, Math.floor(afterCrit * randFactor));          // 最終（整数・最低1）
}
