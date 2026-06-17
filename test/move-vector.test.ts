import { describe, it, expect } from 'vitest';
import { normalizeMove, facingFromMove } from '../src/engine/move-vector';

describe('normalizeMove', () => {
  it('単軸入力は長さ1のまま', () => {
    const r = normalizeMove(1, 0);
    expect(r.moveX).toBeCloseTo(1, 6);
    expect(r.moveZ).toBeCloseTo(0, 6);
  });

  it('斜め同時押しでも長さは1(速くならない)', () => {
    const r = normalizeMove(1, 1);
    const len = Math.hypot(r.moveX, r.moveZ);
    expect(len).toBeCloseTo(1, 6);
    expect(r.moveX).toBeCloseTo(Math.SQRT1_2, 6);
    expect(r.moveZ).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it('負方向の斜めも長さ1', () => {
    const r = normalizeMove(-1, -1);
    expect(Math.hypot(r.moveX, r.moveZ)).toBeCloseTo(1, 6);
  });

  it('無入力はゼロベクトル', () => {
    const r = normalizeMove(0, 0);
    expect(r.moveX).toBe(0);
    expect(r.moveZ).toBe(0);
  });
});

describe('facingFromMove', () => {
  it('+x が支配的なら right', () => {
    expect(facingFromMove(1, 0, 'down')).toBe('right');
  });

  it('-x が支配的なら left', () => {
    expect(facingFromMove(-1, 0, 'down')).toBe('left');
  });

  it('+z が支配的なら down(画面手前)', () => {
    expect(facingFromMove(0, 1, 'up')).toBe('down');
  });

  it('-z が支配的なら up(画面奥)', () => {
    expect(facingFromMove(0, -1, 'down')).toBe('up');
  });

  it('斜めは大きい軸を採用(|x|>|z| で水平優先)', () => {
    expect(facingFromMove(0.8, 0.6, 'down')).toBe('right');
    expect(facingFromMove(0.6, 0.8, 'down')).toBe('down');
  });

  it('ゼロ入力は fallback を維持', () => {
    expect(facingFromMove(0, 0, 'left')).toBe('left');
  });
});
