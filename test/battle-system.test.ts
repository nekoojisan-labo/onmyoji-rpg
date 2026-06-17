import { describe, it, expect, beforeEach } from 'vitest';
import { stepBattle, type BattleContext, type BattleStepInput } from '../src/combat-runtime/battle-system';
import { Player } from '../src/entities/player';
import { Enemy } from '../src/entities/enemy';
import { ChinkonState } from '../src/combat/chinkon';
import { KegareGauge } from '../src/combat/kegare';
import { SOOTHE_KEGARE_DELTA, SUBJUGATE_KEGARE_DELTA } from '../src/combat-runtime/chinkon-flow';
import type { Stats } from '../src/combat/stats';
import type { InputState } from '../src/engine/input';

const stats = (over: Partial<Stats> = {}): Stats => ({
  hp: 100, ki: 50, tai: 80, go: 0, jutsuryoku: 90, spd: 0,
  critRate: 0, critMul: 1.5, ...over,
});
const noInput = (over: Partial<InputState> = {}): InputState => ({
  moveX: 0, moveZ: 0, fuda: false, ju1: false, ju2: false,
  dodge: false, summon: false, switchShiki: false, item: false, chinkon: false, ...over,
});
function makePlayer(): Player {
  const p = new Player({ x: 0, z: 0, element: 'water', baseStats: stats(), radius: 0.4 });
  p.facing = 'right'; p.ki = 50; p.maxKi = 50; p.kegare = new KegareGauge(0);
  return p;
}
function makeEnemy(hp = 100, miren = true): Enemy {
  const e = new Enemy({ x: 3, z: 0, element: 'fire', baseStats: stats({ hp }), radius: 0.5 });
  e.hp = hp; e.maxHp = 100; e.hasMiren = miren;
  return e;
}
const step = (over: Partial<BattleStepInput> = {}): BattleStepInput => ({
  input: noInput(), dt: 1 / 60, nowMs: 1000, ...over,
});

describe('stepBattle', () => {
  let ctx: BattleContext;
  beforeEach(() => {
    ctx = { player: makePlayer(), gen: null, enemies: [makeEnemy()], chinkon: new ChinkonState() };
  });

  it('符入力で前方の敵にダメージ＋fudaイベント', () => {
    const before = ctx.enemies[0]!.hp;
    const r = stepBattle(ctx, step({ input: noInput({ fuda: true }) }));
    expect(ctx.enemies[0]!.hp).toBeLessThan(before);
    expect(r.events.some((e) => e.type === 'fuda')).toBe(true);
  });

  it('呪入力で気消費＋juイベント', () => {
    const beforeKi = ctx.player.ki;
    const r = stepBattle(ctx, step({ input: noInput({ ju1: true }) }));
    expect(ctx.player.ki).toBeLessThan(beforeKi);
    expect(r.events.some((e) => e.type === 'ju')).toBe(true);
  });

  it('敵HP30%以下＋未練ありで鎮魂窓が開く（chinkon-open）', () => {
    ctx.enemies[0]!.hp = 25; // 25%
    const r = stepBattle(ctx, step());
    expect(r.chinkon.phase).toBe('open');
    expect(r.events.some((e) => e.type === 'chinkon-open')).toBe(true);
  });

  it('鎮魂入力でチャネル開始→1.5s経過で救済（穢−15・敵昇華）', () => {
    ctx.enemies[0]!.hp = 20;
    // 窓を開く
    let r = stepBattle(ctx, step());
    ctx.chinkon = r.chinkon;
    // 鎮魂キーでチャネル開始
    r = stepBattle(ctx, step({ input: noInput({ chinkon: true }) }));
    ctx.chinkon = r.chinkon;
    expect(r.chinkon.phase).toBe('channeling');
    // 1.5s ぶん進める
    r = stepBattle(ctx, step({ dt: 1.5 }));
    expect(r.events.some((e) => e.type === 'soothed')).toBe(true);
    expect(ctx.player.kegare.value).toBe(Math.max(0, 0 + SOOTHE_KEGARE_DELTA)); // 0→クランプ0
    expect(ctx.enemies[0]!.alive).toBe(false); // 救済＝退場
  });

  it('鎮魂せず討伐すると穢が+7される（subjugated）', () => {
    ctx.player.kegare = new KegareGauge(50);
    ctx.enemies[0]!.hp = 1; // 符1発で死ぬ想定
    const r = stepBattle(ctx, step({ input: noInput({ fuda: true }) }));
    // 敵が死んだ かつ 鎮魂していない → 討伐
    expect(ctx.enemies[0]!.alive).toBe(false);
    expect(r.events.some((e) => e.type === 'subjugated')).toBe(true);
    expect(ctx.player.kegare.value).toBe(50 + SUBJUGATE_KEGARE_DELTA); // 57
  });

  it('未練なし敵では鎮魂窓が開かない', () => {
    ctx.enemies = [makeEnemy(20, false)];
    const r = stepBattle(ctx, step());
    expect(r.chinkon.phase).toBe('closed');
  });
});

describe('穢デバフの被ダメ反映', () => {
  it('重い穢(70+)で被攻撃側の護が下がる', async () => {
    const { effectiveStats } = await import('../src/combat/stats');
    const base = stats({ go: 100 });
    const normal = effectiveStats(base, undefined, 0);   // 平常
    const heavy = effectiveStats(base, undefined, 75);   // 重い穢→護×0.85
    expect(heavy.go).toBeLessThan(normal.go);
    expect(heavy.go).toBe(Math.floor(100 * 0.85)); // 85（契約: 重い穢で体・護×0.85）
  });
});
