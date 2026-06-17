// OrthographicCamera を yaw45/pitch30 固定生成し、追従pan・ピクセルスナップ・境界クランプを担う。

import * as THREE from 'three';
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  CAMERA_PITCH_DEG,
  CAMERA_YAW_DEG,
} from '../config';
import type { Rect } from '../types';

const CAMERA_DISTANCE = 100;

export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  private viewWorldWidth: number;
  private targetX = 0;
  private targetZ = 0;
  private readonly forward: THREE.Vector3;

  constructor(viewWorldWidth: number, aspect: number) {
    this.viewWorldWidth = viewWorldWidth;
    const yaw = THREE.MathUtils.degToRad(CAMERA_YAW_DEG);
    const pitch = THREE.MathUtils.degToRad(CAMERA_PITCH_DEG);
    this.forward = new THREE.Vector3(
      Math.cos(pitch) * Math.sin(yaw),
      -Math.sin(pitch),
      Math.cos(pitch) * Math.cos(yaw),
    ).normalize();

    const halfW = viewWorldWidth / 2;
    const halfH = halfW / aspect;
    this.camera = new THREE.OrthographicCamera(
      -halfW,
      halfW,
      halfH,
      -halfH,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.applyPlacement(this.targetX, this.targetZ);
  }

  follow(targetX: number, targetZ: number): void {
    this.targetX = targetX;
    this.targetZ = targetZ;
    this.applyPlacement(this.targetX, this.targetZ);
  }

  clampToBounds(bounds: Rect): void {
    const minX = bounds.x - bounds.w / 2;
    const maxX = bounds.x + bounds.w / 2;
    const minZ = bounds.z - bounds.h / 2;
    const maxZ = bounds.z + bounds.h / 2;
    this.targetX = THREE.MathUtils.clamp(this.targetX, minX, maxX);
    this.targetZ = THREE.MathUtils.clamp(this.targetZ, minZ, maxZ);
    this.applyPlacement(this.targetX, this.targetZ);
  }

  applyPixelSnap(internalWidth: number, internalHeight: number): void {
    void internalHeight;
    const worldPerPixel = this.viewWorldWidth / internalWidth;
    const snappedX = Math.round(this.targetX / worldPerPixel) * worldPerPixel;
    const snappedZ = Math.round(this.targetZ / worldPerPixel) * worldPerPixel;
    this.applyPlacement(snappedX, snappedZ);
  }

  resize(aspect: number): void {
    const halfW = this.viewWorldWidth / 2;
    const halfH = halfW / aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  private applyPlacement(focusX: number, focusZ: number): void {
    const target = new THREE.Vector3(focusX, 0, focusZ);
    this.camera.position.copy(target).addScaledVector(this.forward, -CAMERA_DISTANCE);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(target);
    this.camera.updateMatrixWorld(true);
  }
}
