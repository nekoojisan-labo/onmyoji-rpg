import * as THREE from 'three';
import { ChinkonState } from './combat/chinkon';
import {
  GEN_ATTACK,
  FUDA,
  JU_KUSABI,
  CAMERA_VIEW_WORLD_WIDTH,
  INTERNAL_HEIGHT,
  INTERNAL_WIDTH,
} from './config';
import {
  stepBattle,
  type BattleContext,
  type BattleEvent,
} from './combat-runtime/battle-system';
import type { UpdateContext } from './entities/manager';
import type { EnemyAiState } from './entities/enemy';
import { IsoCamera } from './engine/camera';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { ChinkonPrompt } from './ui/chinkon-prompt';
import { Hud } from './ui/hud';
import type { SceneState, Rect, Facing, Vec2 } from './types';
import { createGrid } from './world/grid';
import {
  createSceneCollide,
  createSceneTestEntities,
} from './world/scene-test';

const ENEMY_ATTACK_POWER = 8;
const FX_Y = 0.045;
const GEN_FX_INTERVAL_MS = 180;

interface TimedFx {
  mesh: THREE.Mesh;
  lifeSec: number;
  totalSec: number;
  baseOpacity: number;
}

export class Game {
  scene: SceneState = 'field';

  private readonly mount: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly camera: IsoCamera;
  private readonly input: Input;
  private readonly loop: GameLoop;
  private readonly testScene = createSceneTestEntities();
  private readonly battleCtx: BattleContext;
  private readonly collide = createSceneCollide();
  private readonly grid: THREE.GridHelper;
  private readonly blockerMeshes: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[];
  private readonly hud: Hud;
  private readonly chinkonPrompt: ChinkonPrompt;
  private readonly fx: TimedFx[] = [];
  private readonly onResize: () => void;
  private nextGenFxAtMs = 0;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    this.prepareMount();
    this.canvas = document.createElement('canvas');
    this.canvas.width = INTERNAL_WIDTH;
    this.canvas.height = INTERNAL_HEIGHT;
    this.mount.appendChild(this.canvas);

    this.renderer = new Renderer(this.canvas);
    this.camera = new IsoCamera(CAMERA_VIEW_WORLD_WIDTH, INTERNAL_WIDTH / INTERNAL_HEIGHT);
    this.input = new Input(window);
    this.hud = new Hud(this.mount);
    this.chinkonPrompt = new ChinkonPrompt(this.mount);
    this.battleCtx = {
      player: this.testScene.player,
      gen: this.testScene.gen,
      enemies: [this.testScene.onibidoji],
      chinkon: new ChinkonState(),
    };

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
    this.syncHud();
    this.syncChinkonPrompt();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    window.removeEventListener('resize', this.onResize);
    this.clearFx();
    this.hud.dispose();
    this.chinkonPrompt.hide();
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
    const nowMs = performance.now();
    const input = this.input.sample();
    this.testScene.player.setInput(input);

    const enemyHpBeforeBattle = this.snapshotEnemyHp();
    this.faceGenAttackTarget();
    const genAttackFx = this.shouldEmitGenAttackFx(nowMs);
    const battle = stepBattle(this.battleCtx, { input, dt, nowMs });
    this.battleCtx.chinkon = battle.chinkon;
    this.spawnBattleFx(battle.events, enemyHpBeforeBattle, genAttackFx, nowMs);

    if (input.summon) {
      this.testScene.gen.summoned ? this.testScene.gen.recall() : this.testScene.gen.summon();
    }
    this.syncSummonVisibility();

    const enemyAiBeforeUpdate = this.snapshotEnemyAiStates();
    const ctx: UpdateContext = {
      player: this.testScene.player,
      entities: this.testScene.manager.entities,
      nowMs,
      collide: (x: number, z: number, radius: number) => this.collide(x, z, radius),
    };
    this.testScene.manager.update(dt, ctx);
    this.applyEnemyAttackEdges(enemyAiBeforeUpdate, nowMs);
    this.syncEntityVisibility();
    this.updateFx(dt);
    this.syncPlayerIFrameVisual(nowMs);
    this.syncHud();
    this.syncChinkonPrompt();
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

  private syncEntityVisibility(): void {
    this.syncSummonVisibility();
    if (this.testScene.onibidoji.sprite) {
      this.testScene.onibidoji.sprite.mesh.visible = this.testScene.onibidoji.alive;
    }
  }

  private syncHud(): void {
    const player = this.testScene.player;
    this.hud.setHp(player.hp, player.maxHp);
    this.hud.setKi(player.ki, player.maxKi);
    this.hud.setKegare(player.kegare.value);
  }

