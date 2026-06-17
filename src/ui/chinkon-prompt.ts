function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class ChinkonPrompt {
  private readonly panel: HTMLDivElement;
  private readonly fill: HTMLDivElement;
  private readonly label: HTMLDivElement;
  private visible = false;

  constructor(mount: HTMLElement) {
    this.panel = document.createElement('div');
    this.panel.className = 'chinkon-prompt';
    this.panel.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:52px',
      'transform:translateX(-50%)',
      'width:336px',
      'padding:12px 16px 14px',
      'box-sizing:border-box',
      'background:rgba(13,12,20,0.76)',
      'border:1px solid rgba(210,190,245,0.5)',
      'border-radius:6px',
      'box-shadow:0 10px 28px rgba(0,0,0,0.34)',
      'overflow:hidden',
      'pointer-events:none',
      'z-index:20',
      'display:none',
      'text-align:center',
    ].join(';');

    this.label = document.createElement('div');
    this.label.style.cssText = [
      "font:800 14px/1.2 'Noto Sans JP','Hiragino Sans',system-ui,sans-serif",
      'color:#f1e8ff',
      'letter-spacing:0',
      'text-shadow:0 1px 3px rgba(0,0,0,0.95)',
      'margin-bottom:9px',
      'white-space:nowrap',
    ].join(';');
    this.label.textContent = '鎮魂 R';

    const gauge = document.createElement('div');
    gauge.style.cssText = [
      'position:relative',
      'width:100%',
      'height:14px',
      'box-sizing:border-box',
      'background:rgba(8,10,16,0.88)',
      'border:1px solid rgba(210,190,245,0.36)',
      'border-radius:4px',
      'overflow:hidden',
    ].join(';');

    this.fill = document.createElement('div');
    this.fill.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'height:100%',
      'width:0%',
      'background:linear-gradient(90deg,#6e59d8,#d8c6ff)',
      'transition:width 60ms linear',
    ].join(';');
    gauge.appendChild(this.fill);

    this.panel.append(this.label, gauge);
    mount.appendChild(this.panel);
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.panel.style.display = 'block';
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.panel.style.display = 'none';
    this.setProgress(0);
  }

  setProgress(p: number): void {
    const progress = clamp(p, 0, 1);
    this.fill.style.width = `${progress * 100}%`;
    this.fill.dataset.progress = progress.toFixed(3);
    this.label.textContent = progress > 0 ? '鎮魂 チャネル中' : '鎮魂 R';
  }
}
