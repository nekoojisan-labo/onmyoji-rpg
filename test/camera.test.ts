import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { IsoCamera } from '../src/engine/camera';
import {
  CAMERA_DEADZONE_X,
  CAMERA_FOLLOW_LERP,
  CAMERA_FAR,
  CAMERA_NEAR,
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from '../src/config';

describe('IsoCamera yaw45/pitch30 fixed orthographic', () => {
  it('creates an OrthographicCamera', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);
    expect(cam.camera).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('uses contract near/far', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);
    expect(cam.camera.near).toBe(CAMERA_NEAR);
    expect(cam.camera.far).toBe(CAMERA_FAR);
  });

  it('frustum width matches viewWorldWidth and height respects aspect', () => {
    const aspect = 16 / 9;
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, aspect);
    const width = cam.camera.right - cam.camera.left;
    const height = cam.camera.top - cam.camera.bottom;
    expect(width).toBeCloseTo(CAMERA_VIEW_WORLD_WIDTH, 6);
    expect(width / height).toBeCloseTo(aspect, 6);
  });

  it('view direction is the classic iso yaw45/pitch30 angle', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);
    const dir = new THREE.Vector3();
    cam.camera.getWorldDirection(dir);
    expect(dir.y).toBeCloseTo(-Math.sin(THREE.MathUtils.degToRad(30)), 5);
    const horiz = Math.hypot(dir.x, dir.z);
    expect(horiz).toBeCloseTo(Math.cos(THREE.MathUtils.degToRad(30)), 5);
    expect(Math.abs(dir.x)).toBeCloseTo(Math.abs(dir.z), 5);
  });

  it('follow pans the camera without rotating', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);
    const beforeQuat = cam.camera.quaternion.clone();
    const dirBefore = new THREE.Vector3();
    cam.camera.getWorldDirection(dirBefore);

    cam.follow(10, -4);

    const dirAfter = new THREE.Vector3();
    cam.camera.getWorldDirection(dirAfter);
    expect(dirAfter.angleTo(dirBefore)).toBeCloseTo(0, 5);
    expect(cam.camera.quaternion.angleTo(beforeQuat)).toBeCloseTo(0, 5);
    expect(cam.camera.position.length()).toBeGreaterThan(0);
  });

  it('follow keeps the camera still inside the dead zone and lerps outside it', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);

    cam.follow(CAMERA_DEADZONE_X * 0.5, 0);
    expect(recoverFocus(cam).x).toBeCloseTo(0, 9);

    cam.follow(CAMERA_DEADZONE_X + 1, 0);
    const focus = recoverFocus(cam);
    expect(focus.x).toBeGreaterThan(0);
    expect(focus.x).toBeLessThan(1);
  });

  it('resize updates frustum height to keep aspect, width unchanged', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, 16 / 9);
    cam.resize(4 / 3);
    const width = cam.camera.right - cam.camera.left;
    const height = cam.camera.top - cam.camera.bottom;
    expect(width).toBeCloseTo(CAMERA_VIEW_WORLD_WIDTH, 6);
    expect(width / height).toBeCloseTo(4 / 3, 6);
  });
});

describe('IsoCamera applyPixelSnap', () => {
  it('snaps the focus point to internal-resolution pixel grid', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
    const worldPerPixel = CAMERA_VIEW_WORLD_WIDTH / INTERNAL_WIDTH;
    const subPixel = worldPerPixel * 0.4;

    cam.follow(subPixel, -subPixel);
    cam.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);

    const focus = recoverFocus(cam);
    expectOnGrid(focus.x, worldPerPixel);
    expectOnGrid(focus.z, worldPerPixel);
    expect(focus.x).toBeCloseTo(0, 9);
    expect(focus.z).toBeCloseTo(0, 9);
  });

  it('snaps to the nearest pixel for a value above half a pixel', () => {
    const cam = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
    const worldPerPixel = CAMERA_VIEW_WORLD_WIDTH / INTERNAL_WIDTH;
    const targetX = CAMERA_DEADZONE_X + (worldPerPixel * 1.6) / CAMERA_FOLLOW_LERP;

    cam.follow(targetX, 0);
    cam.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);

    const focus = recoverFocus(cam);
    expect(focus.x).toBeCloseTo(worldPerPixel * 2, 9);
  });
});

function recoverFocus(cam: IsoCamera): { x: number; z: number } {
  const yaw = THREE.MathUtils.degToRad(45);
  const pitch = THREE.MathUtils.degToRad(30);
  const forward = new THREE.Vector3(
    Math.cos(pitch) * Math.sin(yaw),
    -Math.sin(pitch),
    Math.cos(pitch) * Math.cos(yaw),
  ).normalize();
  const pos = cam.camera.position;
  return {
    x: pos.x + forward.x * 100,
    z: pos.z + forward.z * 100,
  };
}

function expectOnGrid(value: number, unit: number): void {
  const ratio = value / unit;
  expect(Math.abs(ratio - Math.round(ratio))).toBeLessThan(1e-6);
}
