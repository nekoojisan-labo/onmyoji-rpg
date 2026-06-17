import * as THREE from 'three';
import {
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from '../config';
import { PLACEHOLDERS } from '../assets/manifest';
import { BillboardSprite } from './billboard';
import { IsoCamera } from './camera';
import { sortByDepth } from './depth-sort';
import { GameLoop } from './loop';
import { createPlaceholderTexture } from './placeholder';
import { Renderer } from './renderer';

export function mountSmokeScene(mount: HTMLElement): { dispose(): void } {
  const canvas = document.createElement('canvas');
  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;
  mount.appendChild(canvas);

  const renderer = new Renderer(canvas);
  const camera = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
  camera.follow(0, 0);

  const grid = new THREE.GridHelper(20, 20, 0x6a7da0, 0x36405a);
  grid.position.set(0, 0, 0);
  for (const material of gridMaterials(grid)) {
    material.fog = false;
  }
  renderer.worldGroup.add(grid);

  const nagisa = createSmokeSprite('pc_nagisa', 0, 0, 'down');
  const gen = createSmokeSprite('sk_gen', -2, -2, 'right');
  const oni = createSmokeSprite('en_onibidoji', 1.5, 2, 'down');
  const sprites = [nagisa, gen, oni] as const;
  renderer.entityGroup.add(...sprites.map((sprite) => sprite.mesh));

  const onResize = (): void => {
    renderer.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  onResize();

  const loop = new GameLoop(
    () => {},
    () => {
      camera.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);
      sortByDepth(sprites, camera.camera);
      renderer.render(camera.camera);
    },
  );
  loop.start();

  return {
    dispose(): void {
      loop.stop();
      window.removeEventListener('resize', onResize);
      for (const sprite of sprites) {
        const texture = sprite.mesh.material instanceof THREE.MeshBasicMaterial
          ? sprite.mesh.material.map
          : null;
        sprite.dispose();
        texture?.dispose();
      }
      grid.dispose();
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

function gridMaterials(grid: THREE.GridHelper): THREE.LineBasicMaterial[] {
  const material = grid.material;
  const materials = Array.isArray(material) ? material : [material];
  return materials.filter((item): item is THREE.LineBasicMaterial => (
    item instanceof THREE.LineBasicMaterial
  ));
}
