// module: combat-runtime/battle-system | 戦闘1フレーム統合（入力→アクション→鎮魂→討伐検知）
// Three.js 非依存。Entity を破壊的更新し、UI/演出が読むイベント配列を返す。
import type { InputState } from '../engine/input';
import type { Player } from '../entities/player';
import type { Shikigami } from '../entities/shikigami';
import type { Enemy } from '../entities/enemy';
import { ChinkonState } from '../combat/chinkon';
import { castFuda, castJu, castGenAttack } from './actions';
import { JU_KUSABI } from '../config';
import {
  canBeginChinkon,
  applySootheKegare,
  applySubjugateKegare,
  CHINKON_KI_COST,
} from './chinkon-flow';

export interface BattleStepInput {
  input: InputState;
  dt: number;
  nowMs: number;
}
export interface BattleContext {
  player: Player;
  gen: Shikigami | null;
  enemies: Enemy[];
  chinkon: ChinkonState;
}
export type BattleEvent =
  | { type: 'fuda'; hits: number }
  | { type: 'ju'; hits: number }
  | { type: 'dodge' }
  | { type: 'chinkon-open' }
  | { type: 'chinkon-begin' }
  | { type: 'soothed'; enemyId: number; kegare: number }
  | { type: 'subjugated'; enemyId: number; kegare: number };
export interface BattleStepResult {
  chinkon: ChinkonState;
  events: BattleEvent[];
}

// 鎮魂対象の代表敵（窓が開く最初の生存敵）を選ぶ
function chinkonTarget(enemies: readonly Enemy[]): Enemy | null {
  for (const e of enemies) {
    if (e.alive && e.chinkonWindowOpen()) return e;
  }
  return null;
}

export function stepBattle(ctx: BattleContext, step: BattleStepInput): BattleStepResult {
  const { input, dt, nowMs } = step;
  const events: BattleEvent[] = [];
  let chinkon = ctx.chinkon;

  // 死亡前の生存状態を記録（このフレームの攻撃で討伐されたか後で判定するため）
  const aliveBefore = new Map<number, boolean>();
  for (const e of ctx.enemies) aliveBefore.set(e.id, e.alive);

  // --- 回避 ---
  if (input.dodge && ctx.player.canDodge(nowMs)) {
    ctx.player.startDodge(nowMs);
    events.push({ type: 'dodge' });
  }

  // --- 攻撃（チャネル中は無防備＝攻撃不可） ---
  const channeling = chinkon.phase === 'channeling';
  if (!channeling) {
    if (input.fuda) {
      const r = castFuda(ctx.player, ctx.enemies);
      events.push({ type: 'fuda', hits: r.hits.length });
    }
    if (input.ju1 && ctx.player.canCastJu(nowMs)) {
      const r = castJu(ctx.player, ctx.enemies, {
        skillMul: JU_KUSABI.skillMul, kiCost: JU_KUSABI.kiCost,
        arcDeg: JU_KUSABI.arcDeg, range: JU_KUSABI.range,
      });
      ctx.player.markJuCast(nowMs);
      events.push({ type: 'ju', hits: r.hits.length });
    }
    if (ctx.gen && ctx.gen.summoned && ctx.gen.intent === 'attack') {
      castGenAttack(ctx.gen, ctx.enemies);
    }
  }

  // --- 鎮魂窓・チャネル進行 ---
  const target = chinkonTarget(ctx.enemies);
  if (chinkon.phase === 'closed' && target) {
    chinkon = chinkon.open();
    events.push({ type: 'chinkon-open' });
  } else if (chinkon.phase === 'open' && !target) {
    // 窓が閉じた（対象が消えた/HP回復）→ cancel で畳む
    chinkon = chinkon.cancel();
  }

  if (chinkon.phase === 'open' && input.chinkon
      && target && canBeginChinkon(target.hp, target.maxHp, target.hasMiren, ctx.player.ki)) {
    ctx.player.ki -= CHINKON_KI_COST;
    chinkon = chinkon.beginChannel();
    events.push({ type: 'chinkon-begin' });
  }

  if (chinkon.phase === 'channeling') {
    // 被弾による中断は Game 側が chinkon.cancel() を呼ぶ契約。本関数は進行のみ。
    chinkon = chinkon.tick(dt);
    if (chinkon.phase === 'succeeded' && target) {
      ctx.player.kegare = applySootheKegare(ctx.player.kegare);
      target.alive = false; // 救済＝昇華退場（討伐扱いにしない）
      events.push({ type: 'soothed', enemyId: target.id, kegare: ctx.player.kegare.value });
      chinkon = new ChinkonState(); // closed へリセット
    }
  }

  // --- 討伐検知（このフレームで生存→死亡に転じ、鎮魂で退場でない未練持ち敵） ---
  const soothedIds = new Set(
    events
      .filter((e): e is Extract<BattleEvent, { type: 'soothed' }> => e.type === 'soothed')
      .map((e) => e.enemyId),
  );
  for (const e of ctx.enemies) {
    const was = aliveBefore.get(e.id) ?? false;
    if (was && !e.alive && !soothedIds.has(e.id)) {
      if (e.hasMiren) {
        ctx.player.kegare = applySubjugateKegare(ctx.player.kegare);
        events.push({ type: 'subjugated', enemyId: e.id, kegare: ctx.player.kegare.value });
      }
    }
  }

  return { chinkon, events };
}
