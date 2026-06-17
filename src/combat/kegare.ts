export type KegareStage = 'normal' | 'light' | 'heavy' | 'berserk';

// 段階閾値（00b §2.3 / 契約§3）。light=40 / heavy=70 / berserk=100。
export const KEGARE_THRESHOLDS = { light: 40, heavy: 70, berserk: 100 } as const;

const KI_RECOVERY_MUL_LIGHT = 0.75; // 軽い穢以上で気回復 ×0.75
const STAT_MUL_HEAVY = 0.85;        // 重い穢以上で体・護 ×0.85

function clamp(v: number): number {
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export class KegareGauge {
  private readonly _value: number;

  constructor(initial = 0) {
    this._value = clamp(initial);
  }

  get value(): number {
    return this._value;
  }

  get stage(): KegareStage {
    if (this._value >= KEGARE_THRESHOLDS.berserk) return 'berserk';
    if (this._value >= KEGARE_THRESHOLDS.heavy) return 'heavy';
    if (this._value >= KEGARE_THRESHOLDS.light) return 'light';
    return 'normal';
  }

  add(amount: number): KegareGauge {
    return new KegareGauge(this._value + amount);
  }

  sub(amount: number): KegareGauge {
    return new KegareGauge(this._value - amount);
  }

  // 気回復速度倍率。軽い穢(light)以上で 0.75。
  get kiRecoveryMul(): number {
    return this._value >= KEGARE_THRESHOLDS.light ? KI_RECOVERY_MUL_LIGHT : 1.0;
  }

  // 体・護ステ倍率。重い穢(heavy)以上で 0.85（effectiveStats と整合）。
  get statMul(): number {
    return this._value >= KEGARE_THRESHOLDS.heavy ? STAT_MUL_HEAVY : 1.0;
  }
}
