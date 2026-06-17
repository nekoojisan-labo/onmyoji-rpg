import { describe, it, expect } from 'vitest';
import {
  effectiveStats,
  moveSpeed,
  juAttackRecovery,
  juResist,
  type Stats,
  type StatModifier,
} from '../src/combat/stats';

const BASE: Stats = {
  hp: 130, ki: 86, tai: 26, go: 17, jutsuryoku: 19, spd: 14, critRate: 5, critMul: 1.5,
};

describe('effectiveStats', () => {
  it('装備も穢も無ければ素値の複製を返す（値一致）', () => {
    const eff = effectiveStats(BASE);
    expect(eff).toEqual(BASE);
  });

  it('素値オブジェクトを破壊しない（immutable・新インスタンス）', () => {
    const before = { ...BASE };
    const equip: StatModifier = { tai: 8, spd: 2 };
    const eff = effectiveStats(BASE, equip);
    expect(BASE).toEqual(before);
    expect(eff).not.toBe(BASE);
  });

  it('装備補正を合算する（指定キーのみ加算）', () => {
    const equip: StatModifier = { tai: 8, go: 4, critMul: 0.2 };
    const eff = effectiveStats(BASE, equip);
    expect(eff.tai).toBe(34);
    expect(eff.go).toBe(21);
    expect(eff.critMul).toBeCloseTo(1.7, 6);
    expect(eff.hp).toBe(130); // 未指定は据え置き
  });

  it('平常(0-39)・軽い穢(40-69)は体・護に倍率をかけない', () => {
    expect(effectiveStats(BASE, undefined, 0).tai).toBe(26);
    expect(effectiveStats(BASE, undefined, 39).go).toBe(17);
    expect(effectiveStats(BASE, undefined, 40).tai).toBe(26);
    expect(effectiveStats(BASE, undefined, 69).go).toBe(17);
  });

  it('重い穢(70-99)で 体・護 ×0.85（装備合算後に適用）', () => {
    const eff = effectiveStats(BASE, { tai: 14 }, 70); // tai=40 → ×0.85=34
    expect(eff.tai).toBe(34);
    expect(eff.go).toBe(Math.floor(17 * 0.85)); // 14
  });

  it('暴走(100)でも体・護に重い穢相当の ×0.85 を維持する', () => {
    const eff = effectiveStats(BASE, undefined, 100);
    expect(eff.tai).toBe(Math.floor(26 * 0.85)); // 22
    expect(eff.go).toBe(Math.floor(17 * 0.85));  // 14
  });
});

describe('派生関数', () => {
  it('moveSpeed = base × (1 + spd/200)（既定base=4.0）', () => {
    expect(moveSpeed(0)).toBeCloseTo(4.0, 6);
    expect(moveSpeed(14)).toBeCloseTo(4.0 * (1 + 14 / 200), 6);
    expect(moveSpeed(14, 5)).toBeCloseTo(5 * (1 + 14 / 200), 6);
  });

  it('juAttackRecovery = base × (1 - spd/300)', () => {
    expect(juAttackRecovery(0, 0.25)).toBeCloseTo(0.25, 6);
    expect(juAttackRecovery(30, 0.25)).toBeCloseTo(0.25 * (1 - 30 / 300), 6);
  });

  it('juResist = floor(ki/10) + equip（equip既定0）', () => {
    expect(juResist(86)).toBe(8);
    expect(juResist(86, 20)).toBe(28);
    expect(juResist(99)).toBe(9);
  });
});
