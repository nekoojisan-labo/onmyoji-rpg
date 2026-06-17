import { describe, it, expect } from 'vitest';
import { computeDamage } from '../src/combat/damage';

// rng=0.5 → 乱数係数 0.95 + 0.5×0.10 = 1.00（中央値）
const mid = () => 0.5;
const low = () => 0.0;  // → 0.95
const high = () => 1 - 1e-9; // → ほぼ1.05

describe('computeDamage 00b §2.2', () => {
  it('正典例題: 体40, skillMul2.0, 護30, 属性有利1.25, 会心無, 乱数中央 → 76', () => {
    const dmg = computeDamage(40, {
      skillMul: 2.0,
      defenderGo: 30,
      attackerElement: 'wood',
      defenderElement: 'earth', // wood→earth = 1.25
      isMagic: false,
      critRate: 0,
      rng: mid,
    });
    expect(dmg).toBe(76);
  });

  it('属性指定なし（attackerElement/defenderElement省略）は elemMul=1.0', () => {
    // 40×2.0=80 → ×100/130=61.538 → ×1.0 → floor(×1.0)=61
    const dmg = computeDamage(40, { skillMul: 2.0, defenderGo: 30, rng: mid });
    expect(dmg).toBe(61);
  });

  it('isMagic=true は術力基礎（atkStatに術力を渡す前提・式は同一）', () => {
    // 術力50, skillMul1.4, 護20 → 70 → ×100/120=58.333 → ×1.0 → floor=58
    const dmg = computeDamage(50, {
      skillMul: 1.4, defenderGo: 20, isMagic: true, rng: mid,
    });
    expect(dmg).toBe(58);
  });

  it('会心ヒット時 critMul を乗算する（critRate=100で必中会心）', () => {
    // 40×2.0=80 → ×100/130=61.538 → ×1.0(無属性) → ×1.5(会心) → floor=92
    const dmg = computeDamage(40, {
      skillMul: 2.0, defenderGo: 30, critRate: 100, critMul: 1.5, rng: mid,
    });
    expect(dmg).toBe(92);
  });

  it('critRate=0 は会心しない（critMul未適用）', () => {
    const dmg = computeDamage(40, {
      skillMul: 2.0, defenderGo: 30, critRate: 0, critMul: 1.5, rng: mid,
    });
    expect(dmg).toBe(61);
  });

  it('乱数下限0.95・上限1.05でブレる（中央±）', () => {
    const base = computeDamage(40, { skillMul: 2.0, defenderGo: 30, rng: mid }); // 61
    const lo = computeDamage(40, { skillMul: 2.0, defenderGo: 30, rng: low });   // floor(61.538×0.95)
    const hi = computeDamage(40, { skillMul: 2.0, defenderGo: 30, rng: high });  // floor(61.538×1.05)
    expect(lo).toBe(Math.floor(61.53846153846154 * 0.95));
    expect(hi).toBe(Math.floor(61.53846153846154 * (0.95 + (1 - 1e-9) * 0.1)));
    expect(lo).toBeLessThanOrEqual(base);
    expect(hi).toBeGreaterThanOrEqual(base);
  });

  it('最低ダメージは1（floorで0以下でもmax(1)）', () => {
    // 体1, skillMul1.0, 護9999 → ほぼ0 → max(1)
    const dmg = computeDamage(1, { skillMul: 1.0, defenderGo: 9999, rng: low });
    expect(dmg).toBe(1);
  });

  it('結果は整数（floor適用）', () => {
    const dmg = computeDamage(37, { skillMul: 1.7, defenderGo: 23, rng: mid });
    expect(Number.isInteger(dmg)).toBe(true);
  });
});
