import { describe, it, expect } from 'vitest';
import {
  circleIntersectsRect,
  resolveCircleRect,
  clampToMapBounds,
  resolveCollision,
} from '../src/world/collision';
import type { Rect } from '../src/types';

const wall: Rect = { x: 0, z: 0, w: 4, h: 4 };

describe('circleIntersectsRect', () => {
  it('離れた円は非交差', () => {
    expect(circleIntersectsRect(10, 0, 0.5, wall)).toBe(false);
  });

  it('辺に食い込む円は交差', () => {
    expect(circleIntersectsRect(2.4, 0, 0.5, wall)).toBe(true);
  });

  it('角の外側だが半径内なら交差', () => {
    expect(circleIntersectsRect(2.3, 2.3, 0.5, wall)).toBe(true);
  });

  it('角の外側で半径外なら非交差', () => {
    expect(circleIntersectsRect(2.5, 2.5, 0.5, wall)).toBe(false);
  });
});

describe('resolveCircleRect', () => {
  it('右辺へ食い込んだら右へ押し出す(x増・zは保持)', () => {
    const r = resolveCircleRect(2.4, 0.0, 0.5, wall);
    expect(r.x).toBeCloseTo(2.5, 6);
    expect(r.z).toBeCloseTo(0.0, 6);
  });

  it('上辺(z+)へ食い込んだら z方向へ押し出す(xは保持=スライド)', () => {
    const r = resolveCircleRect(0.3, 2.4, 0.5, wall);
    expect(r.x).toBeCloseTo(0.3, 6);
    expect(r.z).toBeCloseTo(2.5, 6);
  });

  it('非交差なら座標そのまま', () => {
    const r = resolveCircleRect(10, 10, 0.5, wall);
    expect(r.x).toBe(10);
    expect(r.z).toBe(10);
  });
});

describe('clampToMapBounds', () => {
  const bounds: Rect = { x: 0, z: 0, w: 20, h: 20 };

  it('境界内はそのまま', () => {
    const r = clampToMapBounds(3, -4, 0.5, bounds);
    expect(r.x).toBe(3);
    expect(r.z).toBe(-4);
  });

  it('右端を半径ぶん内側へクランプ', () => {
    const r = clampToMapBounds(100, 0, 0.5, bounds);
    expect(r.x).toBeCloseTo(9.5, 6);
    expect(r.z).toBeCloseTo(0, 6);
  });

  it('左下端を両軸クランプ', () => {
    const r = clampToMapBounds(-100, -100, 1, bounds);
    expect(r.x).toBeCloseTo(-9, 6);
    expect(r.z).toBeCloseTo(-9, 6);
  });
});

describe('resolveCollision', () => {
  const bounds: Rect = { x: 0, z: 0, w: 40, h: 40 };

  it('壁を1枚押し出し、その後境界クランプ', () => {
    const r = resolveCollision(2.4, 0, 0.5, [wall], bounds);
    expect(r.x).toBeCloseTo(2.5, 6);
    expect(r.z).toBeCloseTo(0, 6);
  });

  it('障害物無し+境界内は無変化', () => {
    const r = resolveCollision(5, 5, 0.5, [], bounds);
    expect(r.x).toBe(5);
    expect(r.z).toBe(5);
  });

  it('複数壁を順次解決する(角に挟まれても抜けない)', () => {
    const a: Rect = { x: 0, z: 0, w: 4, h: 4 };
    const b: Rect = { x: 3, z: 0, w: 4, h: 4 };
    const r = resolveCollision(1.9, 0, 0.5, [a, b], bounds);
    expect(circleIntersectsRect(r.x, r.z, 0.5, a)).toBe(false);
    expect(circleIntersectsRect(r.x, r.z, 0.5, b)).toBe(false);
  });
});
