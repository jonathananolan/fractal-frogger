import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import type { Renderer as IRenderer } from './types.js';
import { CELL_SIZE, SPRITE_BASE_PX, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';
import { PrizeType, SpriteData, VehicleSize } from '../../shared/types.js';
import { SPRITE_PATH, BACKGROUND_PATH } from '../sprites.js';
import { getPrizeSpritePath } from '../prizes/PrizeRegistry.js';
export class Renderer implements IRenderer {
  private app: Application;
  private drawContainer: Container;

  get stage(): Container {
    return this.app.stage;
  }

  constructor(app: Application) {
    this.app = app;
    this.drawContainer = new Container();
    this.app.stage.addChild(this.drawContainer);
  }

  drawRect(
    gridX: number,
    gridY: number,
    widthCells: number,
    heightCells: number,
    color: number,
    alpha?: number,
  ): void {
    const g = new Graphics();
    g.rect(gridX * CELL_SIZE, gridY * CELL_SIZE, widthCells * CELL_SIZE, heightCells * CELL_SIZE);
    g.fill(color);
    this.drawContainer.addChild(g);
  }

  drawText(
    text: string,
    pixelX: number,
    pixelY: number,
    options?: { fontSize?: number; color?: number; anchor?: number },
  ): void {
    const style = new TextStyle({
      fontSize: options?.fontSize ?? 24,
      fill: options?.color ?? 0xffffff,
      fontFamily: 'SuperFrog',
    });
    const t = new Text({ text, style });
    t.anchor.set(options?.anchor ?? 0, 0);
    t.x = pixelX;
    t.y = pixelY;
    this.drawContainer.addChild(t);
  }

  drawKeyCap(label: string, x: number, y: number, width: number, height: number): void {
    // Draw the rounded rectangle background
    const bg = new Graphics();
    bg.roundRect(x - width / 2, y - height / 2, width, height, 6);
    bg.fill(0x333333);
    bg.stroke({ color: 0x666666, width: 2 });
    this.drawContainer.addChild(bg);

    // Draw the label text centered on the keycap
    const style = new TextStyle({ fontSize: 14, fill: 0xffffff, fontFamily: 'Courier' });
    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    this.drawContainer.addChild(text);
  }

  drawVehicle(gridX: number, gridY: number, size: VehicleSize, sprite: SpriteData): void {
    const texture = Assets.get(SPRITE_PATH + sprite.file); // get cached texture
    const pixiSprite = new Sprite(texture);

    // define x, y, width of sprite
    pixiSprite.x = gridX * CELL_SIZE;
    pixiSprite.y = gridY * CELL_SIZE;
    pixiSprite.height = CELL_SIZE;
    pixiSprite.width = (sprite.length / SPRITE_BASE_PX) * CELL_SIZE; // scale length relative to 48px base width

    // render sprite
    this.drawContainer.addChild(pixiSprite);
  }

  drawPlayer(gridX: number, gridY: number, color: number): void {
    const texture = Assets.get(SPRITE_PATH + 'frog.svg');
    const frogSprite = new Sprite(texture);
    frogSprite.x = gridX * CELL_SIZE;
    frogSprite.y = gridY * CELL_SIZE;
    frogSprite.width = CELL_SIZE;
    frogSprite.height = CELL_SIZE;
    frogSprite.tint = color;
    this.drawContainer.addChild(frogSprite);
  }

  drawPrize(gridX: number, gridY: number, prizeType: PrizeType): void {
    const spritePath = getPrizeSpritePath(prizeType);
    const texture = Assets.get(spritePath);
    const prizeSprite = new Sprite(texture);
    prizeSprite.x = gridX * CELL_SIZE;
    prizeSprite.y = gridY * CELL_SIZE;
    prizeSprite.width = CELL_SIZE;
    prizeSprite.height = CELL_SIZE;
    this.drawContainer.addChild(prizeSprite);
  }

  drawBackground(path?: string): void {
    const texture = Assets.get(path ?? BACKGROUND_PATH);
    const bg = new Sprite(texture);
    bg.width = CANVAS_WIDTH;
    bg.height = CANVAS_HEIGHT;
    this.drawContainer.addChild(bg);
  }

  clear(): void {
    this.drawContainer.removeChildren();
  }
}
