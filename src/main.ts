import { Application } from 'pixi.js';
import { Game } from './engine/Game.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';
import { FroggerScene } from './scenes/FroggerScene.js';

async function bootstrap() {
  const app = new Application();
  await app.init({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    background: 0x1a1a2e,
  });

  // Mobile: route touch gestures to the canvas (prevent scroll/zoom hijacking)
  app.canvas.style.touchAction = 'none';
  (app.canvas.style as any).webkitUserSelect = 'none';
  app.canvas.style.userSelect = 'none';

  // Wait for custom fonts to load before rendering any text
  await document.fonts.ready;

  const container = document.getElementById('app');
  if (!container) throw new Error('Missing #app element');
  container.appendChild(app.canvas);

  const game = new Game(app);
  game.loadScene(new FroggerScene());
}

bootstrap().catch(console.error);
