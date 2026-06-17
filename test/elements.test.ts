import { describe, it, expect } from 'vitest';
import { relation, elemMul, ELEMENT_MATRIX } from '../src/combat/elements';
import type { Element } from '../src/types';

const ALL: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

// 相克（攻撃側有利・×1.25）木→土→水→火→金→木
const KOKU: [Element, Element][] = [
  ['wood', 'earth'],
  ['earth', 'water'],
  ['water', 'fire'],
  ['fire', 'metal'],
  ['metal', 'wood'],
];
// 相生（与ダメ減・不利方向・×0.85）木→火→土→金→水→木
const SOU: [Element, Element][] = [
  ['wood', 'fire'],
  ['fire', 'earth'],
  ['earth', 'metal'],
  ['metal', 'water'],
  ['water', 'wood'],
];

describe('relation / elemMul 五行相性', () => {
  it('相克5組は ×1.25 を返す', () => {
    for (const [atk, def] of KOKU) {
      expect(relation(atk, def)).toBe(1.25);
    }
  });

  it('相生5組は ×0.85 を返す', () => {
    for (const [atk, def] of SOU) {
      expect(relation(atk, def)).toBe(0.85);
    }
  });

  it('同属性は ×1.00 を返す', () => {
    for (const e of ALL) {
      expect(relation(e, e)).toBe(1.0);
    }
  });

  it('全25組のうち相克5・相生5以外の15組は ×1.00', () => {
    const kokuSet = new Set(KOKU.map(([a, d]) => `${a}>${d}`));
    const souSet = new Set(SOU.map(([a, d]) => `${a}>${d}`));
    let neutral = 0;
    for (const atk of ALL) {
      for (const def of ALL) {
        const key = `${atk}>${def}`;
        if (kokuSet.has(key)) {
          expect(relation(atk, def)).toBe(1.25);
        } else if (souSet.has(key)) {
          expect(relation(atk, def)).toBe(0.85);
        } else {
          expect(relation(atk, def)).toBe(1.0);
          neutral++;
        }
      }
    }
    expect(neutral).toBe(15);
  });

  it('elemMul は relation の別名で同値を返す', () => {
    for (const atk of ALL) {
      for (const def of ALL) {
        expect(elemMul(atk, def)).toBe(relation(atk, def));
      }
    }
  });

  it('ELEMENT_MATRIX は relation と一致する（行=攻撃, 列=防御）', () => {
    for (const atk of ALL) {
      for (const def of ALL) {
        expect(ELEMENT_MATRIX[atk][def]).toBe(relation(atk, def));
      }
    }
  });
});
