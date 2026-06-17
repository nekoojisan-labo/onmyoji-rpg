import { normalizeMove } from './move-vector';

export interface InputState {
  moveX: number; moveZ: number;
  fuda: boolean;
  ju1: boolean; ju2: boolean;
  dodge: boolean;
  summon: boolean;
  switchShiki: boolean;
  item: boolean;
  chinkon: boolean;
}

type EdgeKey = 'fuda' | 'ju1' | 'ju2' | 'dodge' | 'summon' | 'switchShiki' | 'item' | 'chinkon';

const ACTION_BY_CODE: Record<string, EdgeKey> = {
  KeyJ: 'fuda',
  KeyK: 'ju1',
  KeyL: 'ju2',
  Space: 'dodge',
  Digit1: 'summon',
  KeyE: 'switchShiki',
  KeyQ: 'item',
  KeyR: 'chinkon',
};

export class Input {
  private readonly target: HTMLElement | Window;
  private readonly held = new Set<string>();
  private readonly edges = new Set<EdgeKey>();
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;

  constructor(target: HTMLElement | Window = window) {
    this.target = target;
    this.onKeyDown = (event: KeyboardEvent): void => {
      const code = event.code;
      if (this.isGameCode(code)) {
        event.preventDefault();
      }
      if (this.held.has(code)) {
        return;
      }
      this.held.add(code);
      const action = ACTION_BY_CODE[code];
      if (action) {
        this.edges.add(action);
      }
    };
    this.onKeyUp = (event: KeyboardEvent): void => {
      this.held.delete(event.code);
    };
    this.eventTarget.addEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.addEventListener('keyup', this.onKeyUp as EventListener);
  }

  sample(): InputState {
    let rawX = 0;
    let rawZ = 0;
    if (this.held.has('KeyD') || this.held.has('ArrowRight')) rawX += 1;
    if (this.held.has('KeyA') || this.held.has('ArrowLeft')) rawX -= 1;
    if (this.held.has('KeyS') || this.held.has('ArrowDown')) rawZ += 1;
    if (this.held.has('KeyW') || this.held.has('ArrowUp')) rawZ -= 1;

    const { moveX, moveZ } = normalizeMove(rawX, rawZ);
    const state: InputState = {
      moveX,
      moveZ,
      fuda: this.edges.has('fuda'),
      ju1: this.edges.has('ju1'),
      ju2: this.edges.has('ju2'),
      dodge: this.edges.has('dodge'),
      summon: this.edges.has('summon'),
      switchShiki: this.edges.has('switchShiki'),
      item: this.edges.has('item'),
      chinkon: this.edges.has('chinkon'),
    };
    this.edges.clear();
    return state;
  }

  dispose(): void {
    this.eventTarget.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp as EventListener);
    this.held.clear();
    this.edges.clear();
  }

  private get eventTarget(): EventTarget {
    return this.target;
  }

  private isGameCode(code: string): boolean {
    if (ACTION_BY_CODE[code]) {
      return true;
    }
    return (
      code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' ||
      code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight'
    );
  }
}
