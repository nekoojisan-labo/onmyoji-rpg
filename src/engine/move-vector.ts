import type { Facing } from '../types';

export interface MoveVector {
  moveX: number;
  moveZ: number;
}

export function normalizeMove(rawX: number, rawZ: number): MoveVector {
  const len = Math.hypot(rawX, rawZ);
  if (len <= 1e-6) {
    return { moveX: 0, moveZ: 0 };
  }
  if (len <= 1) {
    return { moveX: rawX, moveZ: rawZ };
  }
  return { moveX: rawX / len, moveZ: rawZ / len };
}

export function facingFromMove(moveX: number, moveZ: number, fallback: Facing): Facing {
  if (Math.abs(moveX) <= 1e-6 && Math.abs(moveZ) <= 1e-6) {
    return fallback;
  }
  if (Math.abs(moveX) >= Math.abs(moveZ)) {
    return moveX >= 0 ? 'right' : 'left';
  }
  return moveZ >= 0 ? 'down' : 'up';
}
