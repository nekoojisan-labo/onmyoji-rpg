import { describe, it, expect } from 'vitest';
import { KegareGauge, KEGARE_THRESHOLDS, type KegareStage } from '../src/combat/kegare';

describe('KegareGauge 初期化・クランプ', () => {
  it('既定は0・normal', () => {
    const g = new KegareGauge();
    expect(g.value).toBe(0);
    expect(g.stage).toBe('normal');
  });
  it('初期値を 0..100 にクランプ', () => {
    expect(new KegareGauge(-50).value).toBe(0);
    expect(new KegareGauge(250).value).toBe(100);
    expect(new KegareGauge(55).value).toBe(55);
  });
});

describe('段階閾値 40/70/100', () => {
  const cases: [number, KegareStage][] = [
    [0, 'normal'], [39, 'normal'],
    [40, 'light'], [69, 'light'],
    [70, 'heavy'], [99, 'heavy'],
    [100, 'berserk'],
  ];
  it.each(cases)('value=%i → stage=%s', (v, stage) => {
    expect(new KegareGauge(v).stage).toBe(stage);
  });
  it('KEGARE_THRESHOLDS が正典値', () => {
    expect(KEGARE_THRESHOLDS).toEqual({ light: 40, heavy: 70, berserk: 100 });
  });
});

describe('add / sub は immutable で新インスタンスを返しクランプ', () => {
  it('add は元を破壊せず新インスタンス', () => {
    const g0 = new KegareGauge(30);
    const g1 = g0.add(15);
    expect(g0.value).toBe(30);
    expect(g1.value).toBe(45);
    expect(g1).not.toBe(g0);
  });
  it('sub は元を破壊せず新インスタンス', () => {
    const g0 = new KegareGauge(30);
    const g1 = g0.sub(20);
    expect(g0.value).toBe(30);
    expect(g1.value).toBe(10);
  });
  it('add は100でクランプ', () => {
    expect(new KegareGauge(95).add(20).value).toBe(100);
  });
  it('sub は0でクランプ', () => {
    expect(new KegareGauge(10).sub(50).value).toBe(0);
  });
});

describe('デバフ係数', () => {
  it('kiRecoveryMul: normal=1.0 / light以上=0.75', () => {
    expect(new KegareGauge(0).kiRecoveryMul).toBe(1.0);
    expect(new KegareGauge(39).kiRecoveryMul).toBe(1.0);
    expect(new KegareGauge(40).kiRecoveryMul).toBe(0.75);
    expect(new KegareGauge(70).kiRecoveryMul).toBe(0.75);
    expect(new KegareGauge(100).kiRecoveryMul).toBe(0.75);
  });
  it('statMul: heavy未満=1.0 / heavy以上=0.85', () => {
    expect(new KegareGauge(0).statMul).toBe(1.0);
    expect(new KegareGauge(69).statMul).toBe(1.0);
    expect(new KegareGauge(70).statMul).toBe(0.85);
    expect(new KegareGauge(100).statMul).toBe(0.85);
  });
});
