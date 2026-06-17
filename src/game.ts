import * as THREE from 'three';
import {
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from './config';
import type { UpdateContext } from './entities/manager';
import { IsoCamera } from './engine/camera';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import type { SceneState, Rect } from './types';
import { createGrid } from './world/grid';
import {
  createSceneCollide,
  createSceneTestEntities,
} from './world/scene-test';

export class Game {
  scene: SceneState = 'field';

  private readonly mount: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly camera: IsoCamera;
  private readonly input: Input;
  private readonly loop: GameLoop;
  private readonly testScene = createSceneTestEntities();
  private readonly collide = createSceneCollide();
  private readonly grid: THREE.GridHelper;
  private readonly blockerMeshes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[];
  private readonly onResize: () => void;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.canvas = document.createElement('canvas');
    this.canvas.width = INTERNAL_WIDTH;
    this.canvas.height = INTERNAL_HEIGHT;
    this.mount.appendChild(this.canvas);

    this.renderer = new Renderer(this.canvas);
    this.camera = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
    this.input = new Input(window);

    this.grid = createGrid({
      size: this.testScene.bounds.w,
      divisions: this.testScene.bounds.w,
    });
    for (const material of gridMaterials(this.grid)) {
      material.fog = false;
    }
    this.renderer.worldGroup.add(this.grid);

    this.blockerMeshes = this.testScene.blockers.map(createBlockerMesh);
    this.renderer.worldGroup.add(...this.blockerMeshes);
    for (const entity of this.testScene.manager.entities) {
      if (entity.sprite) {
        this.renderer.entityGroup.add(entity.sprite.mesh);
      }
    }

    this.loop = new GameLoop(
      (dt: number) => this.update(dt),
      (_alpha: number) => this.render(),
    );

    this.onResize = (): void => {
      this.renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.onResize);
    this.onResize();
    this.syncSummonVisibility();
    this.syncCameraAndDepth();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    window.removeEventListener('resize', this.onResize);
    this.disposeEntityTextures();
    this.testScene.manager.dispose();
    this.grid.dispose();
    for (const mesh of this.blockerMeshes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.renderer.dispose();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  private update(dt: number): void {
    const input = this.input.sample();
    this.testScene.player.setInput(input);
    if (input.summon) {
      this.testScene.gen.summoned ? this.testScene.gen.recall() : this.testScene.gen.summon();
    }
    this.syncSummonVisibility();

    const ctx: UpdateContext = {
      player: this.testScene.player,
      entities: this.testScene.manager.entities,
      nowMs: performance.now(),
      collide: (x: number, z: number, radius: number) => this.collide(x, z, radius),
    };
    this.testScene.manager.update(dt, ctx);
    this.syncSummonVisibility();
    this.syncCameraAndDepth();
  }

  private render(): void {
    this.renderer.render(this.camera.camera);
  }

  private syncCameraAndDepth(): void {
    this.camera.follow(this.testScene.player.x, this.testScene.player.z);
    this.camera.clampToBounds(this.testScene.bounds);
    this.camera.applyPixelSnap(INTERNAL_WIDTH, INTERNAL_HEIGHT);
    this.testScene.manager.sortForRender(this.camera.camera);
  }

  private syncSummonVisibility(): void {
    if (this.testScene.gen.sprite) {
      this.testScene.gen.sprite.mesh.visible = this.testScene.gen.summoned;
    }
  }

  private disposeEntityTextures(): void {
    for (const entity of this.testScene.manager.entities) {
      const material = entity.sprite?.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.map?.dispose();
      }
    }
  }
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
