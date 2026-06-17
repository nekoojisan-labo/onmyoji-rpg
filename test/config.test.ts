import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config';

describe('CONFIG（契約 §2 Global Constraints の数値集約点）', () => {
  it('カメラ角は yaw45 / pitch30 固定', () => {
    expect(CONFIG.camera.yawDeg).toBe(45);
    expect(CONFIG.camera.pitchDeg).toBe(30);
  });

  it('カメラ追従はデッドゾーンと lerp 係数を持つ', () => {
    expect(CONFIG.camera.deadZone).toBe(1.5);
    expect(CONFIG.camera.followLerp).toBe(0.12);
  });

  it('内部解像度は 1280x720', () => {
    expect(CONFIG.internalWidth).toBe(1280);
    expect(CONFIG.internalHeight).toBe(720);
  });

  it('fog は藍墨 #10131c / near12 / far40・near/far クリップ -1000/1000', () => {
    expect(CONFIG.fog.color).toBe(0x10131c);
    expect(CONFIG.fog.near).toBe(12);
    expect(CONFIG.fog.far).toBe(40);
    expect(CONFIG.camera.clipNear).toBe(-1000);
    expect(CONFIG.camera.clipFar).toBe(1000);
  });

  it('移動速度 baseMoveSpeed = 4.0 unit/s', () => {
    expect(CONFIG.move.baseMoveSpeed).toBe(4.0);
  });

  it('i-frame 距離2.5 / 全体0.45s / 無敵0.05〜0.28s / CD0.6s', () => {
    expect(CONFIG.iframe.dashDistance).toBe(2.5);
    expect(CONFIG.iframe.totalSec).toBe(0.45);
    expect(CONFIG.iframe.invincibleStartSec).toBe(0.05);
    expect(CONFIG.iframe.invincibleEndSec).toBe(0.28);
    expect(CONFIG.iframe.cooldownSec).toBe(0.6);
  });

  it('五行倍率 相生0.85 / 相克1.25 / 無関係1.0', () => {
    expect(CONFIG.element.shoseiMul).toBe(0.85);
    expect(CONFIG.element.sokokuMul).toBe(1.25);
    expect(CONFIG.element.neutralMul).toBe(1.0);
  });

  it('穢の閾値 light40 / heavy70 / berserk100', () => {
    expect(CONFIG.kegare.light).toBe(40);
    expect(CONFIG.kegare.heavy).toBe(70);
    expect(CONFIG.kegare.berserk).toBe(100);
  });

  it('鎮魂 HP30%窓 / チャネル1.5s', () => {
    expect(CONFIG.chinkon.hpRatio).toBe(0.30);
    expect(CONFIG.chinkon.channelSec).toBe(1.5);
  });

  it('ビルボード既定板サイズ 1 x 1.8 / 足元アンカー', () => {
    expect(CONFIG.billboard.defaultWidth).toBe(1.0);
    expect(CONFIG.billboard.defaultHeight).toBe(1.8);
  });
});
