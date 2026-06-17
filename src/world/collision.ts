import type { Rect, Vec2 } from '../types';

const EPSILON = 1e-6;

function halfW(rect: Rect): number {
  return rect.w / 2;
}

function halfH(rect: Rect): number {
  return rect.h / 2;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }
  return Math.max(min, Math.min(value, max));
}

export function circleIntersectsRect(x: number, z: number, r: number, rect: Rect): boolean {
  const hw = halfW(rect);
  const hh = halfH(rect);
  const nearestX = clamp(x, rect.x - hw, rect.x + hw);
  const nearestZ = clamp(z, rect.z - hh, rect.z + hh);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < r * r;
}

export function resolveCircleRect(x: number, z: number, r: number, rect: Rect): Vec2 {
  if (!circleIntersectsRect(x, z, r, rect)) {
    return { x, z };
  }

  const hw = halfW(rect);
  const hh = halfH(rect);
  const minX = rect.x - hw;
  const maxX = rect.x + hw;
  const minZ = rect.z - hh;
  const maxZ = rect.z + hh;
  const nearestX = clamp(x, minX, maxX);
  const nearestZ = clamp(z, minZ, maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq > EPSILON * EPSILON) {
    const dist = Math.sqrt(distSq);
    const push = r - dist;
    return {
      x: x + (dx / dist) * push,
      z: z + (dz / dist) * push,
    };
  }

  const penLeft = x - minX + r;
  const penRight = maxX - x + r;
  const penUp = z - minZ + r;
  const penDown = maxZ - z + r;
  const minPen = Math.min(penLeft, penRight, penUp, penDown);

  if (minPen === penLeft) return { x: minX - r, z };
  if (minPen === penRight) return { x: maxX + r, z };
  if (minPen === penUp) return { x, z: minZ - r };
  return { x, z: maxZ + r };
}

export function clampToMapBounds(x: number, z: number, r: number, bounds: Rect): Vec2 {
  const hw = halfW(bounds);
  const hh = halfH(bounds);
  const minX = bounds.x - hw + r;
  const maxX = bounds.x + hw - r;
  const minZ = bounds.z - hh + r;
  const maxZ = bounds.z + hh - r;
  return {
    x: clamp(x, minX, maxX),
    z: clamp(z, minZ, maxZ),
  };
}

export function resolveCollision(
  x: number, z: number, radius: number,
  blockers: readonly Rect[], bounds: Rect,
): Vec2 {
  const original = clampToMapBounds(x, z, radius, bounds);
  let px = original.x;
  let pz = original.z;

  for (const rect of blockers) {
    const next = resolveCircleRect(px, pz, radius, rect);
    px = next.x;
    pz = next.z;
  }

  const resolved = clampToMapBounds(px, pz, radius, bounds);
  if (isClear(resolved.x, resolved.z, radius, blockers)) {
    return resolved;
  }

  return nearestClearCandidate(original.x, original.z, radius, blockers, bounds) ?? resolved;
}

function isClear(x: number, z: number, radius: number, blockers: readonly Rect[]): boolean {
  return blockers.every((rect) => !circleIntersectsRect(x, z, radius, rect));
}

function nearestClearCandidate(
  x: number,
  z: number,
  radius: number,
  blockers: readonly Rect[],
  bounds: Rect,
): Vec2 | null {
  let best: Vec2 | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const rect of blockers) {
    if (!circleIntersectsRect(x, z, radius, rect)) {
      continue;
    }
    for (const candidate of candidatePositions(x, z, radius, rect)) {
      const clamped = clampToMapBounds(candidate.x, candidate.z, radius, bounds);
      if (!isClear(clamped.x, clamped.z, radius, blockers)) {
        continue;
      }
      const dx = clamped.x - x;
      const dz = clamped.z - z;
      const distSq = dx * dx + dz * dz;
      if (distSq < bestDistSq) {
        best = clamped;
        bestDistSq = distSq;
      }
    }
  }

  return best;
}

function candidatePositions(x: number, z: number, radius: number, rect: Rect): Vec2[] {
  const hw = halfW(rect);
  const hh = halfH(rect);
  const minX = rect.x - hw;
  const maxX = rect.x + hw;
  const minZ = rect.z - hh;
  const maxZ = rect.z + hh;
  const candidates: Vec2[] = [
    { x: minX - radius, z },
    { x: maxX + radius, z },
    { x, z: minZ - radius },
    { x, z: maxZ + radius },
  ];

  const nearestX = clamp(x, minX, maxX);
  const nearestZ = clamp(z, minZ, maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  const dist = Math.hypot(dx, dz);
  if (dist > EPSILON) {
    candidates.push({
      x: nearestX + (dx / dist) * radius,
      z: nearestZ + (dz / dist) * radius,
    });
  }

  return candidates;
}
