import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { BillboardSprite } from '../src/engine/billboard';

function fakeTexture(): THREE.Texture {
  const texture = new THREE.Texture();
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  return texture;
}

describe('BillboardSprite', () => {
  it('生成順に id を採番する', () => {
    const a = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });
    const b = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });

    expect(b.id).toBeGreaterThan(a.id);
  });

  it('mesh は PlaneGeometry + MeshBasicMaterial', () => {
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });

    expect(sprite.mesh.geometry).toBeInstanceOf(THREE.PlaneGeometry);
    expect(sprite.mesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
  });

  it('足元アンカーとしてローカル下端中央が原点に来る', () => {
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });
    const geometry = sprite.mesh.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    expect(box?.min.y).toBeCloseTo(0, 5);
    expect(box?.max.y).toBeCloseTo(1.8, 5);
    expect(box?.min.x).toBeCloseTo(-0.5, 5);
    expect(box?.max.x).toBeCloseTo(0.5, 5);
  });

  it('setPosition は足元ワールド座標を mesh.position に反映する', () => {
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });

    sprite.setPosition(3, -2);
    expect(sprite.mesh.position.x).toBe(3);
    expect(sprite.mesh.position.z).toBe(-2);
    expect(sprite.mesh.position.y).toBe(0);

    sprite.setPosition(1, 1, 0.5);
    expect(sprite.mesh.position.x).toBe(1);
    expect(sprite.mesh.position.z).toBe(1);
    expect(sprite.mesh.position.y).toBe(0.5);
  });

  it('setFacing(right) は left の水平反転として scale.x を負にする', () => {
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });

    sprite.setFacing('left');
    expect(sprite.mesh.scale.x).toBeGreaterThan(0);
    sprite.setFacing('right');
    expect(sprite.mesh.scale.x).toBeLessThan(0);
    sprite.setFacing('down');
    expect(sprite.mesh.scale.x).toBeGreaterThan(0);
    sprite.setFacing('up');
    expect(sprite.mesh.scale.x).toBeGreaterThan(0);
  });

  it('setFrame は UV offset.x をコマ位置に応じてずらす', () => {
    const texture = fakeTexture();
    texture.userData.framesPerRow = 4;
    const sprite = new BillboardSprite({
      texture,
      worldSize: { w: 1, h: 1.8 },
    });

    sprite.setFrame(0);
    expect(texture.offset.x).toBeCloseTo(0, 5);
    sprite.setFrame(2);
    expect(texture.offset.x).toBeCloseTo(0.5, 5);
    sprite.setFrame(5);
    expect(texture.offset.x).toBeCloseTo(0.25, 5);
    expect(texture.repeat.x).toBeCloseTo(0.25, 5);
  });

  it('footScreenDepth は有限値を返す', () => {
    const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, -1000, 1000);
    cam.position.set(20, 20, 20);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });

    sprite.setPosition(2, 2);

    expect(Number.isFinite(sprite.footScreenDepth(cam))).toBe(true);
  });

  it('dispose は geometry/material を解放する', () => {
    const sprite = new BillboardSprite({ texture: fakeTexture(), worldSize: { w: 1, h: 1.8 } });
    const geometrySpy = vi.spyOn(sprite.mesh.geometry, 'dispose');
    const material = sprite.mesh.material as THREE.Material;
    const materialSpy = vi.spyOn(material, 'dispose');

    sprite.dispose();

    expect(geometrySpy).toHaveBeenCalled();
    expect(materialSpy).toHaveBeenCalled();
  });
});
