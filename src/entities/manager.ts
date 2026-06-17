import type { Camera } from 'three';
import type { Entity } from './entity';
import type { Player } from './player';
import { sortByDepth } from '../engine/depth-sort';

/** 1フレーム分の更新コンテキスト。collide は衝突解決後の座標を返す（G4 提供）。 */
export interface UpdateContext {
  player: Player;
  entities: readonly Entity[];
  nowMs: number;
  collide: (x: number, z: number, radius: number) => { x: number; z: number };
}

/** エンティティの登録・更新・破棄・描画深度ソート連携を担うマネージャ。 */
export class EntityManager {
  private list: Entity[] = [];

  add(e: Entity): void {
    if (this.list.includes(e)) return;
    this.list.push(e);
  }

  remove(id: number): void {
    this.list = this.list.filter((e) => e.id !== id);
  }

  get entities(): readonly Entity[] {
    return Object.freeze(this.list.slice());
  }

  /** 生存エンティティのみ tick → syncSprite。tick 後に死亡したものを除去。 */
  update(dt: number, ctx: UpdateContext): void {
    for (const e of this.list) {
      if (!e.alive) continue;
      e.update(dt, ctx);
      e.syncSprite();
    }
    this.list = this.list.filter((e) => e.alive);
  }

  /**
   * sprite を持つ生存エンティティを足元スクリーン深度でソートし renderOrder を付与する。
   * 実深度ソートは G3 engine/depth-sort.ts の sortByDepth に委譲（BillboardSprite が DepthSortable を満たす）。
   */
  sortForRender(camera: Camera): void {
    const sprites = this.list
      .filter((e) => e.alive && e.sprite !== null)
      .map((e) => e.sprite!);
    sortByDepth(sprites, camera);
  }

  dispose(): void {
    for (const e of this.list) {
      e.sprite?.dispose();
      e.sprite = null;
    }
    this.list = [];
  }
}
