// G1 スモーク：Three.js が r0.171.0 で動き「画面が出る」ことだけを保証する暫定シーン。
// G2 で renderer.ts / camera.ts / loop.ts に置き換える。
import * as THREE from 'three';
import { CONFIG } from '../config';

export function mountSmokeScene(mount: HTMLElement): { dispose(): void } {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(CONFIG.internalWidth, CONFIG.internalHeight, false);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.fog.color);

  // 暫定の透視カメラ（G2 で OrthographicCamera の IsoCamera に置換）
  const camera = new THREE.PerspectiveCamera(
    50,
    CONFIG.internalWidth / CONFIG.internalHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 3, 6);
  camera.lookAt(0, 0.5, 0);

  // 画面に「何かが出る」ことの証拠＝回る箱（朱色）
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xb83b2e });
  const cube = new THREE.Mesh(geo, mat);
  cube.position.set(0, 0.5, 0);
  scene.add(cube);

  const grid = new THREE.GridHelper(10, 10, 0x4a5066, 0x2a2f40);
  scene.add(grid);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(3, 5, 2);
  scene.add(ambient, dir);

  let raf = 0;
  let running = true;
  const tick = (): void => {
    if (!running) return;
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    dispose(): void {
      running = false;
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
