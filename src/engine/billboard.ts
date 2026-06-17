import * as THREE from 'three';
import { CAMERA_PITCH_DEG, CAMERA_YAW_DEG } from '../config';
import type { Facing } from '../types';
import { footScreenDepth as computeFootScreenDepth } from './depth-sort';

export interface BillboardOptions {
  texture: THREE.Texture;
  worldSize: { w: number; h: number };
  blend?: 'normal' | 'add';
}

let nextBillboardId = 1;

export class BillboardSprite {
  readonly id: number;
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly texture: THREE.Texture;
  private readonly framesPerRow: number;

  constructor(opts: BillboardOptions) {
    this.id = nextBillboardId;
    nextBillboardId += 1;
    this.texture = opts.texture;
    this.framesPerRow = textureFramesPerRow(opts.texture);

    const geometry = new THREE.PlaneGeometry(opts.worldSize.w, opts.worldSize.h);
    geometry.translate(0, opts.worldSize.h / 2, 0);

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.5,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: opts.blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending,
      fog: false,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.order = 'YXZ';
    this.mesh.rotation.set(
      THREE.MathUtils.degToRad(CAMERA_PITCH_DEG),
      THREE.MathUtils.degToRad(CAMERA_YAW_DEG),
      0,
    );
    this.mesh.frustumCulled = false;
    this.setFacing('down');
    this.setFrame(0);
  }

  setPosition(x: number, z: number, y = 0): void {
    this.mesh.position.set(x, y, z);
  }

  setFacing(facing: Facing): void {
    this.mesh.scale.x = facing === 'right' ? -1 : 1;
  }

  setFrame(frame: number): void {
    const col = ((frame % this.framesPerRow) + this.framesPerRow) % this.framesPerRow;
    this.texture.repeat.set(1 / this.framesPerRow, 1);
    this.texture.offset.x = col / this.framesPerRow;
    this.texture.needsUpdate = true;
  }

  footScreenDepth(camera: THREE.Camera): number {
    return computeFootScreenDepth(
      camera,
      this.mesh.position.x,
      this.mesh.position.z,
      this.mesh.position.y,
    );
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

function textureFramesPerRow(texture: THREE.Texture): number {
  const value = texture.userData['framesPerRow'];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.floor(value));
}
