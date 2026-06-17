// ステータス（00b §2.1）。純粋ロジック・Three.js 非依存。

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

export interface StatModifier {
  hp?: number; ki?: number; tai?: number; go?: number;
  jutsuryoku?: number; spd?: number; critRate?: number; critMul?: number;
}

// 重い穢(70-99)・暴走(100)で体・護に掛ける倍率（00b §2.3 / 契約§3 kegare.statMul と整合）
const HEAVY_KEGARE_THRESHOLD = 70;
const HEAVY_STAT_MUL = 0.85;

// 素値(immutable) + 装備補正 + 穢デバフ から実効ステを算出（元を破壊せず新オブジェクトを返す）
export function effectiveStats(base: Stats, equip?: StatModifier, kegareLevel?: number): Stats {
  const e = equip ?? {};
  const out: Stats = {
    hp: base.hp + (e.hp ?? 0),
    ki: base.ki + (e.ki ?? 0),
    tai: base.tai + (e.tai ?? 0),
    go: base.go + (e.go ?? 0),
    jutsuryoku: base.jutsuryoku + (e.jutsuryoku ?? 0),
    spd: base.spd + (e.spd ?? 0),
    critRate: base.critRate + (e.critRate ?? 0),
    critMul: base.critMul + (e.critMul ?? 0),
  };
  if (kegareLevel !== undefined && kegareLevel >= HEAVY_KEGARE_THRESHOLD) {
    out.tai = Math.floor(out.tai * HEAVY_STAT_MUL);
    out.go = Math.floor(out.go * HEAVY_STAT_MUL);
  }
  return out;
}

// 移動速度 = base × (1 + 速/200)（baseMoveSpeed 既定 4.0 unit/s・契約§2）
export function moveSpeed(spd: number, baseMoveSpeed = 4.0): number {
  return baseMoveSpeed * (1 + spd / 200);
}

// 呪の攻撃後隙 = base × (1 - 速/300)
export function juAttackRecovery(spd: number, base: number): number {
  return base * (1 - spd / 300);
}

// 呪抵抗（派生）= floor(気/10) + equip
export function juResist(ki: number, equip = 0): number {
  return Math.floor(ki / 10) + equip;
}
