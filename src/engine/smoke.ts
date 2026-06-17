import * as THREE from 'three';
import {
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from '../config';
import { IsoCamera } from './camera';
import { GameLoop } from './loop';
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
  renderer.worldGroup.add(grid);

  const onResize = (): void => {
    renderer.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  onResize();

  const loop = new GameLoop(
    () => {},
    () => {
      camera.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);
      renderer.render(camera.camera);
    },
  );
  loop.start();

  return {
    dispose(): void {
      loop.stop();
      window.removeEventListener('resize', onResize);
      grid.dispose();
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    },
  };
}
