// module: combat-runtime/actions | 符/呪/玄攻撃の発生→ヒット集計→Entity被弾適用
// 純核（resolve.ts）を Entity 世界へつなぐ薄いアダプタ。気消費・死亡対象除外・facing変換を担う。
import type { Vec2, Facing } from '../types';
import type { Entity } from '../entities/entity';
import type { Player } from '../entities/player';
import type { Shikigami } from '../entities/shikigami';
import { effectiveStats } from '../combat/stats';
import { resolveHits, type AttackSpec, type HitTarget } from './resolve';
import { FUDA, GEN_ATTACK } from '../config';

export interface ActionResult {
  hits: { target: Entity; damage: number }[];
}

// facing → XZ向きベクトル（z+ を down、z- を up、x± を right/left とする）
function facingDir(facing: Facing): Vec2 {
  switch (facing) {
    case 'down': return { x: 0, z: 1 };
    case 'up': return { x: 0, z: -1 };
    case 'right': return { x: 1, z: 0 };
    case 'left': return { x: -1, z: 0 };
  }
}

// 生存している敵のみ HitTarget へ写像（live と targets は同じ index 並び）
function liveTargets(enemies: readonly Entity[]): { live: Entity[]; targets: HitTarget[] } {
  const live: Entity[] = [];
  const targets: HitTarget[] = [];
  for (const e of enemies) {
    if (!e.alive) continue;
    live.push(e);
    targets.push({
      pos: { x: e.x, z: e.z },
      radius: e.radius,
      defenderGo: effectiveStats(e.baseStats).go,
      defenderElement: e.element,
    });
  }
  return { live, targets };
}

function applyHits(spec: AttackSpec, enemies: readonly Entity[]): ActionResult {
  const { live, targets } = liveTargets(enemies);
  const resolved = resolveHits(spec, targets);
  const hits: { target: Entity; damage: number }[] = [];
  for (const r of resolved) {
    const target = live[r.index]!; // resolveHits の index は targets/live と一致（noUncheckedIndexedAccess 対応）
    target.takeDamage(r.damage);
    hits.push({ target, damage: r.damage });
  }
  return { hits };
}

// 符（前方扇・気消費なし・skillMul=1.0・体基礎）
export function castFuda(player: Player, enemies: readonly Entity[]): ActionResult {
  const eff = effectiveStats(player.baseStats);
  const spec: AttackSpec = {
    origin: { x: player.x, z: player.z },
    facingDir: facingDir(player.facing),
    shape: 'fan',
    range: FUDA.range,
    arcDeg: FUDA.arcDeg,
    skillMul: FUDA.skillMul,
    atkStat: eff.tai,
    isMagic: false,
    attackerElement: player.element,
    critRate: eff.critRate,
    critMul: eff.critMul,
  };
  return applyHits(spec, enemies);
}

// 呪（前方扇・気消費・術力基礎）。気不足なら空振り（副作用なし）。
export function castJu(
  player: Player,
  enemies: readonly Entity[],
  opts: { skillMul: number; kiCost: number; arcDeg: number; range: number },
): ActionResult {
  if (player.ki < opts.kiCost) return { hits: [] };
  player.ki -= opts.kiCost;
  const eff = effectiveStats(player.baseStats);
  const spec: AttackSpec = {
    origin: { x: player.x, z: player.z },
    facingDir: facingDir(player.facing),
    shape: 'fan',
    range: opts.range,
    arcDeg: opts.arcDeg,
    skillMul: opts.skillMul,
    atkStat: eff.jutsuryoku,
    isMagic: true,
    attackerElement: player.element,
    critRate: eff.critRate,
    critMul: eff.critMul,
  };
  return applyHits(spec, enemies);
}

// 玄の攻撃（疾風斬・木・前方近接扇・体基礎）
export function castGenAttack(gen: Shikigami, enemies: readonly Entity[]): ActionResult {
  const eff = effectiveStats(gen.baseStats);
  const spec: AttackSpec = {
    origin: { x: gen.x, z: gen.z },
    facingDir: facingDir(gen.facing),
    shape: 'fan',
    range: GEN_ATTACK.range,
    arcDeg: GEN_ATTACK.arcDeg,
    skillMul: GEN_ATTACK.skillMul,
    atkStat: eff.tai,
    isMagic: false,
    attackerElement: gen.element, // 木（風は倍率非関与）
    critRate: eff.critRate,
    critMul: eff.critMul,
  };
  return applyHits(spec, enemies);
}
