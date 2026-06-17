import { describe, it, expect } from 'vitest';
import { circleHit, fanHit, rectHit } from '../src/combat-runtime/hitbox';
import type { Vec2, Rect } from '../src/types';

describe('circleHit', () => {
  it('半径合計内で接触する（距離二乗判定）', () => {
    const c: Vec2 = { x: 0, z: 0 };
    const t: Vec2 = { x: 3, z: 4 }; // 距離5
    expect(circleHit(c, 2, t, 2)).toBe(false); // 合計4 < 5
    expect(circleHit(c, 3, t, 2)).toBe(true);  // 合計5 == 5（境界=接触）
    expect(circleHit(c, 4, t, 2)).toBe(true);  // 合計6 > 5
  });
  it('同一点は常に接触', () => {
    expect(circleHit({ x: 1, z: 1 }, 0, { x: 1, z: 1 }, 0)).toBe(true);
  });
});

describe('fanHit', () => {
  const origin: Vec2 = { x: 0, z: 0 };
  const dir: Vec2 = { x: 1, z: 0 }; // +x 方向を向く
  it('正面・射程内はヒット', () => {
    expect(fanHit(origin, dir, 5, 90, { x: 3, z: 0 }, 0.5)).toBe(true);
  });
  it('射程外はミス（targetRadius分は許容）', () => {
    expect(fanHit(origin, dir, 5, 90, { x: 6, z: 0 }, 0.5)).toBe(false); // 6-0.5=5.5 > 5
    expect(fanHit(origin, dir, 5, 90, { x: 5.4, z: 0 }, 0.5)).toBe(true); // 5.4-0.5=4.9 ≤ 5
  });
  it('扇の角度外はミス（arc=90→半角45°）', () => {
    // +x から 60°ずれた点（角度差60° > 45°）
    expect(fanHit(origin, dir, 5, 90, { x: Math.cos(Math.PI / 3) * 3, z: Math.sin(Math.PI / 3) * 3 }, 0)).toBe(false);
    // +x から 30°ずれた点（角度差30° ≤ 45°）
    expect(fanHit(origin, dir, 5, 90, { x: Math.cos(Math.PI / 6) * 3, z: Math.sin(Math.PI / 6) * 3 }, 0)).toBe(true);
  });
  it('背後はミス', () => {
    expect(fanHit(origin, dir, 5, 90, { x: -3, z: 0 }, 0)).toBe(false);
  });
  it('原点上の target は常にヒット（角度未定義を救済）', () => {
    expect(fanHit(origin, dir, 5, 90, { x: 0, z: 0 }, 0)).toBe(true);
  });
  it('全方位扇（arc=360）は射程内なら背後でもヒット', () => {
    expect(fanHit(origin, dir, 5, 360, { x: -3, z: 0 }, 0)).toBe(true);
  });
});

describe('rectHit', () => {
  const rect: Rect = { x: 0, z: 0, w: 4, h: 2 }; // x∈[-2,2], z∈[-1,1]
  it('矩形内の点はヒット', () => {
    expect(rectHit(rect, { x: 1, z: 0.5 }, 0)).toBe(true);
  });
  it('辺の外でも targetRadius で接触すればヒット', () => {
    expect(rectHit(rect, { x: 2.4, z: 0 }, 0.5)).toBe(true);  // x方向はみ出し0.4 ≤ 0.5
    expect(rectHit(rect, { x: 2.6, z: 0 }, 0.5)).toBe(false); // はみ出し0.6 > 0.5
  });
  it('角の外（最近点までの距離）で判定', () => {
    // 角(2,1)から斜め。距離 sqrt(0.3^2+0.3^2)≈0.424 ≤ 0.5 →ヒット
    expect(rectHit(rect, { x: 2.3, z: 1.3 }, 0.5)).toBe(true);
    // 距離 sqrt(0.4^2+0.4^2)≈0.566 > 0.5 →ミス
    expect(rectHit(rect, { x: 2.4, z: 1.4 }, 0.5)).toBe(false);
  });
});
