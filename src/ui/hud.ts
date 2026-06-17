import { KEGARE_THRESHOLDS } from '../combat/kegare';

type BarParts = {
  root: HTMLDivElement;
  fill: HTMLDivElement;
  text: HTMLDivElement;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createBar(className: string, label: string, color: string): BarParts {
  const root = document.createElement('div');
  root.className = className;
  root.style.cssText = [
    'position:relative',
    'width:244px',
    'height:18px',
    'margin-top:7px',
    'box-sizing:border-box',
    'background:rgba(9,11,16,0.82)',
    'border:1px solid rgba(201,218,238,0.28)',
    'border-radius:4px',
    'overflow:hidden',
  ].join(';');

  const fill = document.createElement('div');
  fill.style.cssText = [
    'position:absolute',
    'left:0',
    'top:0',
    'height:100%',
    'width:0%',
    `background:${color}`,
    'transition:width 100ms linear,background 120ms linear',
  ].join(';');

  const text = document.createElement('div');
  text.style.cssText = [
    'position:absolute',
    'inset:0',
    'display:flex',
    'align-items:center',
    'padding:0 8px',
    'box-sizing:border-box',
    "font:700 11px/1 'Noto Sans JP','Hiragino Sans',system-ui,sans-serif",
    'color:#f6f3ec',
    'letter-spacing:0',
    'text-shadow:0 1px 2px rgba(0,0,0,0.95)',
    'white-space:nowrap',
    'pointer-events:none',
  ].join(';');
  text.textContent = label;

  root.append(fill, text);
  return { root, fill, text };
}

export class Hud {
  private readonly panel: HTMLDivElement;
  private readonly hpBar: BarParts;
  private readonly kiBar: BarParts;
  private readonly kegareBar: BarParts;

  constructor(mount: HTMLElement) {
    this.panel = document.createElement('div');
    this.panel.className = 'hud-panel';
    this.panel.style.cssText = [
      'position:absolute',
      'left:24px',
      'bottom:24px',
      'width:272px',
      'padding:9px 13px 12px',
      'box-sizing:border-box',
      'background:rgba(11,13,18,0.68)',
      'border:1px solid rgba(188,206,230,0.32)',
      'border-radius:6px',
      'box-shadow:0 10px 24px rgba(0,0,0,0.28)',
      'overflow:hidden',
      'pointer-events:none',
      'z-index:10',
    ].join(';');

    this.hpBar = createBar(
      'hud-bar hud-bar-hp',
      'HP',
      'linear-gradient(90deg,#7f2426,#d94a4a)',
    );
    this.kiBar = createBar(
      'hud-bar hud-bar-ki',
      '気',
      'linear-gradient(90deg,#1f5a7e,#51a8d6)',
    );
    this.kegareBar = createBar(
      'hud-bar hud-bar-kegare',
      '穢',
      'linear-gradient(90deg,#4b456f,#8372bc)',
    );

    this.panel.append(this.hpBar.root, this.kiBar.root, this.kegareBar.root);
    mount.appendChild(this.panel);
  }

  setHp(cur: number, max: number): void {
    const current = Math.max(0, Math.floor(cur));
    const maximum = Math.max(0, Math.floor(max));
    const percent = maximum > 0 ? clamp((current / maximum) * 100, 0, 100) : 0;
    this.hpBar.fill.style.width = `${percent}%`;
    this.hpBar.text.textContent = `HP ${current}/${maximum}`;
    this.hpBar.root.dataset.value = String(current);
    this.hpBar.root.dataset.max = String(maximum);
  }

  setKi(cur: number, max: number): void {
    const current = Math.max(0, Math.floor(cur));
    const maximum = Math.max(0, Math.floor(max));
    const percent = maximum > 0 ? clamp((current / maximum) * 100, 0, 100) : 0;
    this.kiBar.fill.style.width = `${percent}%`;
    this.kiBar.text.textContent = `気 ${current}/${maximum}`;
    this.kiBar.root.dataset.value = String(current);
    this.kiBar.root.dataset.max = String(maximum);
  }

  setKegare(value: number): void {
    const v = clamp(value, 0, 100);
    let label = '平常';
    let color = 'linear-gradient(90deg,#4b456f,#8372bc)';

    if (v >= KEGARE_THRESHOLDS.berserk) {
      label = '暴走';
      color = 'linear-gradient(90deg,#401624,#d93d53)';
    } else if (v >= KEGARE_THRESHOLDS.heavy) {
      label = '重';
      color = 'linear-gradient(90deg,#4a1d43,#b94482)';
    } else if (v >= KEGARE_THRESHOLDS.light) {
      label = '軽';
      color = 'linear-gradient(90deg,#4b3369,#9a65cf)';
    }

    this.kegareBar.fill.style.width = `${v}%`;
    this.kegareBar.fill.style.background = color;
    this.kegareBar.text.textContent = `穢 ${Math.floor(v)} ${label}`;
    this.kegareBar.root.dataset.value = v.toFixed(1);
    this.kegareBar.root.dataset.stage = label;
  }

  dispose(): void {
    this.panel.remove();
  }
}
