import { describe, it, expect } from 'vitest';
import { Entity } from '../src/entities/entity';
import type { Stats } from '../src/combat/stats';
import type { UpdateContext } from '../src/entities/manager';

const STATS: Stats = {
  hp: 100, ki: 50, tai: 40, go: 30, jutsuryoku: 35, spd: 20, critRate: 10, critMul: 1.5,
};

// テスト用の具象クラス（Entity は abstract）。update は tick をインクリメントする最小実装
class Dummy extends Entity {
  ticks = 0;
  update(_dt: number, _ctx: UpdateContext): void {
    this.ticks += 1;
  }
}

describe('Entity', () => {
  it('init で位置・属性・素値・半径・HP を設定し alive=true', () => {
    const e = new Dummy({ x: 3, z: -2, element: 'wood', baseStats: STATS });
    expect(e.x).toBe(3);
    expect(e.z).toBe(-2);
    expect(e.element).toBe('wood');
    expect(e.baseStats).toBe(STATS);
    expect(e.maxHp).toBe(100);
    expect(e.hp).toBe(100);
    expect(e.alive).toBe(true);
    expect(e.facing).toBe('down');
    expect(e.radius).toBeCloseTo(0.4, 5);
  });

  it('radius は init で上書きできる', () => {
    const e = new Dummy({ x: 0, z: 0, element: 'fire', baseStats: STATS, radius: 0.7 });
    expect(e.radius).toBeCloseTo(0.7, 5);
  });

  it('id は生成順に単調増加し一意', () => {
    const a = new Dummy({ x: 0, z: 0, element: 'water', baseStats: STATS });
    const b = new Dummy({ x: 0, z: 0, element: 'water', baseStats: STATS });
    expect(b.id).toBeGreaterThan(a.id);
  });

  it('takeDamage は hp を減算し最低0でクランプ・0で alive=false', () => {
    const e = new Dummy({ x: 0, z: 0, element: 'earth', baseStats: STATS });
    e.takeDamage(30);
    expect(e.hp).toBe(70);
    expect(e.alive).toBe(true);
    e.takeDamage(999);
    expect(e.hp).toBe(0);
    expect(e.alive).toBe(false);
  });

  it('takeDamage は負量・0量を無視（回復にならない）', () => {
    const e = new Dummy({ x: 0, z: 0, element: 'metal', baseStats: STATS });
    e.takeDamage(20);
    e.takeDamage(-50);
    e.takeDamage(0);
    expect(e.hp).toBe(80);
  });

  it('死亡後の takeDamage は hp を下回らせない', () => {
    const e = new Dummy({ x: 0, z: 0, element: 'fire', baseStats: STATS });
    e.takeDamage(1000);
    expect(e.hp).toBe(0);
    e.takeDamage(50);
    expect(e.hp).toBe(0);
    expect(e.alive).toBe(false);
  });

  it('syncSprite は sprite=null でも例外を投げない', () => {
    const e = new Dummy({ x: 1, z: 2, element: 'wood', baseStats: STATS });
    expect(e.sprite).toBeNull();
    expect(() => e.syncSprite()).not.toThrow();
  });
});
