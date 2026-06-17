import type { Facing, Element } from '../types';
import type { Stats } from '../combat/stats';
import type { BillboardSprite } from '../engine/billboard';
import type { UpdateContext } from './manager';

let nextEntityId = 1;

/** ビルボードを持つ全エンティティの基底。位置は float 保持・判定は XZ 円。 */
export abstract class Entity {
  readonly id: number;
  x: number;
  z: number;
  facing: Facing;
  element: Element;
  hp: number;
  maxHp: number;
  baseStats: Stats;
  sprite: BillboardSprite | null;
  radius: number;
  alive: boolean;

  constructor(init: {
    x: number;
    z: number;
    element: Element;
    baseStats: Stats;
    radius?: number;
  }) {
    this.id = nextEntityId++;
    this.x = init.x;
    this.z = init.z;
    this.facing = 'down';
    this.element = init.element;
    this.baseStats = init.baseStats;
    this.maxHp = init.baseStats.hp;
    this.hp = init.baseStats.hp;
    this.radius = init.radius ?? 0.4;
    this.sprite = null;
    this.alive = true;
  }

  abstract update(dt: number, ctx: UpdateContext): void;

  /** ダメージ適用。0..maxHp にクランプし hp=0 で alive=false。負量・0量は無視。 */
  takeDamage(amount: number): void {
    if (amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.alive = false;
  }

  /** x/z/facing をビルボードへ反映（sprite=null のときは何もしない）。 */
  syncSprite(): void {
    if (!this.sprite) return;
    this.sprite.setPosition(this.x, this.z);
    this.sprite.setFacing(this.facing);
  }
}
