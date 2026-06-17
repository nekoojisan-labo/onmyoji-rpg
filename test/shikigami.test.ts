import { describe, it, expect } from 'vitest';
import { Shikigami } from '../src/entities/shikigami';
import { Player } from '../src/entities/player';
import { Enemy } from '../src/entities/enemy';
import type { UpdateContext } from '../src/entities/manager';
import type { Entity } from '../src/entities/entity';
import type { Stats } from '../src/combat/stats';

const STATS: Stats = {
  hp: 80, ki: 0, tai: 45, go: 25, jutsuryoku: 0, spd: 0, critRate: 5, critMul: 1.5,
};
const PLAYER_STATS: Stats = {
  hp: 200, ki: 100, tai: 50, go: 40, jutsuryoku: 60, spd: 0, critRate: 10, critMul: 1.5,
};
const ENEMY_STATS: Stats = {
  hp: 120, ki: 0, tai: 40, go: 30, jutsuryoku: 20, spd: 0, critRate: 5, critMul: 1.5,
};
const passThroughCollide = (x: number, z: number, _r: number) => ({ x, z });

function makePlayer(x = 0, z = 0): Player {
  return new Player({ x, z, element: 'water', baseStats: PLAYER_STATS });
}
function ctx(player: Player, entities: readonly Entity[], nowMs = 0): UpdateContext {
  return { player, entities, nowMs, collide: passThroughCollide };
}

describe('Shikigami（玄）', () => {
  it('init で shikiId=gen・element=wood・summoned=false', () => {
    const g = new Shikigami({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    expect(g.shikiId).toBe('gen');
    expect(g.element).toBe('wood');
    expect(g.summoned).toBe(false);
    expect(g.intent).toBe('follow');
  });

  it('未召喚（summoned=false）の間は update で移動しない', () => {
    const g = new Shikigami({ x: 5, z: 5, element: 'wood', baseStats: STATS });
    const p = makePlayer(0, 0);
    g.update(1, ctx(p, [p, g]));
    expect(g.x).toBe(5);
    expect(g.z).toBe(5);
  });

  it('summon() で summoned=true・recall() で false', () => {
    const g = new Shikigami({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    g.summon();
    expect(g.summoned).toBe(true);
    g.recall();
    expect(g.summoned).toBe(false);
  });

  it('召喚後・主人公から遠いと intent=regroup でプレイヤーへ近づく', () => {
    const g = new Shikigami({ x: 10, z: 0, element: 'wood', baseStats: STATS });
    g.summon();
    const p = makePlayer(0, 0);
    const before = Math.hypot(g.x - p.x, g.z - p.z);
    g.update(0.2, ctx(p, [p, g]));
    const after = Math.hypot(g.x - p.x, g.z - p.z);
    expect(g.intent).toBe('regroup');
    expect(after).toBeLessThan(before); // 距離が縮む
  });

  it('追従デッドゾーン内（近い）では静止し横滑りしない', () => {
    // 追従距離 1.6 より内側
    const g = new Shikigami({ x: 0.5, z: 0, element: 'wood', baseStats: STATS });
    g.summon();
    const p = makePlayer(0, 0);
    const x0 = g.x;
    const z0 = g.z;
    g.update(0.2, ctx(p, [p, g]));
    expect(g.x).toBeCloseTo(x0, 5);
    expect(g.z).toBeCloseTo(z0, 5);
    expect(g.intent).toBe('follow');
  });

  it('攻撃圏内に敵がいれば intent=attack', () => {
    const g = new Shikigami({ x: 0, z: 0, element: 'wood', baseStats: STATS });
    g.summon();
    const p = makePlayer(0, 0);
    const e = new Enemy({ x: 1.0, z: 0, element: 'fire', baseStats: ENEMY_STATS });
    g.update(0.1, ctx(p, [p, g, e]));
    expect(g.intent).toBe('attack');
  });

  it('regroup でも 1tick で主人公を追い越さない（オーバーシュート無し）', () => {
    const g = new Shikigami({ x: 0.01, z: 0, element: 'wood', baseStats: STATS });
    g.summon();
    const p = makePlayer(0, 0);
    g.update(1, ctx(p, [p, g])); // dt 大きめでも越えない
    // プレイヤー位置(0,0)を符号反転して通り過ぎていないこと
    expect(g.x).toBeGreaterThanOrEqual(0);
  });
});
