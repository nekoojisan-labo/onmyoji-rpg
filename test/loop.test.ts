import { describe, it, expect } from 'vitest';
import { FIXED_DT, GameLoop } from '../src/engine/loop';

describe('FIXED_DT', () => {
  it('is 1/60 second', () => {
    expect(FIXED_DT).toBeCloseTo(1 / 60, 12);
  });
});

describe('GameLoop fixed timestep accumulator', () => {
  it('calls update exactly once per fixed step', () => {
    let updates = 0;
    const loop = new GameLoop(() => {
      updates += 1;
    }, () => {});
    loop.stepForElapsed(FIXED_DT);
    expect(updates).toBe(1);
  });

  it('calls update zero times when elapsed below one step', () => {
    let updates = 0;
    const loop = new GameLoop(() => {
      updates += 1;
    }, () => {});
    loop.stepForElapsed(FIXED_DT / 2);
    expect(updates).toBe(0);
  });

  it('catches up multiple steps and carries the remainder', () => {
    let updates = 0;
    let lastAlpha = -1;
    const loop = new GameLoop(
      () => {
        updates += 1;
      },
      (alpha) => {
        lastAlpha = alpha;
      },
    );
    loop.stepForElapsed(FIXED_DT * 2.5);
    expect(updates).toBe(2);
    expect(lastAlpha).toBeCloseTo(0.5, 6);
  });

  it('accumulates remainder across calls into a later step', () => {
    let updates = 0;
    const loop = new GameLoop(() => {
      updates += 1;
    }, () => {});
    loop.stepForElapsed(FIXED_DT * 0.6);
    expect(updates).toBe(0);
    loop.stepForElapsed(FIXED_DT * 0.6);
    expect(updates).toBe(1);
  });

  it('passes fixed dt to update', () => {
    const seen: number[] = [];
    const loop = new GameLoop((dt) => {
      seen.push(dt);
    }, () => {});
    loop.stepForElapsed(FIXED_DT * 2);
    expect(seen).toEqual([FIXED_DT, FIXED_DT]);
  });

  it('clamps a huge elapsed to avoid spiral of death', () => {
    let updates = 0;
    const loop = new GameLoop(() => {
      updates += 1;
    }, () => {});
    loop.stepForElapsed(10);
    expect(updates).toBeLessThanOrEqual(5);
    expect(updates).toBeGreaterThan(0);
  });
});
