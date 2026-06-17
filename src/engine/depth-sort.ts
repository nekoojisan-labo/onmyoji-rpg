import * as THREE from 'three';

export interface DepthSortable {
  readonly id: number;
  footScreenDepth(camera: THREE.Camera): number;
  readonly mesh: { renderOrder: number };
}

const footPoint = new THREE.Vector3();

export function footScreenDepth(camera: THREE.Camera, x: number, z: number, y = 0): number {
  footPoint.set(x, y, z);
  footPoint.applyMatrix4(camera.matrixWorldInverse);
  return footPoint.z;
}

export function sortByDepth<T extends DepthSortable>(children: readonly T[], camera: THREE.Camera): T[] {
  const decorated = children.map((child) => ({
    child,
    depth: child.footScreenDepth(camera),
  }));

  decorated.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return a.child.id - b.child.id;
  });

  return decorated.map(({ child }, renderOrder) => {
    child.mesh.renderOrder = renderOrder;
    return child;
  });
}
