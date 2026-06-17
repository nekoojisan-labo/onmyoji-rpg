// module: combat-runtime/resolve | 形状ヒット集計＋ダメージ算出（純関数・副作用なし）
// actions.ts はこの結果を Entity へ適用する薄いアダプタになる。
import type { Vec2, Rect, Element } from '../types';
import { circleHit, fanHit, rectHit } from './hitbox';
import { computeDamage } from '../combat/damage';

export interface AttackSpec {
  origin: Vec2;
  facingDir: Vec2;
  shape: 'fan' | 'rect' | 'circle';
  range: number;
  arcDeg: number;
  rect?: Rect;
  skillMul: number;
  atkStat: number;
  isMagic: boolean;
  attackerElement?: Element;
  critRate?: number;
  critMul?: number;
  rng?: () => number;
}

export interface HitTarget {
  pos: Vec2;
  radius: number;
  defenderGo: number;
  defenderElement?: Element;
}

export interface ResolvedHit {
  index: number;
  damage: number;
}

// spec の形状で当たった target の index とダメージを返す。被弾適用は呼び出し側。
export function resolveHits(spec: AttackSpec, targets: readonly HitTarget[]): ResolvedHit[] {
  const result: ResolvedHit[] = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]!; // i は length 内なので有効（noUncheckedIndexedAccess 対応）
    const inside = shapeHit(spec, t.pos, t.radius);
    if (!inside) continue;
    const damage = computeDamage(spec.atkStat, {
      skillMul: spec.skillMul,
      defenderGo: t.defenderGo,
      attackerElement: spec.attackerElement,
      defenderElement: t.defenderElement,
      isMagic: spec.isMagic,
      critRate: spec.critRate,
      critMul: spec.critMul,
      rng: spec.rng,
    });
    result.push({ index: i, damage });
  }
  return result;
}

function shapeHit(spec: AttackSpec, pos: Vec2, radius: number): boolean {
  switch (spec.shape) {
    case 'fan':
      return fanHit(spec.origin, spec.facingDir, spec.range, spec.arcDeg, pos, radius);
    case 'circle':
      return circleHit(spec.origin, spec.range, pos, radius);
    case 'rect':
      if (!spec.rect) return false;
      return rectHit(spec.rect, pos, radius);
    default:
      return false;
  }
}
