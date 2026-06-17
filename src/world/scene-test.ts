import type { Rect, Vec2 } from '../types';
import { PLACEHOLDERS } from '../assets/manifest';
import type { Stats } from '../combat/stats';
import { BillboardSprite } from '../engine/billboard';
import { createPlaceholderTexture } from '../engine/placeholder';
import { EntityManager } from '../entities/manager';
import { Player } from '../entities/player';
import { Shikigami } from '../entities/shikigami';
import { Enemy } from '../entities/enemy';
import { resolveCollision } from './collision';

export const SCENE_BLOCKERS: readonly Rect[] = [
  { x: -4, z: -2, w: 2, h: 6 },
  { x: 5, z: 3, w: 4, h: 2 },
];

export const SCENE_BOUNDS: Rect = { x: 0, z: 0, w: 40, h: 40 };
export const SCENE_PLAYER_START: Vec2 = { x: 0, z: 0 };
export const SCENE_GEN_START: Vec2 = { x: SCENE_PLAYER_START.x, z: SCENE_PLAYER_START.z - 1.6 };
export const SCENE_ONIBIDOJI_START: Vec2 = { x: SCENE_PLAYER_START.x + 6, z: SCENE_PLAYER_START.z };

const NAGISA_STATS: Stats = {
  hp: 200,
  ki: 100,
  tai: 50,
  go: 40,
  jutsuryoku: 60,
  spd: 20,
  critRate: 10,
  critMul: 1.5,
};

const GEN_STATS: Stats = {
  hp: 80,
  ki: 0,
  tai: 45,
  go: 25,
  jutsuryoku: 0,
  spd: 0,
  critRate: 5,
  critMul: 1.5,
};

const ONIBIDOJI_STATS: Stats = {
  hp: 120,
  ki: 0,
  tai: 40,
  go: 30,
  jutsuryoku: 20,
  spd: 0,
  critRate: 5,
  critMul: 1.5,
};

export interface SceneTestEntities {
  bounds: Rect;
  blockers: readonly Rect[];
  manager: EntityManager;
  player: Player;
  gen: Shikigami;
  onibidoji: Enemy;
}

export function createSceneCollide(): (x: number, z: number, radius: number) => Vec2 {
  return (x: number, z: number, radius: number): Vec2 => (
    resolveCollision(x, z, radius, SCENE_BLOCKERS, SCENE_BOUNDS)
  );
}

export function createSceneTestEntities(): SceneTestEntities {
  const manager = new EntityManager();
  const player = new Player({
    x: SCENE_PLAYER_START.x,
    z: SCENE_PLAYER_START.z,
    element: 'water',
    baseStats: NAGISA_STATS,
    radius: 0.4,
  });
  const gen = new Shikigami({
    x: SCENE_GEN_START.x,
    z: SCENE_GEN_START.z,
    element: 'wood',
    baseStats: GEN_STATS,
    radius: 0.35,
  });
  const onibidoji = new Enemy({
    x: SCENE_ONIBIDOJI_START.x,
    z: SCENE_ONIBIDOJI_START.z,
    element: 'fire',
    baseStats: ONIBIDOJI_STATS,
    radius: 0.45,
  });

  player.facing = 'right';
  gen.facing = 'right';
  onibidoji.facing = 'left';
  gen.summon();

  player.sprite = createSceneSprite('pc_nagisa', player.x, player.z);
  gen.sprite = createSceneSprite('sk_gen', gen.x, gen.z);
  onibidoji.sprite = createSceneSprite('en_onibidoji', onibidoji.x, onibidoji.z);
  player.syncSprite();
  gen.syncSprite();
  onibidoji.syncSprite();

  manager.add(player);
  manager.add(gen);
  manager.add(onibidoji);

  return {
    bounds: SCENE_BOUNDS,
    blockers: SCENE_BLOCKERS,
    manager,
    player,
    gen,
    onibidoji,
  };
}

function createSceneSprite(key: keyof typeof PLACEHOLDERS, x: number, z: number): BillboardSprite {
  const def = PLACEHOLDERS[key];
  const texture = createPlaceholderTexture({ color: def.color });
  const sprite = new BillboardSprite({ texture, worldSize: def.worldSize });
  sprite.setPosition(x, z);
  return sprite;
}
