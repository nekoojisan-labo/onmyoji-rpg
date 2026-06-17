import * as THREE from 'three';

export interface PlaceholderTextureOptions {
  color: number;
  pixelW?: number;
  pixelH?: number;
  showFacingMark?: boolean;
}

function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function createPlaceholderTexture(opts: PlaceholderTextureOptions): THREE.Texture {
  const w = opts.pixelW ?? 64;
  const h = opts.pixelH ?? 96;
  const showMark = opts.showFacingMark ?? true;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('placeholder: 2d context unavailable');
  }

  ctx.clearRect(0, 0, w, h);

  const bodyMargin = Math.round(w * 0.18);
  const bodyTop = Math.round(h * 0.08);
  const bodyBottom = Math.round(h * 0.92);
  const bodyW = w - bodyMargin * 2;
  const bodyH = bodyBottom - bodyTop;

  ctx.fillStyle = toCss(opts.color);
  ctx.fillRect(bodyMargin, bodyTop, bodyW, bodyH);

  ctx.strokeStyle = 'rgba(16,19,28,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bodyMargin, bodyTop, bodyW, bodyH);

  ctx.fillStyle = 'rgba(244,244,245,0.9)';
  ctx.fillRect(bodyMargin, bodyTop, bodyW, Math.round(h * 0.08));

  if (showMark) {
    const cx = w / 2;
    const baseY = h - 4;
    const tipY = h - Math.round(h * 0.16);
    ctx.fillStyle = 'rgba(59,130,246,0.95)';
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - 8, baseY);
    ctx.lineTo(cx + 8, baseY);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
