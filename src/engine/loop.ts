// 固定タイムステップの更新ループ。契約 §4.19 の GameLoop / FIXED_DT。

export const FIXED_DT = 1 / 60;

const MAX_STEPS_PER_FRAME = 5;

export class GameLoop {
  private readonly update: (dt: number) => void;
  private readonly render: (alpha: number) => void;
  private accumulator = 0;
  private running = false;
  private rafId = 0;
  private lastMs = 0;

  constructor(update: (dt: number) => void, render: (alpha: number) => void) {
    this.update = update;
    this.render = render;
  }

  stepForElapsed(elapsedSec: number): void {
    this.accumulator += Math.max(0, elapsedSec);
    const maxAccumulated = FIXED_DT * MAX_STEPS_PER_FRAME;
    if (this.accumulator > maxAccumulated) {
      this.accumulator = maxAccumulated;
    }

    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    this.render(this.accumulator / FIXED_DT);
  }

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastMs = performance.now();

    const frame = (nowMs: number): void => {
      if (!this.running) return;
      const elapsedSec = (nowMs - this.lastMs) / 1000;
      this.lastMs = nowMs;
      this.stepForElapsed(elapsedSec);
      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
