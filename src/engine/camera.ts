// OrthographicCamera を yaw45/pitch30 固定生成し、追従pan・ピクセルスナップ・境界クランプを担う。

import * as THREE from 'three';
import {
  CAMERA_DEADZONE_X,
  CAMERA_FAR,
  CAMERA_FOLLOW_LERP,
  CAMERA_NEAR,
  CAMERA_PITCH_DEG,
  CAMERA_YAW_DEG,
  CAMERA_DEADZONE_Z,
} from '../config';
import type { Rect } from '../types';

const CAMERA_DISTANCE = 100;

export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  private viewWorldWidth: number;
  private targetCenterX = 0;
  private targetCenterZ = 0;
  private snapOffsetX = 0;
  private snapOffsetZ = 0;
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
    this.applyPlacement(this.targetCenterX, this.targetCenterZ);
  }

  follow(targetX: number, targetZ: number): void {
    const dx = targetX - this.targetCenterX;
    const dz = targetZ - this.targetCenterZ;
    let desiredX = this.targetCenterX;
    let desiredZ = this.targetCenterZ;

    if (Math.abs(dx) > CAMERA_DEADZONE_X) {
      desiredX = targetX - Math.sign(dx) * CAMERA_DEADZONE_X;
    }
    if (Math.abs(dz) > CAMERA_DEADZONE_Z) {
      desiredZ = targetZ - Math.sign(dz) * CAMERA_DEADZONE_Z;
    }

    this.targetCenterX += (desiredX - this.targetCenterX) * CAMERA_FOLLOW_LERP;
    this.targetCenterZ += (desiredZ - this.targetCenterZ) * CAMERA_FOLLOW_LERP;
    this.snapOffsetX = 0;
    this.snapOffsetZ = 0;
    this.applyPlacement(this.targetCenterX, this.targetCenterZ);
  }

  clampToBounds(bounds: Rect): void {
    const halfViewW = this.viewWorldWidth / 2;
    const aspect = (this.camera.right - this.camera.left) / (this.camera.top - this.camera.bottom);
    const halfViewH = halfViewW / aspect;
    const minX = bounds.x - bounds.w / 2;
    const maxX = bounds.x + bounds.w / 2;
    const minZ = bounds.z - bounds.h / 2;
    const maxZ = bounds.z + bounds.h / 2;
    const focusMinX = minX + halfViewW;
    const focusMaxX = maxX - halfViewW;
    const focusMinZ = minZ + halfViewH;
    const focusMaxZ = maxZ - halfViewH;

    this.targetCenterX = focusMinX > focusMaxX
      ? bounds.x
      : THREE.MathUtils.clamp(this.targetCenterX, focusMinX, focusMaxX);
    this.targetCenterZ = focusMinZ > focusMaxZ
      ? bounds.z
      : THREE.MathUtils.clamp(this.targetCenterZ, focusMinZ, focusMaxZ);
    this.applyPlacement(this.targetCenterX + this.snapOffsetX, this.targetCenterZ + this.snapOffsetZ);
  }

  applyPixelSnap(internalWidth: number, internalHeight: number): void {
    const aspect = (this.camera.right - this.camera.left) / (this.camera.top - this.camera.bottom);
    const viewWorldHeight = this.viewWorldWidth / aspect;
    const worldPerPixelX = this.viewWorldWidth / internalWidth;
    const worldPerPixelZ = viewWorldHeight / internalHeight;
    const snappedX = Math.round(this.targetCenterX / worldPerPixelX) * worldPerPixelX;
    const snappedZ = Math.round(this.targetCenterZ / worldPerPixelZ) * worldPerPixelZ;
    this.snapOffsetX = snappedX - this.targetCenterX;
    this.snapOffsetZ = snappedZ - this.targetCenterZ;
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
