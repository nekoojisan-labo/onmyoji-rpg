import * as THREE from 'three';

export interface GridOptions {
  size: number;
  divisions: number;
  color?: number;
  centerColor?: number;
}

const DEFAULTS: Required<GridOptions> = {
  size: 40,
  divisions: 40,
  color: 0x2a3344,
  centerColor: 0x3b82f6,
};

export function createGrid(opts: Partial<GridOptions> = {}): THREE.GridHelper {
  const options: Required<GridOptions> = { ...DEFAULTS, ...opts };
  const grid = new THREE.GridHelper(
    options.size,
    options.divisions,
    options.centerColor,
    options.color,
  );
  grid.position.set(0, 0, 0);
  return grid;
}
