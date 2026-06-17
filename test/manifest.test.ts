import { describe, expect, it } from 'vitest';
import { PLACEHOLDERS, type PlaceholderDef } from '../src/assets/manifest';

describe('PLACEHOLDERS', () => {
  it('凪沙/玄/鬼火童子の3キーを持つ', () => {
    expect(Object.keys(PLACEHOLDERS).sort()).toEqual(['en_onibidoji', 'pc_nagisa', 'sk_gen']);
  });

  it('各 def の id がキーと一致する', () => {
    for (const [key, def] of Object.entries(PLACEHOLDERS)) {
      expect((def as PlaceholderDef).id).toBe(key);
    }
  });

  it('color は 0x000000..0xFFFFFF の範囲に収まる', () => {
    for (const def of Object.values(PLACEHOLDERS)) {
      expect(def.color).toBeGreaterThanOrEqual(0x000000);
      expect(def.color).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('worldSize は正の幅・高さを持つ', () => {
    for (const def of Object.values(PLACEHOLDERS)) {
      expect(def.worldSize.w).toBeGreaterThan(0);
      expect(def.worldSize.h).toBeGreaterThan(0);
    }
  });

  it('3キーで色が重複しない', () => {
    const colors = Object.values(PLACEHOLDERS).map((def) => def.color);

    expect(new Set(colors).size).toBe(colors.length);
  });
});
