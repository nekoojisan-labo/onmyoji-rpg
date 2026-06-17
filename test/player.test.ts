import { describe, it, expect } from 'vitest';
import { Player } from '../src/entities/player';
import type { UpdateContext } from '../src/entities/manager';
import type { InputState } from '../src/engine/input';
import type { Stats } from '../src/combat/stats';

const STATS: Stats = {
  hp: 200, ki: 100, tai: 50, go: 40, jutsuryoku: 60, spd: 0, critRate: 10, critMul: 1.5,
};

function emptyInput(): InputState {
  return {
    moveX: 0, moveZ: 0, fuda: false, ju1: false, ju2: false,
    dodge: false, summon: false, switchShiki: false, item: false, chinkon: false,
  };
}
const passThroughCollide = (x: number, z: number, _r: number) => ({ x, z });
function ctx(p: Player, nowMs = 0): UpdateContext {
  return { player: p, entities: [p], nowMs, collide: passThroughCollide };
}

describe('Player', () => {
  it('init で ki/maxKi/level/exp/kegare/action を設定', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    expect(p.maxKi).toBe(100);
    expect(p.ki).toBe(100);
    expect(p.level).toBe(1);
    expect(p.exp).toBe(0);
    expect(p.kegare.value).toBe(0);
    expect(p.action).toBe('idle');
    expect(p.iFrameUntilMs).toBe(0);
  });

  it('入力なしで action=idle', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    p.setInput(emptyInput());
    p.update(1 / 60, ctx(p));
    expect(p.action).toBe('idle');
  });

  it('右移動入力で +x へ進み facing=right・action=move', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    const inp = { ...emptyInput(), moveX: 1, moveZ: 0 };
    p.setInput(inp);
    const dt = 0.5;
    p.update(dt, ctx(p));
    // spd=0 → 速度 4.0 unit/s → 0.5s で 2.0 unit
    expect(p.x).toBeCloseTo(2.0, 5);
    expect(p.z).toBeCloseTo(0, 5);
    expect(p.facing).toBe('right');
    expect(p.action).toBe('move');
  });

  it('斜め同時押しでも速度が等速（速くならない）', () => {
    const straight = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    straight.setInput({ ...emptyInput(), moveX: 1, moveZ: 0 });
    straight.update(1, ctx(straight));
    const straightDist = Math.hypot(straight.x, straight.z);

    const diag = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    diag.setInput({ ...emptyInput(), moveX: 1, moveZ: 1 });
    diag.update(1, ctx(diag));
    const diagDist = Math.hypot(diag.x, diag.z);

    expect(diagDist).toBeCloseTo(straightDist, 4);
  });

  it('facing は4方向へ丸まる（下優勢の判定で +z は down）', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    p.setInput({ ...emptyInput(), moveX: 0, moveZ: 1 });
    p.update(1 / 60, ctx(p));
    expect(p.facing).toBe('down');
  });

  it('dodge 入力で action=dodge・i-frame ウィンドウが設定される', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    p.setInput({ ...emptyInput(), dodge: true, moveX: 1, moveZ: 0 });
    const nowMs = 1000;
    p.update(1 / 60, ctx(p, nowMs));
    expect(p.action).toBe('dodge');
    // 無敵窓 active-from(0.05s)..active-to(0.28s) の中央付近は無敵
    expect(p.isInvincible(nowMs + 150)).toBe(true);
    // 無敵窓開始前は無敵でない
    expect(p.isInvincible(nowMs + 10)).toBe(false);
    // 無敵窓終了後は無敵でない
    expect(p.isInvincible(nowMs + 400)).toBe(false);
  });

  it('isInvincible は i-frame 窓外で false', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    expect(p.isInvincible(0)).toBe(false);
    expect(p.isInvincible(99999)).toBe(false);
  });

  it('collide が押し戻し座標を返すと、その座標が採用される（壁すり抜け防止）', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    p.setInput({ ...emptyInput(), moveX: 1, moveZ: 0 });
    // collide が常に原点へ押し戻すスタブ
    const blockCollide = (_x: number, _z: number, _r: number) => ({ x: 0, z: 0 });
    const c: UpdateContext = { player: p, entities: [p], nowMs: 0, collide: blockCollide };
    p.update(1, c);
    expect(p.x).toBe(0);
    expect(p.z).toBe(0);
  });

  it('hp=0 で action=down になり移動入力を受け付けない', () => {
    const p = new Player({ x: 0, z: 0, element: 'water', baseStats: STATS });
    p.takeDamage(9999);
    p.setInput({ ...emptyInput(), moveX: 1, moveZ: 0 });
    p.update(1, ctx(p));
    expect(p.action).toBe('down');
    expect(p.x).toBe(0);
  });
});
