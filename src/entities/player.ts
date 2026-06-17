import { Entity } from './entity';
import type { UpdateContext } from './manager';
import type { InputState } from '../engine/input';
import type { Element } from '../types';
import type { Stats } from '../combat/stats';
import { moveSpeed } from '../combat/stats';
import { KegareGauge } from '../combat/kegare';
import {
  BASE_MOVE_SPEED,
  IFRAME_TOTAL_SEC,
  IFRAME_ACTIVE_FROM_SEC,
  IFRAME_ACTIVE_TO_SEC,
} from '../config';
import { facingFromVector } from './facing-util';

export type PlayerAction =
  | 'idle' | 'move' | 'fuda' | 'cast' | 'summon' | 'chinkon' | 'dodge' | 'hit' | 'down';

/** 主人公「凪沙」。入力→アクション状態・移動・回避i-frame を司る。 */
export class Player extends Entity {
  ki: number;
  maxKi: number;
  action: PlayerAction;
  iFrameUntilMs: number;
  level: number;
  exp: number;
  kegare: KegareGauge;

  /** 無敵窓の絶対開始（ms）。i-frame中以外は 0。 */
  private iFrameFromMs = 0;
  /** 当フレームの入力（setInput で外部から供給）。 */
  private input: InputState | null = null;

  constructor(init: { x: number; z: number; element: Element; baseStats: Stats; radius?: number }) {
    super(init);
    this.maxKi = init.baseStats.ki;
    this.ki = init.baseStats.ki;
    this.action = 'idle';
    this.iFrameUntilMs = 0;
    this.level = 1;
    this.exp = 0;
    this.kegare = new KegareGauge(0);
  }

  /** 当フレームの入力を供給する（Game ループが update 前に呼ぶ）。 */
  setInput(input: InputState): void {
    this.input = input;
  }

  update(dt: number, ctx: UpdateContext): void {
    if (!this.alive) {
      this.action = 'down';
      return;
    }
    const inp = this.input;
    if (!inp) {
      this.action = 'idle';
      return;
    }

    // 回避（最優先・i-frame窓を設定）
    if (inp.dodge) {
      this.action = 'dodge';
      this.iFrameFromMs = ctx.nowMs;
      this.iFrameUntilMs = ctx.nowMs + Math.round(IFRAME_TOTAL_SEC * 1000);
    }

    // 移動（斜めを正規化 → 速くならない）
    const len = Math.hypot(inp.moveX, inp.moveZ);
    if (len > 1e-6) {
      const nx = inp.moveX / len;
      const nz = inp.moveZ / len;
      const speed = moveSpeed(this.baseStats.spd, BASE_MOVE_SPEED);
      const wantX = this.x + nx * speed * dt;
      const wantZ = this.z + nz * speed * dt;
      const resolved = ctx.collide(wantX, wantZ, this.radius);
      this.x = resolved.x;
      this.z = resolved.z;
      this.facing = facingFromVector(nx, nz);
      if (this.action !== 'dodge') this.action = 'move';
    } else if (this.action !== 'dodge') {
      this.action = 'idle';
    }

    this.input = null;
  }

  /** i-frame 窓（active-from..active-to のサブ区間）内なら true。 */
  isInvincible(nowMs: number): boolean {
    if (this.iFrameUntilMs === 0) return false;
    const activeFrom = this.iFrameFromMs + IFRAME_ACTIVE_FROM_SEC * 1000;
    const activeTo = this.iFrameFromMs + IFRAME_ACTIVE_TO_SEC * 1000;
    return nowMs >= activeFrom && nowMs <= activeTo;
  }
}
