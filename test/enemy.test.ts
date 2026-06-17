import { describe, it, expect } from 'vitest';
import { Enemy } from '../src/entities/enemy';
import { Player } from '../src/entities/player';
import type { UpdateContext } from '../src/entities/manager';
import type { Entity } from '../src/entities/entity';
import type { Stats } from '../src/combat/stats';

const ENEMY_STATS: Stats = {
  hp: 100, ki: 0, tai: 40, go: 30, jutsuryoku: 20, spd: 0, critRate: 5, critMul: 1.5,
};
const PLAYER_STATS: Stats = {
  hp: 200, ki: 100, tai: 50, go: 40, jutsuryoku: 60, spd: 0, critRate: 10, critMul: 1.5,
};
const passThroughCollide = (x: number, z: number, _r: number) => ({ x, z });

function makeEnemy(x = 0, z = 0): Enemy {
  return new Enemy({ x, z, element: 'fire', baseStats: ENEMY_STATS });
}
function makePlayer(x: number, z: number): Player {
  return new Player({ x, z, element: 'water', baseStats: PLAYER_STATS });
}
function ctx(player: Player, entities: readonly Entity[], nowMs = 0): UpdateContext {
  return { player, entities, nowMs, collide: passThroughCollide };
}

describe('Enemy（鬼火童子）', () => {
  it('init で kind=onibidoji・aiState=idle・leashOrigin が出現地点', () => {
    const e = makeEnemy(3, 4);
    expect(e.kind).toBe('onibidoji');
    expect(e.element).toBe('fire');
    expect(e.aiState).toBe('idle');
    expect(e.leashOrigin).toEqual({ x: 3, z: 4 });
    expect(e.sightRange).toBeCloseTo(7.0, 5);
    expect(e.senseRange).toBeCloseTo(3.0, 5);
  });

  it('視界外の主人公では idle を維持', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(100, 100);
    e.update(1 / 60, ctx(p, [p, e]));
    expect(e.aiState).toBe('idle');
  });

  it('視界内に主人公が入ると alert へ遷移', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(5, 0); // sight 7 以内
    e.update(1 / 60, ctx(p, [p, e]));
    expect(e.aiState).toBe('alert');
  });

  it('alert の予兆時間が経過すると chase へ進み主人公へ接近', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(5, 0);
    e.update(1 / 60, ctx(p, [p, e]));     // → alert
    const before = e.x;
    e.update(0.5, ctx(p, [p, e]));         // windup 0.4s 超過 → chase
    expect(e.aiState).toBe('chase');
    expect(e.x).toBeGreaterThan(before);   // +x の主人公へ寄る
  });

  it('攻撃圏内に入ると attack へ遷移', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(1.0, 0);          // attack range 1.4 以内
    e.update(1 / 60, ctx(p, [p, e]));      // alert
    e.update(0.5, ctx(p, [p, e]));         // 近接なので attack へ
    expect(e.aiState).toBe('attack');
  });

  it('attack 後 recover を経て再び行動可能になる', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(1.0, 0);
    e.update(1 / 60, ctx(p, [p, e]));
    e.update(0.5, ctx(p, [p, e]));         // attack
    expect(e.aiState).toBe('attack');
    e.update(0.05, ctx(p, [p, e]));        // recover へ
    expect(e.aiState).toBe('recover');
    e.update(1.0, ctx(p, [p, e]));         // recover 終了 → 再評価
    expect(['attack', 'chase', 'alert', 'idle']).toContain(e.aiState);
  });

  it('被弾で hurt へ・硬直時間経過で復帰', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(5, 0);
    e.update(1 / 60, ctx(p, [p, e]));      // alert
    e.takeDamage(10);
    e.update(1 / 60, ctx(p, [p, e]));      // → hurt（被弾検知）
    expect(e.aiState).toBe('hurt');
    const stuckX = e.x;
    e.update(0.01, ctx(p, [p, e]));        // 硬直中は動かない
    expect(e.x).toBe(stuckX);
    e.update(1.0, ctx(p, [p, e]));         // 硬直明け
    expect(e.aiState).not.toBe('hurt');
  });

  it('HP0 で down・以後 update しても down を維持', () => {
    const e = makeEnemy(0, 0);
    const p = makePlayer(2, 0);
    e.takeDamage(9999);
    e.update(1 / 60, ctx(p, [p, e]));
    expect(e.aiState).toBe('down');
    e.update(1 / 60, ctx(p, [p, e]));
    expect(e.aiState).toBe('down');
  });

  it('leash 限界を超えると追跡を諦め idle で帰還挙動', () => {
    const e = makeEnemy(0, 0);
    e.aiState = 'chase';
    // 主人公が leash 範囲外（12 超）にいる
    const p = makePlayer(100, 0);
    e.update(1 / 60, ctx(p, [p, e]));
    expect(e.aiState).toBe('idle');
  });

  it('chinkonWindowOpen は hasMiren=true かつ HP30%以下で true', () => {
    const e = makeEnemy(0, 0); // maxHp=100
    e.hasMiren = true;
    expect(e.chinkonWindowOpen()).toBe(false); // HP100%
    e.takeDamage(75); // hp=25 → 25%
    expect(e.chinkonWindowOpen()).toBe(true);
  });

  it('hasMiren=false なら HP30%以下でも窓は開かない', () => {
    const e = makeEnemy(0, 0);
    e.hasMiren = false;
    e.takeDamage(80); // hp=20
    expect(e.chinkonWindowOpen()).toBe(false);
  });
});
