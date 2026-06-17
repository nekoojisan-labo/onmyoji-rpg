export type ChinkonPhase = 'closed' | 'open' | 'channeling' | 'succeeded' | 'cancelled';

export const CHINKON_HP_RATIO = 0.30;   // HP30%以下で窓が開く（00b §2.4）
export const CHINKON_CHANNEL_SEC = 1.5; // チャネル時間（秒）

// 未練持ち敵に対し鎮魂窓が開くか（HP ≤ maxHp×0.30）
export function isChinkonWindowOpen(hp: number, maxHp: number, hasMiren: boolean): boolean {
  if (!hasMiren) return false;
  return hp <= maxHp * CHINKON_HP_RATIO;
}

export class ChinkonState {
  private readonly _phase: ChinkonPhase;
  private readonly _progress: number; // 0..1

  constructor(phase: ChinkonPhase = 'closed', progress = 0) {
    this._phase = phase;
    this._progress = progress;
  }

  get phase(): ChinkonPhase {
    return this._phase;
  }

  get progress(): number {
    return this._progress;
  }

  // closed→open（窓成立時）
  open(): ChinkonState {
    if (this._phase !== 'closed') return this;
    return new ChinkonState('open', 0);
  }

  // open→channeling
  beginChannel(): ChinkonState {
    if (this._phase !== 'open') return this;
    return new ChinkonState('channeling', 0);
  }

  // channeling中 progress加算。1.0到達でsucceeded。
  tick(dt: number): ChinkonState {
    if (this._phase !== 'channeling') return this;
    const next = this._progress + dt / CHINKON_CHANNEL_SEC;
    if (next >= 1) {
      return new ChinkonState('succeeded', 1);
    }
    return new ChinkonState('channeling', next);
  }

  // 被弾/離脱でchannelingを中断→cancelled
  cancel(): ChinkonState {
    if (this._phase !== 'channeling') return this;
    return new ChinkonState('cancelled', this._progress);
  }
}
