import type { Element } from '../types';

// 相克マトリクス（行=攻撃属性, 列=防御属性, 順序 wood,fire,earth,metal,water / 00b §3）
//   攻撃側が防御側に「克つ」=1.25（有利）／「生む」=0.85（不利方向）／無関係・同属性=1.00
//   wood  [ 1.00, 0.85, 1.25, 1.00, 1.00 ]
//   fire  [ 1.00, 1.00, 0.85, 1.25, 1.00 ]
//   earth [ 1.00, 1.00, 1.00, 0.85, 1.25 ]
//   metal [ 1.25, 1.00, 1.00, 1.00, 0.85 ]
//   water [ 0.85, 1.25, 1.00, 1.00, 1.00 ]
export const ELEMENT_MATRIX: Readonly<Record<Element, Readonly<Record<Element, number>>>> = {
  wood:  { wood: 1.0, fire: 0.85, earth: 1.25, metal: 1.0,  water: 1.0  },
  fire:  { wood: 1.0, fire: 1.0,  earth: 0.85, metal: 1.25, water: 1.0  },
  earth: { wood: 1.0, fire: 1.0,  earth: 1.0,  metal: 0.85, water: 1.25 },
  metal: { wood: 1.25, fire: 1.0, earth: 1.0,  metal: 1.0,  water: 0.85 },
  water: { wood: 0.85, fire: 1.25, earth: 1.0, metal: 1.0,  water: 1.0  },
};

// 相生(攻撃属性が防御属性を「生む」=不利方向)なら 0.85、相克(攻撃属性が防御属性に「克つ」)なら 1.25、それ以外 1.00
export function relation(attacker: Element, defender: Element): number {
  return ELEMENT_MATRIX[attacker][defender];
}

// relation の別名（呼び出し側の意図明示用）。同値を返す
export function elemMul(attacker: Element, defender: Element): number {
  return relation(attacker, defender);
}