  private syncChinkonPrompt(): void {
    const phase = this.battleCtx.chinkon.phase;
    const hasWindowTarget = this.battleCtx.enemies.some((enemy) => (
      enemy.alive && enemy.chinkonWindowOpen()
    ));
    const visible = hasWindowTarget && (phase === 'open' || phase === 'channeling');
    if (!visible) {
      this.chinkonPrompt.hide();
      return;
    }
    this.chinkonPrompt.show();
    this.chinkonPrompt.setProgress(phase === 'channeling' ? this.battleCtx.chinkon.progress : 0);
  }

  private snapshotEnemyHp(): Map<number, number> {
    const hp = new Map<number, number>();
    for (const enemy of this.battleCtx.enemies) {
      hp.set(enemy.id, enemy.hp);
    }
    return hp;
  }

  private snapshotEnemyAiStates(): Map<number, EnemyAiState> {
    const states = new Map<number, EnemyAiState>();
    for (const enemy of this.battleCtx.enemies) {
      states.set(enemy.id, enemy.aiState);
    }
    return states;
  }

  private applyEnemyAttackEdges(previous: ReadonlyMap<number, EnemyAiState>, nowMs: number): void {
    for (const enemy of this.battleCtx.enemies) {
      const prev = previous.get(enemy.id);
      if (!enemy.alive || enemy.aiState !== 'attack' || prev === 'attack') continue;

      this.spawnFanFx(
        { x: enemy.x, z: enemy.z },
        enemy.facing,
        1.7,
        72,
        0xd44b3f,
        0.34,
        0.22,
      );
      const beforeHp = this.testScene.player.hp;
      this.testScene.player.takeDamageAt(ENEMY_ATTACK_POWER, nowMs);
      const damaged = this.testScene.player.hp < beforeHp;
      this.spawnRingFx(
        { x: this.testScene.player.x, z: this.testScene.player.z },
        damaged ? 0xf06555 : 0x84e8ff,
        damaged ? 0.52 : 0.38,
        0.2,
      );
      if (damaged && this.battleCtx.chinkon.phase === 'channeling') {
        this.battleCtx.chinkon = this.battleCtx.chinkon.cancel();
      }
    }
  }

  private shouldEmitGenAttackFx(nowMs: number): boolean {
    const gen = this.battleCtx.gen;
    if (!gen || !gen.summoned || gen.intent !== 'attack') return false;
    if (this.battleCtx.chinkon.phase === 'channeling') return false;
    if (nowMs < this.nextGenFxAtMs) return false;
    this.nextGenFxAtMs = nowMs + GEN_FX_INTERVAL_MS;
    return true;
  }

