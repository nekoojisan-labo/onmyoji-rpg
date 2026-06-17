import { describe, it, expect } from 'vitest';
import {
  nextExp,
  totalExpToReach,
  levelFromExp,
  playerStatsAtLevel,
} from '../src/combat/leveling';

describe('nextExp = floor(50 × L^1.5 + 20 × L)', () => {
  it('nextExp(1) = 70', () => {
    expect(nextExp(1)).toBe(70);
  });
  it('nextExp(2) = floor(50×2^1.5 + 40)', () => {
    expect(nextExp(2)).toBe(Math.floor(50 * Math.pow(2, 1.5) + 40));
  });
  it('nextExp(5) = floor(50×5^1.5 + 100)', () => {
    expect(nextExp(5)).toBe(Math.floor(50 * Math.pow(5, 1.5) + 100));
  });
  it('単調増加する', () => {
    for (let L = 1; L < 20; L++) {
      expect(nextExp(L + 1)).toBeGreaterThan(nextExp(L));
    }
  });
});

describe('totalExpToReach = Σ nextExp(1..L-1)', () => {
  it('totalExpToReach(1) = 0（Lv1は累計0）', () => {
    expect(totalExpToReach(1)).toBe(0);
  });
  it('totalExpToReach(2) = nextExp(1) = 70', () => {
    expect(totalExpToReach(2)).toBe(70);
  });
  it('totalExpToReach(3) = nextExp(1)+nextExp(2)', () => {
    expect(totalExpToReach(3)).toBe(nextExp(1) + nextExp(2));
  });
});

describe('levelFromExp（totalExpToReach と往復整合）', () => {
  it('累計0 → Lv1', () => {
    expect(levelFromExp(0)).toBe(1);
  });
  it('ちょうど到達EXPで該当Lv', () => {
    for (let L = 1; L <= 20; L++) {
      expect(levelFromExp(totalExpToReach(L))).toBe(L);
    }
  });
  it('到達EXP直前は1つ下のLv', () => {
    expect(levelFromExp(totalExpToReach(3) - 1)).toBe(2);
  });
  it('到達EXP直後は同じLv（次の閾値未満）', () => {
    expect(levelFromExp(totalExpToReach(3) + 1)).toBe(3);
  });
  it('負のEXPでも最低Lv1', () => {
    expect(levelFromExp(-100)).toBe(1);
  });
});

describe('playerStatsAtLevel 成長テーブル(B2.3)', () => {
  it('アンカーLv1のステが正典値', () => {
    const s = playerStatsAtLevel(1);
    expect(s.hp).toBe(80);
    expect(s.ki).toBe(60);
    expect(s.tai).toBe(12);
    expect(s.go).toBe(8);
    expect(s.spd).toBe(10);
    expect(s.jutsuryoku).toBe(10);
    expect(s.critRate).toBe(5);
    expect(s.critMul).toBe(1.5);
  });
  it('アンカーLv5のステが正典値', () => {
    const s = playerStatsAtLevel(5);
    expect(s).toMatchObject({ hp: 130, ki: 86, tai: 26, go: 17, spd: 14, jutsuryoku: 19 });
  });
  it('アンカーLv20のステが正典値', () => {
    const s = playerStatsAtLevel(20);
    expect(s).toMatchObject({ hp: 350, ki: 224, tai: 104, go: 65, spd: 29, jutsuryoku: 67 });
  });
  it('テーブル間レベルは線形補間（Lv4はLv3とLv5の中間・floor）', () => {
    // Lv3 hp=104, Lv5 hp=130 → Lv4 = floor(104 + (130-104)×(4-3)/(5-3)) = floor(117) = 117
    expect(playerStatsAtLevel(4).hp).toBe(117);
    // Lv3 tai=18, Lv5 tai=26 → Lv4 = floor(18 + 8×0.5) = 22
    expect(playerStatsAtLevel(4).tai).toBe(22);
  });
  it('範囲外はクランプ（Lv0→Lv1相当・Lv99→Lv20相当）', () => {
    expect(playerStatsAtLevel(0).hp).toBe(80);
    expect(playerStatsAtLevel(99).hp).toBe(350);
  });
  it('critRate=5・critMul=1.5 は全レベル固定', () => {
    for (const L of [1, 4, 8, 13, 20]) {
      const s = playerStatsAtLevel(L);
      expect(s.critRate).toBe(5);
      expect(s.critMul).toBe(1.5);
    }
  });
});
