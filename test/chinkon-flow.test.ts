import { describe, it, expect } from 'vitest';
import {
  applySootheKegare,
  applySubjugateKegare,
  canBeginChinkon,
  CHINKON_KI_COST,
  SOOTHE_KEGARE_DELTA,
  SUBJUGATE_KEGARE_DELTA,
} from '../src/combat-runtime/chinkon-flow';
import { KegareGauge } from '../src/combat/kegare';
import { ChinkonState, CHINKON_CHANNEL_SEC } from '../src/combat/chinkon';

describe('鎮魂の穢変動', () => {
  it('救済成功で穢が −15 される（immutable）', () => {
    const g0 = new KegareGauge(50);
    const g1 = applySootheKegare(g0);
    expect(g1.value).toBe(50 + SOOTHE_KEGARE_DELTA); // 35
    expect(g0.value).toBe(50); // 元は不変
    expect(SOOTHE_KEGARE_DELTA).toBe(-15);
  });
  it('救済は0未満にクランプされる', () => {
    expect(applySootheKegare(new KegareGauge(5)).value).toBe(0);
  });
  it('討伐で穢が +7 される（immutable）', () => {
    const g0 = new KegareGauge(50);
    const g1 = applySubjugateKegare(g0);
    expect(g1.value).toBe(50 + SUBJUGATE_KEGARE_DELTA); // 57
    expect(g0.value).toBe(50);
    expect(SUBJUGATE_KEGARE_DELTA).toBe(7);
  });
  it('討伐は100上限にクランプされる', () => {
    expect(applySubjugateKegare(new KegareGauge(98)).value).toBe(100);
  });
});

describe('canBeginChinkon', () => {
  it('窓が開き気が足りれば true', () => {
    expect(canBeginChinkon(30, 100, true, CHINKON_KI_COST)).toBe(true);   // HP30% ちょうど・気=コスト
    expect(canBeginChinkon(20, 100, true, 100)).toBe(true);
  });
  it('HPが30%超なら false', () => {
    expect(canBeginChinkon(31, 100, true, 100)).toBe(false);
  });
  it('未練が無ければ false', () => {
    expect(canBeginChinkon(10, 100, false, 100)).toBe(false);
  });
  it('気が足りなければ false', () => {
    expect(canBeginChinkon(10, 100, true, CHINKON_KI_COST - 1)).toBe(false);
  });
});

// ChinkonState 連携（純粋層の挙動を本群の前提として固定）
describe('ChinkonState 被弾中断', () => {
  it('channeling 中に cancel で cancelled になる', () => {
    let s = new ChinkonState().open().beginChannel();
    s = s.tick(0.5); // 途中
    expect(s.phase).toBe('channeling');
    s = s.cancel();
    expect(s.phase).toBe('cancelled');
  });
  it('1.5s 経過で succeeded', () => {
    let s = new ChinkonState().open().beginChannel();
    s = s.tick(CHINKON_CHANNEL_SEC);
    expect(s.phase).toBe('succeeded');
  });
});
