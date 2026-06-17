import { describe, it, expect } from 'vitest';
import { resolveHits } from '../src/combat-runtime/resolve';
import type { AttackSpec, HitTarget } from '../src/combat-runtime/resolve';

// rng=()=>0.5 で random(0.95,1.05) の中央=1.0 → 算術が安定
const mid = () => 0.5;

describe('resolveHits', () => {
  const baseSpec: AttackSpec = {
    origin: { x: 0, z: 0 },
    facingDir: { x: 1, z: 0 },
    shape: 'fan',
    range: 5,
    arcDeg: 90,
    skillMul: 1.0,
    atkStat: 100, // 体100
    isMagic: false,
    rng: mid,
  };

  it('扇内の target のみ返す（射程外/角度外は除外）', () => {
    const targets: HitTarget[] = [
      { pos: { x: 3, z: 0 }, radius: 0.5, defenderGo: 0 },   // 正面・射程内 → ヒット
      { pos: { x: 8, z: 0 }, radius: 0.5, defenderGo: 0 },   // 射程外 → 除外
      { pos: { x: -3, z: 0 }, radius: 0.5, defenderGo: 0 },  // 背後 → 除外
    ];
    const hits = resolveHits(baseSpec, targets);
    expect(hits.map((h) => h.index)).toEqual([0]);
  });

  it('護による軽減を反映（体100×1.0×100/(100+100)=50→floor50）', () => {
    const targets: HitTarget[] = [{ pos: { x: 2, z: 0 }, radius: 0.5, defenderGo: 100 }];
    const hits = resolveHits(baseSpec, targets);
    expect(hits[0]!.damage).toBe(50);
  });

  it('五行相克（fire→metal ×1.25）が乗る（体100→防御後100→×1.25=125）', () => {
    const spec: AttackSpec = { ...baseSpec, attackerElement: 'fire' };
    const targets: HitTarget[] = [
      { pos: { x: 2, z: 0 }, radius: 0.5, defenderGo: 0, defenderElement: 'metal' },
    ];
    const hits = resolveHits(spec, targets);
    expect(hits[0]!.damage).toBe(125);
  });

  it('矩形シェイプで判定できる', () => {
    const spec: AttackSpec = {
      ...baseSpec,
      shape: 'rect',
      rect: { x: 2, z: 0, w: 4, h: 2 }, // x∈[0,4], z∈[-1,1]
    };
    const targets: HitTarget[] = [
      { pos: { x: 3, z: 0 }, radius: 0.5, defenderGo: 0 },   // 矩形内
      { pos: { x: 10, z: 0 }, radius: 0.5, defenderGo: 0 },  // 矩形外
    ];
    const hits = resolveHits(spec, targets);
    expect(hits.map((h) => h.index)).toEqual([0]);
  });

  it('呪術（isMagic）は術力基礎で計算（術力100×1.4=140→護0→140）', () => {
    const spec: AttackSpec = { ...baseSpec, isMagic: true, atkStat: 100, skillMul: 1.4 };
    const targets: HitTarget[] = [{ pos: { x: 2, z: 0 }, radius: 0.5, defenderGo: 0 }];
    const hits = resolveHits(spec, targets);
    expect(hits[0]!.damage).toBe(140);
  });

  it('何も当たらなければ空配列', () => {
    const targets: HitTarget[] = [{ pos: { x: 100, z: 100 }, radius: 0.5, defenderGo: 0 }];
    expect(resolveHits(baseSpec, targets)).toEqual([]);
  });
});
