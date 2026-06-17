// 共有型（横断型のみ）。契約 §4.1 に逐語一致。
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type Facing = 'down' | 'left' | 'right' | 'up';
export type SceneState = 'title' | 'field' | 'battle' | 'menu' | 'event' | 'gameover';

// XZ平面（地表）座標。y は描画専用で判定に使わない
export interface Vec2 {
  x: number;
  z: number;
}

// 中心(x,z)・幅w・奥行h の矩形（XZ平面）
export interface Rect {
  x: number;
  z: number;
  w: number;
  h: number;
}
