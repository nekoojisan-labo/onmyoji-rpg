import { describe, it, expect } from 'vitest';
import { EntityManager, type UpdateContext } from '../src/entities/manager';
import { Entity } from '../src/entities/entity';
import type { Stats } from '../src/combat/stats';

const STATS: Stats = {
  hp: 100, ki: 50, tai: 40, go: 30, jutsuryoku: 35, spd: 20, critRate: 10, critMul: 1.5,
};

class Probe extends Entity {
  updated = 0;
  update(_dt: number, _ctx: UpdateContext): void {
    this.updated += 1;
  }
}

// collide は素通し（衝突無し）のスタブ
const passThroughCollide = (x: number, z: number, _r: number) => ({ x, z });
function ctx(player: Entity, entities: readonly Entity[]): UpdateContext {
  return { player: player as never, entities, nowMs: 0, collide: passThroughCollide };
}

describe('EntityManager', () => {
  it('add で登録し entities に現れる', () => {
    const m = new EntityManager();
    const e = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    m.add(e);
    expect(m.entities).toContain(e);
    expect(m.entities.length).toBe(1);
  });

  it('同一エンティティの二重 add は重複登録しない', () => {
    const m = new EntityManager();
    const e = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    m.add(e);
    m.add(e);
    expect(m.entities.length).toBe(1);
  });

  it('remove(id) で破棄される', () => {
    const m = new EntityManager();
    const a = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    const b = new Probe({ x: 1, z: 1, element: 'fire', baseStats: STATS });
    m.add(a);
    m.add(b);
    m.remove(a.id);
    expect(m.entities).not.toContain(a);
    expect(m.entities).toContain(b);
    expect(m.entities.length).toBe(1);
  });

  it('update は生存エンティティのみ tick する', () => {
    const m = new EntityManager();
    const a = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    const dead = new Probe({ x: 0, z: 0, element: 'water', baseStats: STATS });
    dead.takeDamage(9999); // alive=false
    m.add(a);
    m.add(dead);
    m.update(1 / 60, ctx(a, m.entities));
    expect(a.updated).toBe(1);
    expect(dead.updated).toBe(0);
  });

  it('update 後、死亡したエンティティは自動的に entities から除去される', () => {
    const m = new EntityManager();
    const a = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    m.add(a);
    a.takeDamage(9999);
    m.update(1 / 60, ctx(a, m.entities));
    expect(m.entities).not.toContain(a);
    expect(m.entities.length).toBe(0);
  });

  it('entities は読み取り専用ビューで、外部 push が内部に波及しない', () => {
    const m = new EntityManager();
    const a = new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    m.add(a);
    const view = m.entities as Entity[];
    const before = m.entities.length;
    try {
      view.push(new Probe({ x: 0, z: 0, element: 'fire', baseStats: STATS }));
    } catch {
      // frozen 実装なら例外でも可
    }
    expect(m.entities.length).toBe(before);
  });

  it('dispose 後 entities は空になる', () => {
    const m = new EntityManager();
    m.add(new Probe({ x: 0, z: 0, element: 'wood', baseStats: STATS }));
    m.dispose();
    expect(m.entities.length).toBe(0);
  });
});
