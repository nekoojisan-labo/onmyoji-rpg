import { Entity } from './entity';
import type { UpdateContext } from './manager';
import type { Element } from '../types';
import type { Stats } from '../combat/stats';
import { isChinkonWindowOpen } from '../combat/chinkon';
import { facingFromVector } from './facing-util';
import {
  ONIBIDOJI_SIGHT_RANGE,
  ONIBIDOJI_SENSE_RANGE,
  ONIBIDOJI_ATTACK_RANGE,
  ONIBIDOJI_MOVE_SPEED,
  ONIBIDOJI_LEASH_RANGE,
  ONIBIDOJI_ATTACK_WINDUP_SEC,
  ONIBIDOJI_RECOVER_SEC,
  ONIBIDOJI_HURT_SEC,
} from '../config';

export type EnemyAiState =
  | 'idle' | 'alert' | 'chase' | 'attack' | 'recover' | 'hurt' | 'down';

/** 敵「鬼火童子」（火）。索敵→接近→攻撃のステートマシンで動く。 */
export class Enemy extends Entity {
  readonly kind: 'onibidoji' = 'onibidoji';
  aiState: EnemyAiState;
  hasMiren: boolean;
  sightRange: number;
  senseRange: number;
  leashOrigin: { x: number; z: number };

  /** 現状態の経過時間（秒）。状態遷移ごとにリセット。 */
  private stateTimer = 0;
  /** 直近 update で観測した hp（被弾検知用）。 */
  private lastHp: number;

  constructor(init: { x: number; z: number; element: Element; baseStats: Stats; radius?: number }) {
    super(init);
    this.aiState = 'idle';
    this.hasMiren = true; // 鬼火童子は鎮魂対象（未練持ち）が既定
    this.sightRange = ONIBIDOJI_SIGHT_RANGE;
    this.senseRange = ONIBIDOJI_SENSE_RANGE;
    this.leashOrigin = { x: init.x, z: init.z };
    this.lastHp = this.hp;
  }

  update(dt: number, ctx: UpdateContext): void {
    // 死亡: 最優先で down 固定
    if (!this.alive) {
      this.setState('down');
      this.lastHp = this.hp;
      return;
    }

    // 被弾検知: 前フレームより hp が減っていたら hurt へ（down/既hurt以外）
    if (this.hp < this.lastHp && this.aiState !== 'hurt') {
      this.setState('hurt');
    }
    this.lastHp = this.hp;

    this.stateTimer += dt;
    const p = ctx.player;
    const dist = Math.hypot(p.x - this.x, p.z - this.z);
    const leashDist = Math.hypot(p.x - this.leashOrigin.x, p.z - this.leashOrigin.z);

    switch (this.aiState) {
      case 'idle': {
        if (this.canPerceive(dist)) this.setState('alert');
        break;
      }
      case 'alert': {
        this.faceTarget(p.x, p.z);
        if (!this.canPerceive(dist)) {
          this.setState('idle');
        } else if (this.stateTimer >= ONIBIDOJI_ATTACK_WINDUP_SEC) {
          if (dist <= ONIBIDOJI_ATTACK_RANGE) {
            this.setState('attack');
          } else {
            // 予兆明け→追跡開始。同tickで一歩寄る（次フレームまで止まらない）
            this.setState('chase');
            this.moveToward(p.x, p.z, dt, ctx);
          }
        }
        break;
      }
      case 'chase': {
        if (leashDist > ONIBIDOJI_LEASH_RANGE) {
          this.setState('idle');
          break;
        }
        if (dist <= ONIBIDOJI_ATTACK_RANGE) {
          this.setState('attack');
          break;
        }
        this.moveToward(p.x, p.z, dt, ctx);
        break;
      }
      case 'attack': {
        // 攻撃発生（実ヒット判定は G7 actions が担う）。即 recover へ移行
        this.faceTarget(p.x, p.z);
        this.setState('recover');
        break;
      }
      case 'recover': {
        if (this.stateTimer >= ONIBIDOJI_RECOVER_SEC) {
          this.setState(this.nextAfterIdleCheck(dist));
        }
        break;
      }
      case 'hurt': {
        if (this.stateTimer >= ONIBIDOJI_HURT_SEC) {
          this.setState(this.nextAfterIdleCheck(dist));
        }
        break;
      }
      case 'down':
        break;
    }
  }

  /** 鎮魂窓（HP30%以下 && hasMiren）。契約 §4.7 の純ロジックへ委譲。 */
  chinkonWindowOpen(): boolean {
    return isChinkonWindowOpen(this.hp, this.maxHp, this.hasMiren);
  }

  /** 視界（前方広め）or 感知（近接全方位）に主人公が入っているか。 */
  private canPerceive(dist: number): boolean {
    return dist <= this.sightRange || dist <= this.senseRange;
  }

  /** 行動明け（recover/hurt 後）の次状態を距離から決める。 */
  private nextAfterIdleCheck(dist: number): EnemyAiState {
    if (!this.canPerceive(dist)) return 'idle';
    if (dist <= ONIBIDOJI_ATTACK_RANGE) return 'attack';
    return 'chase';
  }

  private moveToward(tx: number, tz: number, dt: number, ctx: UpdateContext): void {
    const dx = tx - this.x;
    const dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 1e-6) return;
    const nx = dx / dist;
    const nz = dz / dist;
    const travel = Math.min(ONIBIDOJI_MOVE_SPEED * dt, dist);
    const resolved = ctx.collide(this.x + nx * travel, this.z + nz * travel, this.radius);
    this.x = resolved.x;
    this.z = resolved.z;
    this.facing = facingFromVector(nx, nz);
  }

  private faceTarget(tx: number, tz: number): void {
    const dx = tx - this.x;
    const dz = tz - this.z;
    if (Math.hypot(dx, dz) <= 1e-6) return;
    this.facing = facingFromVector(dx, dz);
  }

  private setState(next: EnemyAiState): void {
    if (this.aiState === next) return;
    this.aiState = next;
    this.stateTimer = 0;
  }
}
