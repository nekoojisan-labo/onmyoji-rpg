import { describe, it, expect } from 'vitest';
import type { Element, Facing, SceneState, Vec2, Rect } from '../src/types';

describe('共有型 types.ts', () => {
  it('Element 5値が型として受理される', () => {
    const all: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
    expect(all.length).toBe(5);
  });

  it('Facing 4値が型として受理される', () => {
    const all: Facing[] = ['down', 'left', 'right', 'up'];
    expect(all.length).toBe(4);
  });

  it('SceneState 6値が型として受理される', () => {
    const all: SceneState[] = ['title', 'field', 'battle', 'menu', 'event', 'gameover'];
    expect(all.length).toBe(6);
  });

  it('Vec2 は x,z を持つ（XZ平面）', () => {
    const v: Vec2 = { x: 1, z: 2 };
    expect(v.x).toBe(1);
    expect(v.z).toBe(2);
  });

  it('Rect は中心x,z と 幅w・奥行h を持つ', () => {
    const r: Rect = { x: 0, z: 0, w: 4, h: 6 };
    expect(r.w).toBe(4);
    expect(r.h).toBe(6);
  });
});
