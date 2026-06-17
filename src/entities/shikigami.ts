import { Entity } from './entity';
import type { UpdateContext } from './manager';
import type { Entity as EntityType } from './entity';
import type { Element } from '../types';
import type { Stats } from '../combat/stats';
import { facingFromVector } from './facing-util';
import {
  GEN_FOLLOW_DISTANCE,
  GEN_REGROUP_DISTANCE,
  GEN_ATTACK_RANGE,
  GEN_MOVE_SPEED,
} from '../config';

export type ShikiAiIntent = 'follow' | 'attack' | 'regroup';

/** 使役式神「玄」（烏天狗・木/風）。v1は唯一の式神・1枠。意図駆動で主人公に追従し敵を攻撃する。 */
export class Shikigami extends Entity {
  readonly shikiId: 'gen' = 'gen';
  summoned: boolean;
  intent: ShikiAiIntent;

  constructor(init: { x: number; z: number; element: Element; baseStats: Stats; radius?: number }) {
    super(init);
    this.summoned = false;
    this.intent = 'follow';
  }

  summon(): void {
    this.summoned = true;
  }

  recall(): void {
    this.summoned = false;
  }

  update(dt: number, ctx: UpdateContext): void {
    if (!this.summoned || !this.alive) return;

    const p = ctx.player;
    const nearestEnemy = this.findAttackTarget(ctx.entities);

    // 意図決定: 攻撃圏内に敵 → attack / 主人公と離れすぎ → regroup / それ以外 → follow
    if (nearestEnemy) {
      this.intent = 'attack';
      this.moveToward(nearestEnemy.x, nearestEnemy.z, dt, ctx, GEN_ATTACK_RANGE * 0.6);
      return;
    }

    const dx = p.x - this.x;
    const dz = p.z - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist > GEN_REGROUP_DISTANCE) {
      this.intent = 'regroup';
      this.moveToward(p.x, p.z, dt, ctx, GEN_FOLLOW_DISTANCE);
    } else if (dist > GEN_FOLLOW_DISTANCE) {
      this.intent = 'follow';
      this.moveToward(p.x, p.z, dt, ctx, GEN_FOLLOW_DISTANCE);
    } else {
      // デッドゾーン内: 静止（横滑り防止）
      this.intent = 'follow';
    }
  }

  /** 攻撃圏内(GEN_ATTACK_RANGE)に入った最も近い敵（kind を持つ＝Enemy）を返す。 */
  private findAttackTarget(entities: readonly EntityType[]): EntityType | null {
    let best: EntityType | null = null;
    let bestDist = GEN_ATTACK_RANGE;
    for (const e of entities) {
      if (e === this || !e.alive) continue;
      // 敵判定: Player/Shikigami 以外（kind を持つ Enemy）を敵とみなす
      if ((e as { kind?: string }).kind == null) continue;
      const d = Math.hypot(e.x - this.x, e.z - this.z);
      if (d <= bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  /** 目標へ stopDistance を残して接近（オーバーシュートしない）。 */
  private moveToward(
    tx: number,
    tz: number,
    dt: number,
    ctx: UpdateContext,
    stopDistance: number,
  ): void {
    const dx = tx - this.x;
    const dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    const travel = Math.min(GEN_MOVE_SPEED * dt, Math.max(0, dist - stopDistance));
    if (travel <= 1e-6 || dist <= 1e-6) return;
    const nx = dx / dist;
    const nz = dz / dist;
    const resolved = ctx.collide(this.x + nx * travel, this.z + nz * travel, this.radius);
    this.x = resolved.x;
    this.z = resolved.z;
    this.facing = facingFromVector(nx, nz);
  }
}
