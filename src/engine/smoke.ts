import { Game } from '../game';

export function mountSmokeScene(mount: HTMLElement): { dispose(): void } {
  const game = new Game(mount);
  game.start();
  return game;
}
