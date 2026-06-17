import { describe, it, expect, beforeEach } from 'vitest';
import { castFuda, castJu, castGenAttack } from '../src/combat-runtime/actions';
import { Player } from '../src/entities/player';
import { Shikigami } from '../src/entities/shikigami';
import { Enemy } from '../src/entities/enemy';
import { FUDA, JU_KUSABI } from '../src/config';
import type { Stats } from '../src/combat/stats';

const stats = (over: Partial<Stats> = {}): Stats => ({
  hp: 100, ki: 50, tai: 80, go: 0, jutsuryoku: 90, spd: 10,
  critRate: 0, critMul: 1.5, ...over,
});

// facing='right'（+x方向）に統一して前方扇に敵を置く
function makePlayer(): Player {
  const p = new Player({ x: 0, z: 0, element: 'water', baseStats: stats(), radius: 0.4 });
  p.facing = 'right';
  p.ki = 50; p.maxKi = 50;
  return p;
}
function makeEnemy(x: number, z: number, go = 0): Enemy {
  return new Enemy({ x, z, element: 'fire', baseStats: stats({ go }), radius: 0.5 });
}

describe('castFuda（符・気消費なし）', () => {
  let player: Player;
  beforeEach(() => { player = makePlayer(); });

  it('前方の敵に当たりダメージを与え hp が減る', () => {
    const e = makeEnemy(3, 0);
    const res = castFuda(player, [e]);
    expect(res.hits.length).toBe(1);
    expect(res.hits[0]!.target).toBe(e);
    expect(res.hits[0]!.damage).toBeGreaterThan(0);
    // takeDamage は hp を 0 でクランプする（符は乱数で ~95-105・相克1.25 のため 100 超で即死もあり得る）
    expect(e.hp).toBe(Math.max(0, 100 - res.hits[0]!.damage));
  });
  it('射程外の敵には当たらない', () => {
    const e = makeEnemy(FUDA.range + 5, 0);
    expect(castFuda(player, [e]).hits.length).toBe(0);
  });
  it('気を消費しない', () => {
    const e = makeEnemy(3, 0);
    const before = player.ki;
    castFuda(player, [e]);
    expect(player.ki).toBe(before);
  });
  it('死亡済みの敵は対象外', () => {
    const e = makeEnemy(3, 0);
    e.alive = false;
    expect(castFuda(player, [e]).hits.length).toBe(0);
  });
});

describe('castJu（呪・気消費）', () => {
  let player: Player;
  beforeEach(() => { player = makePlayer(); });

  it('気が足りれば発動し気を消費、術力基礎でダメージ', () => {
    const e = makeEnemy(3, 0);
    const before = player.ki;
    const res = castJu(player, [e], {
      skillMul: JU_KUSABI.skillMul, kiCost: JU_KUSABI.kiCost,
      arcDeg: JU_KUSABI.arcDeg, range: JU_KUSABI.range,
    });
    expect(res.hits.length).toBe(1);
    expect(player.ki).toBe(before - JU_KUSABI.kiCost);
    expect(e.hp).toBeLessThan(100);
  });
  it('気が足りなければ空振り（hits空・気変化なし・敵無傷）', () => {
    player.ki = JU_KUSABI.kiCost - 1;
    const e = makeEnemy(3, 0);
    const res = castJu(player, [e], {
      skillMul: JU_KUSABI.skillMul, kiCost: JU_KUSABI.kiCost,
      arcDeg: JU_KUSABI.arcDeg, range: JU_KUSABI.range,
    });
    expect(res.hits.length).toBe(0);
    expect(player.ki).toBe(JU_KUSABI.kiCost - 1);
    expect(e.hp).toBe(100);
  });
});

describe('castGenAttack（玄の攻撃・木）', () => {
  it('前方近接の敵に当たる', () => {
    const gen = new Shikigami({ x: 0, z: 0, element: 'wood', baseStats: stats(), radius: 0.4 });
    gen.facing = 'right';
    gen.summoned = true;
    const e = makeEnemy(2, 0);
    const res = castGenAttack(gen, [e]);
    expect(res.hits.length).toBe(1);
    expect(e.hp).toBeLessThan(100);
  });
});
