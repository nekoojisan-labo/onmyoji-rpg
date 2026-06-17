import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/entities/player';
import { IFRAME_ACTIVE_FROM_SEC, IFRAME_ACTIVE_TO_SEC, DODGE_COOLDOWN_SEC } from '../src/config';
import type { Stats } from '../src/combat/stats';

const stats = (): Stats => ({
  hp: 100, ki: 50, tai: 80, go: 0, jutsuryoku: 90, spd: 0,
  critRate: 0, critMul: 1.5,
});
function makePlayer(): Player {
  const p = new Player({ x: 0, z: 0, element: 'water', baseStats: stats(), radius: 0.4 });
  p.facing = 'right';
  p.ki = 50; p.maxKi = 50;
  return p;
}

describe('回避 i-frame / CD', () => {
  let p: Player;
  beforeEach(() => { p = makePlayer(); });

  it('回避発動で無敵窓が立ち、無敵中は被弾しない', () => {
    const t0 = 1000;
    p.startDodge(t0);
    // 無敵窓中央（active-from + 余白）
    const midMs = t0 + (IFRAME_ACTIVE_FROM_SEC + 0.05) * 1000;
    expect(p.isInvincible(midMs)).toBe(true);
    p.takeDamage(30); // 回避モーション中は粗く無効化
    expect(p.hp).toBe(100);
  });

  it('無敵窓の前後では被弾判定が false', () => {
    const t0 = 1000;
    p.startDodge(t0);
    const beforeWindow = t0 + IFRAME_ACTIVE_FROM_SEC * 1000 - 10;
    const afterWindow = t0 + IFRAME_ACTIVE_TO_SEC * 1000 + 10;
    expect(p.isInvincible(beforeWindow)).toBe(false);
    expect(p.isInvincible(afterWindow)).toBe(false);
  });

  it('クールダウン中は再回避できない', () => {
    const t0 = 1000;
    expect(p.canDodge(t0)).toBe(true);
    p.startDodge(t0);
    const duringCd = t0 + DODGE_COOLDOWN_SEC * 1000 - 10;
    expect(p.canDodge(duringCd)).toBe(false);
    const afterCd = t0 + DODGE_COOLDOWN_SEC * 1000 + 10;
    expect(p.canDodge(afterCd)).toBe(true);
  });

  it('回避していなければ常に被弾する', () => {
    p.takeDamage(30);
    expect(p.hp).toBe(70);
  });

  it('takeDamageAt は精密窓内でスキップ・窓外で適用', () => {
    const t0 = 1000;
    p.startDodge(t0);
    const inWindow = t0 + (IFRAME_ACTIVE_FROM_SEC + 0.05) * 1000;
    p.takeDamageAt(30, inWindow);
    expect(p.hp).toBe(100); // 窓内→スキップ
    const outWindow = t0 + IFRAME_ACTIVE_TO_SEC * 1000 + 100;
    p.takeDamageAt(30, outWindow);
    expect(p.hp).toBe(70); // 窓外→適用
  });

  it('呪CD: markJuCast 後は canCastJu が false→経過で true', () => {
    const t0 = 1000;
    expect(p.canCastJu(t0)).toBe(true);
    p.markJuCast(t0);
    expect(p.canCastJu(t0 + 100)).toBe(false);
    expect(p.canCastJu(t0 + 3000)).toBe(true); // JU_KUSABI.cooldownMs=2500 経過
  });
});
