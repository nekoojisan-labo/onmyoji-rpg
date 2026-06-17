import type { Stats } from './stats';

const MIN_LEVEL = 1;
const MAX_LEVEL = 20;

// 主人公成長テーブル（00b B2.3 正典アンカー）。HP/気/体/護/速/術力。
// critRate=5・critMul=1.5 は全レベル固定（00b §2.1 / B2.3）。
interface GrowthRow {
  level: number; hp: number; ki: number; tai: number; go: number; spd: number; jutsuryoku: number;
}
const GROWTH: readonly GrowthRow[] = [
  { level: 1,  hp: 80,  ki: 60,  tai: 12,  go: 8,  spd: 10, jutsuryoku: 10 },
  { level: 2,  hp: 92,  ki: 66,  tai: 15,  go: 10, spd: 11, jutsuryoku: 12 },
  { level: 3,  hp: 104, ki: 72,  tai: 18,  go: 12, spd: 12, jutsuryoku: 14 },
  { level: 5,  hp: 130, ki: 86,  tai: 26,  go: 17, spd: 14, jutsuryoku: 19 },
  { level: 8,  hp: 172, ki: 110, tai: 40,  go: 26, spd: 17, jutsuryoku: 28 },
  { level: 10, hp: 200, ki: 128, tai: 50,  go: 32, spd: 19, jutsuryoku: 34 },
  { level: 15, hp: 275, ki: 175, tai: 76,  go: 48, spd: 24, jutsuryoku: 50 },
  { level: 20, hp: 350, ki: 224, tai: 104, go: 65, spd: 29, jutsuryoku: 67 },
];
const CRIT_RATE = 5;
const CRIT_MUL = 1.5;

// 次レベルまで必要EXP = floor(50 × L^1.5 + 20 × L)
export function nextExp(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5) + 20 * level);
}

// 当該レベル到達までの累計EXP = Σ nextExp(1..level-1)
export function totalExpToReach(level: number): number {
  let sum = 0;
  for (let L = 1; L < level; L++) {
    sum += nextExp(L);
  }
  return sum;
}

// 累計EXPから到達レベル（最低Lv1）
export function levelFromExp(totalExp: number): number {
  if (totalExp <= 0) return MIN_LEVEL;
  let level = MIN_LEVEL;
  while (totalExpToReach(level + 1) <= totalExp) {
    level++;
  }
  return level;
}

// 線形補間（floor）で2行間のステ値を求める
function lerpStat(lo: GrowthRow, hi: GrowthRow, level: number, key: keyof GrowthRow): number {
  if (lo.level === hi.level) return lo[key];
  const t = (level - lo.level) / (hi.level - lo.level);
  return Math.floor(lo[key] + (hi[key] - lo[key]) * t);
}

// 主人公成長テーブル(B2.3)。テーブル外は線形補間、範囲外はクランプ。
export function playerStatsAtLevel(level: number): Stats {
  const L = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.floor(level)));
  // GROWTH は非空の固定テーブルなので添字は常に有効（noUncheckedIndexedAccess 対応で非null断定）
  let lo: GrowthRow = GROWTH[0]!;
  let hi: GrowthRow = GROWTH[GROWTH.length - 1]!;
  for (let i = 0; i < GROWTH.length; i++) {
    const row = GROWTH[i]!;
    if (row.level <= L) lo = row;
    if (row.level >= L) {
      hi = row;
      break;
    }
  }
  return {
    hp: lerpStat(lo, hi, L, 'hp'),
    ki: lerpStat(lo, hi, L, 'ki'),
    tai: lerpStat(lo, hi, L, 'tai'),
    go: lerpStat(lo, hi, L, 'go'),
    jutsuryoku: lerpStat(lo, hi, L, 'jutsuryoku'),
    spd: lerpStat(lo, hi, L, 'spd'),
    critRate: CRIT_RATE,
    critMul: CRIT_MUL,
  };
}