  private faceGenAttackTarget(): void {
    const gen = this.battleCtx.gen;
    if (!gen || !gen.summoned || gen.intent !== 'attack') return;

    let best: Vec2 | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const enemy of this.battleCtx.enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - gen.x, enemy.z - gen.z);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: enemy.x, z: enemy.z };
      }
    }
    if (!best) return;
    gen.facing = facingFromDelta(best.x - gen.x, best.z - gen.z);
    gen.syncSprite();
  }

  private spawnBattleFx(
    events: readonly BattleEvent[],
    enemyHpBeforeBattle: ReadonlyMap<number, number>,
    genAttackFx: boolean,
    nowMs: number,
  ): void {
    for (const event of events) {
      switch (event.type) {
        case 'fuda':
          this.spawnFanFx(
            { x: this.testScene.player.x, z: this.testScene.player.z },
            this.testScene.player.facing,
            FUDA.range,
            FUDA.arcDeg,
            0xe8c86b,
            event.hits > 0 ? 0.38 : 0.24,
            0.18,
          );
          break;
        case 'ju':
          this.spawnFanFx(
            { x: this.testScene.player.x, z: this.testScene.player.z },
            this.testScene.player.facing,
            JU_KUSABI.range,
            JU_KUSABI.arcDeg,
            0x9e7dff,
            event.hits > 0 ? 0.42 : 0.28,
            0.24,
          );
          break;
        case 'dodge':
          this.spawnRingFx({ x: this.testScene.player.x, z: this.testScene.player.z }, 0x6fe7ff, 0.46, 0.24);
          break;
        case 'chinkon-open':
          this.spawnRingFx({ x: this.testScene.onibidoji.x, z: this.testScene.onibidoji.z }, 0xc7a8ff, 0.46, 0.42);
          break;
        case 'chinkon-begin':
          this.spawnRingFx({ x: this.testScene.player.x, z: this.testScene.player.z }, 0xd9c7ff, 0.5, 0.5);
          break;
        case 'soothed':
          this.spawnRingFx({ x: this.testScene.onibidoji.x, z: this.testScene.onibidoji.z }, 0xd9d2ff, 0.64, 0.56);
          break;
        case 'subjugated':
          this.spawnRingFx({ x: this.testScene.onibidoji.x, z: this.testScene.onibidoji.z }, 0xc94262, 0.58, 0.44);
          break;
      }
    }

    if (genAttackFx && this.testScene.gen.summoned) {
      this.spawnFanFx(
        { x: this.testScene.gen.x, z: this.testScene.gen.z },
        this.testScene.gen.facing,
        GEN_ATTACK.range,
        GEN_ATTACK.arcDeg,
        0x73d283,
        0.28,
        0.16,
      );
    }

    this.spawnEnemyHitFlashes(enemyHpBeforeBattle, nowMs);
  }

  private spawnEnemyHitFlashes(enemyHpBeforeBattle: ReadonlyMap<number, number>, nowMs: number): void {
    for (const enemy of this.battleCtx.enemies) {
      const before = enemyHpBeforeBattle.get(enemy.id);
      if (before === undefined || enemy.hp >= before) continue;
      const color = enemy.alive ? 0xfff0a0 : 0xff6b76;
      this.spawnRingFx({ x: enemy.x, z: enemy.z }, color, 0.5, 0.18);
    }
    if (this.testScene.player.isInvincible(nowMs)) {
      this.spawnRingFx({ x: this.testScene.player.x, z: this.testScene.player.z }, 0x9af2ff, 0.28, 0.12);
    }
  }

  private spawnFanFx(
    origin: Vec2,
    facing: Facing,
    range: number,
    arcDeg: number,
    color: number,
    opacity: number,
    lifeSec: number,
  ): void {
    const geometry = createFanGeometry(range, arcDeg, facingAngle(facing));
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(origin.x, FX_Y, origin.z);
    mesh.renderOrder = 1000;
    this.renderer.fxGroup.add(mesh);
    this.fx.push({ mesh, lifeSec, totalSec: lifeSec, baseOpacity: opacity });
  }

  private spawnRingFx(origin: Vec2, color: number, opacity: number, lifeSec: number): void {
    const geometry = new THREE.RingGeometry(0.28, 0.58, 28);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(origin.x, FX_Y + 0.01, origin.z);
    mesh.renderOrder = 1001;
    this.renderer.fxGroup.add(mesh);
    this.fx.push({ mesh, lifeSec, totalSec: lifeSec, baseOpacity: opacity });
  }

  private updateFx(dt: number): void {
    for (let i = this.fx.length - 1; i >= 0; i -= 1) {
      const fx = this.fx[i]!;
      fx.lifeSec -= dt;
      const progress = fx.totalSec > 0 ? Math.max(0, fx.lifeSec / fx.totalSec) : 0;
      const material = fx.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = fx.baseOpacity * progress;
      }
      const scale = 1 + (1 - progress) * 0.18;
      fx.mesh.scale.setScalar(scale);
      if (fx.lifeSec <= 0) {
        this.disposeFxAt(i);
      }
    }
  }

  private clearFx(): void {
    for (let i = this.fx.length - 1; i >= 0; i -= 1) {
      this.disposeFxAt(i);
    }
  }

  private disposeFxAt(index: number): void {
    const fx = this.fx[index]!;
    this.renderer.fxGroup.remove(fx.mesh);
    disposeMesh(fx.mesh);
    this.fx.splice(index, 1);
  }

  private syncPlayerIFrameVisual(nowMs: number): void {
    const sprite = this.testScene.player.sprite;
    if (!sprite || !(sprite.mesh.material instanceof THREE.MeshBasicMaterial)) return;
    const active = this.testScene.player.isInvincible(nowMs);
    sprite.mesh.material.opacity = active ? 0.58 : 1;
    sprite.mesh.material.color.setHex(active ? 0xb7f4ff : 0xffffff);
  }

  private disposeEntityTextures(): void {
    const sprites = new Set([
      this.testScene.player.sprite,
      this.testScene.gen.sprite,
      this.testScene.onibidoji.sprite,
      ...this.testScene.manager.entities.map((entity) => entity.sprite),
    ]);
    for (const sprite of sprites) {
      const material = sprite?.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.map?.dispose();
      }
    }
  }

  private prepareMount(): void {
    const style = getComputedStyle(this.mount);
    if (style.position === 'static') {
      this.mount.style.position = 'relative';
    }
    this.mount.style.overflow = 'hidden';
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

function facingAngle(facing: Facing): number {
  switch (facing) {
    case 'down': return Math.PI / 2;
    case 'up': return -Math.PI / 2;
    case 'right': return 0;
    case 'left': return Math.PI;
  }
}

function facingFromDelta(dx: number, dz: number): Facing {
  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dz >= 0 ? 'down' : 'up';
}

function createFanGeometry(range: number, arcDeg: number, angle: number): THREE.BufferGeometry {
  const segments = 28;
  const arcRad = THREE.MathUtils.degToRad(arcDeg);
  const start = angle - arcRad / 2;
  const positions: number[] = [0, 0, 0];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = start + arcRad * t;
    positions.push(Math.cos(a) * range, 0, Math.sin(a) * range);
    if (i > 0) {
      indices.push(0, i, i + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  const material = mesh.material;
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }
  } else {
    material.dispose();
  }
}
