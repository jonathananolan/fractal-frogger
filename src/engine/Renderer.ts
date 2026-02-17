import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";
import type { Renderer as IRenderer } from "./types.js";
import { CELL_SIZE, VehicleSize } from "./types.js";
import { SPRITE_PATH, VEHICLES_BY_SIZE } from "../sprites.js";
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
  ): void {
    const g = new Graphics();
    g.rect(
      gridX * CELL_SIZE,
      gridY * CELL_SIZE,
      widthCells * CELL_SIZE,
      heightCells * CELL_SIZE,
    );
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
      fontFamily: 'monospace',
    });
    const t = new Text({ text, style });
    t.anchor.set(options?.anchor ?? 0, 0);
    t.x = pixelX;
    t.y = pixelY;
    this.drawContainer.addChild(t);
  }

  drawKeyCap(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    // Draw the rounded rectangle background
    const bg = new Graphics();
    bg.roundRect(x - width / 2, y - height / 2, width, height, 6);
    bg.fill(0x333333);
    bg.stroke({ color: 0x666666, width: 2 });
    this.drawContainer.addChild(bg);

    // Draw the label text centered on the keycap
    const style = new TextStyle({ fontSize: 14, fill: 0xffffff });
    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    this.drawContainer.addChild(text);
  }

  drawVehicle(gridX: number, gridY: number, size: VehicleSize): void {
    const vehiclesToChooseFrom = VEHICLES_BY_SIZE[size];
    const index = Math.floor(Math.random() * vehiclesToChooseFrom.length);

    const picked = vehiclesToChooseFrom[index];

    const texture = Assets.get(SPRITE_PATH + picked.file);
    const sprite = new Sprite(texture);
    sprite.x = gridX * CELL_SIZE;
    sprite.y = gridY * CELL_SIZE;
    sprite.height = CELL_SIZE;
    sprite.width = (picked.length / 48) * CELL_SIZE; // scale length relative to 48px base width
    this.drawContainer.addChild(sprite);
  }

  clear(): void {
    this.drawContainer.removeChildren();
  }
}
