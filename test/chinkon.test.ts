import { describe, it, expect } from 'vitest';
import {
  ChinkonState,
  isChinkonWindowOpen,
  CHINKON_HP_RATIO,
  CHINKON_CHANNEL_SEC,
} from '../src/combat/chinkon';

describe('定数', () => {
  it('HP30%・チャネル1.5s', () => {
    expect(CHINKON_HP_RATIO).toBe(0.3);
    expect(CHINKON_CHANNEL_SEC).toBe(1.5);
  });
});

describe('isChinkonWindowOpen', () => {
  it('未練持ち・HP30%ちょうど以下で開く', () => {
    expect(isChinkonWindowOpen(30, 100, true)).toBe(true);
    expect(isChinkonWindowOpen(29, 100, true)).toBe(true);
  });
  it('HP30%超は開かない', () => {
    expect(isChinkonWindowOpen(31, 100, true)).toBe(false);
  });
  it('hasMiren=false は開かない', () => {
    expect(isChinkonWindowOpen(10, 100, false)).toBe(false);
  });
  it('HP0でも未練あれば開く', () => {
    expect(isChinkonWindowOpen(0, 100, true)).toBe(true);
  });
});

describe('ChinkonState state machine（immutable）', () => {
  it('初期は closed・progress 0', () => {
    const s = new ChinkonState();
    expect(s.phase).toBe('closed');
    expect(s.progress).toBe(0);
  });
  it('open: closed→open（新インスタンス・元不変）', () => {
    const s0 = new ChinkonState();
    const s1 = s0.open();
    expect(s0.phase).toBe('closed');
    expect(s1.phase).toBe('open');
    expect(s1).not.toBe(s0);
  });
  it('beginChannel: open→channeling', () => {
    const s = new ChinkonState().open().beginChannel();
    expect(s.phase).toBe('channeling');
    expect(s.progress).toBe(0);
  });
  it('tick: channeling中に progress 加算（dt/1.5）', () => {
    const s = new ChinkonState().open().beginChannel().tick(0.75); // 0.75/1.5 = 0.5
    expect(s.phase).toBe('channeling');
    expect(s.progress).toBeCloseTo(0.5, 6);
  });
  it('tick: progress 1.0到達で succeeded', () => {
    const s = new ChinkonState().open().beginChannel().tick(1.5);
    expect(s.phase).toBe('succeeded');
    expect(s.progress).toBe(1);
  });
  it('tick: 累積で1.0超えても succeeded・progress は1にクランプ', () => {
    const s = new ChinkonState().open().beginChannel().tick(1.0).tick(1.0);
    expect(s.phase).toBe('succeeded');
    expect(s.progress).toBe(1);
  });
  it('cancel: channeling中断→cancelled', () => {
    const s = new ChinkonState().open().beginChannel().tick(0.5).cancel();
    expect(s.phase).toBe('cancelled');
  });
  it('channeling以外でのtickは進まない（open状態は無変化）', () => {
    const s = new ChinkonState().open().tick(1.0);
    expect(s.phase).toBe('open');
    expect(s.progress).toBe(0);
  });
  it('succeeded後のtickは進まない', () => {
    const done = new ChinkonState().open().beginChannel().tick(1.5);
    const after = done.tick(1.0);
    expect(after.phase).toBe('succeeded');
    expect(after.progress).toBe(1);
  });
});
