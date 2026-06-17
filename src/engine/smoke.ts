import * as THREE from 'three';
import {
  BASE_MOVE_SPEED,
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from '../config';
import { PLACEHOLDERS } from '../assets/manifest';
import type { Facing, Rect } from '../types';
import { BillboardSprite } from './billboard';
import { IsoCamera } from './camera';
import { sortByDepth } from './depth-sort';
import { Input } from './input';
import { GameLoop } from './loop';
import { facingFromMove } from './move-vector';
import { createPlaceholderTexture } from './placeholder';
import { Renderer } from './renderer';
import { moveSpeed } from '../combat/stats';
import { SCENE_BLOCKERS, SCENE_BOUNDS, createSceneCollide } from '../world/scene-test';
import { createGrid } from '../world/grid';

interface SmokePlayerState {
  x: number;
  z: number;
  facing: Facing;
  radius: number;
  spd: number;
}

export function mountSmokeScene(mount: HTMLElement): { dispose(): void } {
  const canvas = document.createElement('canvas');
  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;
  mount.appendChild(canvas);

  const renderer = new Renderer(canvas);
  const camera = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
  camera.follow(0, 0);
  camera.clampToBounds(SCENE_BOUNDS);

  const grid = createGrid({ size: SCENE_BOUNDS.w, divisions: SCENE_BOUNDS.w });
  for (const material of gridMaterials(grid)) {
    material.fog = false;
  }
  renderer.worldGroup.add(grid);
  const blockerMeshes = SCENE_BLOCKERS.map(createBlockerMesh);
  renderer.worldGroup.add(...blockerMeshes);

  const nagisa = createSmokeSprite('pc_nagisa', 0, 0, 'down');
  const gen = createSmokeSprite('sk_gen', -2, -2, 'right');
  const oni = createSmokeSprite('en_onibidoji', 1.5, 2, 'down');
  const sprites = [nagisa, gen, oni] as const;
  renderer.entityGroup.add(...sprites.map((sprite) => sprite.mesh));
  const playerState: SmokePlayerState = {
    x: 0,
    z: 0,
    facing: 'down',
    radius: 0.4,
    spd: 10,
  };
  const input = new Input(window);
  const collide = createSceneCollide();

  const onResize = (): void => {
    renderer.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  onResize();

  const loop = new GameLoop(
    (dt: number) => {
      const state = input.sample();
      const speed = moveSpeed(playerState.spd, BASE_MOVE_SPEED);
      const nextX = playerState.x + state.moveX * speed * dt;
      const nextZ = playerState.z + state.moveZ * speed * dt;
      const resolved = collide(nextX, nextZ, playerState.radius);
      playerState.x = resolved.x;
      playerState.z = resolved.z;
      playerState.facing = facingFromMove(state.moveX, state.moveZ, playerState.facing);
      nagisa.setPosition(playerState.x, playerState.z);
      nagisa.setFacing(playerState.facing);
    },
    () => {
      camera.follow(playerState.x, playerState.z);
      camera.clampToBounds(SCENE_BOUNDS);
      camera.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);
      sortByDepth(sprites, camera.camera);
      renderer.render(camera.camera);
    },
  );
  loop.start();

  return {
    dispose(): void {
      loop.stop();
      input.dispose();
      window.removeEventListener('resize', onResize);
      for (const sprite of sprites) {
        const texture = sprite.mesh.material instanceof THREE.MeshBasicMaterial
          ? sprite.mesh.material.map
          : null;
        sprite.dispose();
        texture?.dispose();
      }
      grid.dispose();
      for (const mesh of blockerMeshes) {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      }
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    },
  };
}

function createSmokeSprite(
  key: keyof typeof PLACEHOLDERS,
  x: number,
  z: number,
  facing: 'down' | 'right',
): BillboardSprite {
  const def = PLACEHOLDERS[key];
  const texture = createPlaceholderTexture({ color: def.color });
  const sprite = new BillboardSprite({ texture, worldSize: def.worldSize });
  sprite.setPosition(x, z);
  sprite.setFacing(facing);
  return sprite;
}

function createBlockerMesh(rect: Rect): THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> {
  const geometry = new THREE.BoxGeometry(rect.w, 0.12, rect.h);
  const material = new THREE.MeshBasicMaterial({
    color: 0x5b2630,
    transparent: true,
    opacity: 0.82,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(rect.x, 0.06, rect.z);
  return mesh;
}

function gridMaterials(grid: THREE.GridHelper): THREE.LineBasicMaterial[] {
  const material = grid.material;
  const materials = Array.isArray(material) ? material : [material];
  return materials.filter((item): item is THREE.LineBasicMaterial => (
    item instanceof THREE.LineBasicMaterial
  ));
}
