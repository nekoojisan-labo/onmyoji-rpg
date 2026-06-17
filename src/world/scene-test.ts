import type { Rect, Vec2 } from '../types';
import { resolveCollision } from './collision';

export const SCENE_BLOCKERS: readonly Rect[] = [
  { x: -4, z: -2, w: 2, h: 6 },
  { x: 5, z: 3, w: 4, h: 2 },
];

export const SCENE_BOUNDS: Rect = { x: 0, z: 0, w: 40, h: 40 };

export function createSceneCollide(): (x: number, z: number, radius: number) => Vec2 {
  return (x: number, z: number, radius: number): Vec2 => (
    resolveCollision(x, z, radius, SCENE_BLOCKERS, SCENE_BOUNDS)
  );
}
