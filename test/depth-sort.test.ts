import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { footScreenDepth, sortByDepth, type DepthSortable } from '../src/engine/depth-sort';

function makeIsoCamera(): THREE.OrthographicCamera {
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, -1000, 1000);
  const pitch = THREE.MathUtils.degToRad(30);
  const yaw = THREE.MathUtils.degToRad(45);
  const dist = 50;
  cam.position.set(
    dist * Math.cos(pitch) * Math.sin(yaw),
    dist * Math.sin(pitch),
    dist * Math.cos(pitch) * Math.cos(yaw),
  );
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(true);
  return cam;
}

class FakeSprite implements DepthSortable {
  readonly id: number;
  readonly mesh = { renderOrder: -1 };
  private readonly x: number;
  private readonly z: number;

  constructor(id: number, x: number, z: number) {
    this.id = id;
    this.x = x;
    this.z = z;
  }

  footScreenDepth(camera: THREE.Camera): number {
    return footScreenDepth(camera, this.x, this.z, 0);
  }
}

describe('footScreenDepth', () => {
  it('カメラに近い足元ほど大きい深度値を返す', () => {
    const cam = makeIsoCamera();
    const far = footScreenDepth(cam, -5, -5, 0);
    const near = footScreenDepth(cam, 5, 5, 0);

    expect(near).toBeGreaterThan(far);
  });

  it('同一足元XZでも y が変わると深度が変わる', () => {
    const cam = makeIsoCamera();
    const ground = footScreenDepth(cam, 0, 0, 0);
    const raised = footScreenDepth(cam, 0, 0, 3);

    expect(ground).not.toBe(raised);
    expect(Number.isFinite(ground)).toBe(true);
    expect(Number.isFinite(raised)).toBe(true);
  });
});

describe('sortByDepth', () => {
  it('奥から手前へ並べ renderOrder を 0..n-1 連番付与する', () => {
    const cam = makeIsoCamera();
    const back = new FakeSprite(1, -5, -5);
    const front = new FakeSprite(2, 5, 5);
    const mid = new FakeSprite(3, 0, 0);
    const sorted = sortByDepth([front, back, mid], cam);

    expect(sorted.map((sprite) => sprite.id)).toEqual([1, 3, 2]);
    expect(sorted.at(0)?.mesh.renderOrder).toBe(0);
    expect(sorted.at(1)?.mesh.renderOrder).toBe(1);
    expect(sorted.at(2)?.mesh.renderOrder).toBe(2);
  });

  it('同一深度のときは id 昇順で安定化する', () => {
    const cam = makeIsoCamera();
    const a = new FakeSprite(7, 2, 2);
    const b = new FakeSprite(3, 2, 2);
    const sorted = sortByDepth([a, b], cam);

    expect(sorted.map((sprite) => sprite.id)).toEqual([3, 7]);
  });

  it('元配列を破壊しない', () => {
    const cam = makeIsoCamera();
    const a = new FakeSprite(1, 5, 5);
    const b = new FakeSprite(2, -5, -5);
    const input = [a, b] as const;

    sortByDepth(input, cam);

    expect(input[0].id).toBe(1);
    expect(input[1].id).toBe(2);
  });
});
