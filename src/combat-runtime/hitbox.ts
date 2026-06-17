// module: combat-runtime/hitbox | 純粋ジオメトリ判定（Three.js import 禁止・Vitest対象）
// XZ平面。Vec2={x,z}。距離は二乗比較で sqrt を避ける（角度判定除く）。
import type { Vec2, Rect } from '../types';

// 距離二乗で円内判定（半径合計の二乗 ≥ 距離二乗 で接触）
export function circleHit(center: Vec2, radius: number, target: Vec2, targetRadius: number): boolean {
  const dx = target.x - center.x;
  const dz = target.z - center.z;
  const reach = radius + targetRadius;
  return dx * dx + dz * dz <= reach * reach;
}

// 扇形判定（origin発・facingDir方向・半径range・中心角arcDeg）
// 射程は target の半径ぶん緩める。角度は半角(arcDeg/2)以内。原点上は常にヒット。
export function fanHit(
  origin: Vec2,
  facingDir: Vec2,
  range: number,
  arcDeg: number,
  target: Vec2,
  targetRadius: number,
): boolean {
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  // 射程チェック（target半径ぶん緩和。最低0でクランプ）
  if (Math.max(0, dist - targetRadius) > range) return false;
  // 原点上は角度未定義 → 救済してヒット
  if (dist === 0) return true;
  if (arcDeg >= 360) return true;
  // 向きベクトルを正規化（長さ0なら判定不能 → ミス扱いだが通常起こらない）
  const fLen = Math.sqrt(facingDir.x * facingDir.x + facingDir.z * facingDir.z);
  if (fLen === 0) return false;
  const fx = facingDir.x / fLen;
  const fz = facingDir.z / fLen;
  // 内積から角度差を求める（cosθ）
  const cos = (dx * fx + dz * fz) / dist;
  const halfArcCos = Math.cos((arcDeg / 2) * (Math.PI / 180));
  // 数値誤差を吸収する微小許容
  return cos >= halfArcCos - 1e-9;
}

// 矩形（中心(x,z)・幅w・奥行h）内判定。最近点までの距離が targetRadius 以内ならヒット。
export function rectHit(rect: Rect, target: Vec2, targetRadius: number): boolean {
  const halfW = rect.w / 2;
  const halfH = rect.h / 2;
  // 矩形内の最近点へクランプ
  const nearestX = Math.max(rect.x - halfW, Math.min(target.x, rect.x + halfW));
  const nearestZ = Math.max(rect.z - halfH, Math.min(target.z, rect.z + halfH));
  const dx = target.x - nearestX;
  const dz = target.z - nearestZ;
  return dx * dx + dz * dz <= targetRadius * targetRadius;
}
