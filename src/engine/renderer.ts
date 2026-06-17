// WebGLRenderer/Scene/描画グループ初期化。内部解像度1280x720・藍墨fog・環境光を固定する。

import * as THREE from 'three';
import {
  AMBIENT_COLOR,
  AMBIENT_INTENSITY,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from '../config';

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly worldGroup: THREE.Group;
  readonly entityGroup: THREE.Group;
  readonly fxGroup: THREE.Group;
  readonly shadowGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(INTERNAL_WIDTH, INTERNAL_HEIGHT, false);
    this.renderer.setClearColor(FOG_COLOR, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(FOG_COLOR);
    this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'world';
    this.shadowGroup = new THREE.Group();
    this.shadowGroup.name = 'shadow';
    this.entityGroup = new THREE.Group();
    this.entityGroup.name = 'entity';
    this.fxGroup = new THREE.Group();
    this.fxGroup.name = 'fx';

    const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
    this.scene.add(ambient, this.worldGroup, this.shadowGroup, this.entityGroup, this.fxGroup);
  }

  render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera);
  }

  resize(cssWidth: number, cssHeight: number): void {
    const safeCssWidth = Math.max(1, cssWidth);
    const safeCssHeight = Math.max(1, cssHeight);
    const targetAspect = INTERNAL_WIDTH / INTERNAL_HEIGHT;
    const containerAspect = safeCssWidth / safeCssHeight;
    let displayWidth = safeCssWidth;
    let displayHeight = safeCssHeight;

    if (containerAspect > targetAspect) {
      displayWidth = Math.round(safeCssHeight * targetAspect);
    } else {
      displayHeight = Math.round(safeCssWidth / targetAspect);
    }

    const canvas = this.renderer.domElement;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    this.renderer.setSize(INTERNAL_WIDTH, INTERNAL_HEIGHT, false);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
