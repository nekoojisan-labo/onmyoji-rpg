import type { Facing } from '../types';

/** 正規化済み移動ベクトル(nx,nz)を4方向 facing へ丸める。水平優勢→left/right、垂直優勢→up/down。 */
export function facingFromVector(nx: number, nz: number): Facing {
  if (Math.abs(nx) >= Math.abs(nz)) {
    return nx >= 0 ? 'right' : 'left';
  }
  return nz >= 0 ? 'down' : 'up';
}
