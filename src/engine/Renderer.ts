import { Input } from '@pixi/ui';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  BlurFilter,
} from 'pixi.js';
import type { Renderer as IRenderer } from './types.js';
import { CELL_SIZE, SPRITE_BASE_PX, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';
import { PrizeType, SpriteData, VehicleSize, Tongue } from '../../shared/types.js';
import { SPRITE_PATH, BACKGROUND_PATH, LOG_SPRITES } from '../sprites.js';
import { getPrizeSpritePath } from '../prizes/PrizeRegistry.js';
export class Renderer implements IRenderer {
  private app: Application;
  private drawContainer: Container;
  private drawInputs: Container; // consistent ui elements
  private nameInput: Input | null = null;
  private startButton: Container | null = null;
  private startCallback: (() => void) | null = null;

  get stage(): Container {
    return this.app.stage;
  }

  constructor(app: Application) {
    this.app = app;
    this.drawContainer = new Container();
    this.drawInputs = new Container();
    this.app.stage.addChild(this.drawContainer);
    this.app.stage.addChild(this.drawInputs);
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
    bg.fill(0x00a86b);
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

  drawLog(gridX: number, gridY: number, widthCells: number, direction: 1 | -1 = -1): void {
    const leftTexture = Assets.get(SPRITE_PATH + LOG_SPRITES.left);
    const middleTexture = Assets.get(SPRITE_PATH + LOG_SPRITES.middle);
    const rightTexture = Assets.get(SPRITE_PATH + LOG_SPRITES.right);

    // End caps are 1 cell wide each, middle fills the rest
    const endCapWidth = CELL_SIZE;
    const middleWidth = Math.max(0, widthCells * CELL_SIZE - 2 * endCapWidth);

    // For right-moving logs (direction 1), flip order and rotate each sprite 180 degrees
    const movingRight = direction === 1;

    // Draw left end (or right end flipped if moving right)
    const leftSprite = new Sprite(movingRight ? rightTexture : leftTexture);
    leftSprite.x = gridX * CELL_SIZE;
    leftSprite.y = gridY * CELL_SIZE;
    leftSprite.width = endCapWidth;
    leftSprite.height = CELL_SIZE;
    if (movingRight) {
      leftSprite.anchor.set(0.5, 0.5);
      leftSprite.rotation = Math.PI;
      leftSprite.x += endCapWidth / 2;
      leftSprite.y += CELL_SIZE / 2;
    }
    this.drawContainer.addChild(leftSprite);

    // Draw middle (stretched, rotated if moving right)
    if (middleWidth > 0) {
      const middleSprite = new Sprite(middleTexture);
      middleSprite.x = gridX * CELL_SIZE + endCapWidth;
      middleSprite.y = gridY * CELL_SIZE;
      middleSprite.width = middleWidth;
      middleSprite.height = CELL_SIZE;
      if (movingRight) {
        middleSprite.anchor.set(0.5, 0.5);
        middleSprite.rotation = Math.PI;
        middleSprite.x += middleWidth / 2;
        middleSprite.y += CELL_SIZE / 2;
      }
      this.drawContainer.addChild(middleSprite);
    }

    // Draw right end (or left end flipped if moving right)
    const rightSprite = new Sprite(movingRight ? leftTexture : rightTexture);
    rightSprite.x = gridX * CELL_SIZE + endCapWidth + middleWidth;
    rightSprite.y = gridY * CELL_SIZE;
    rightSprite.width = endCapWidth;
    rightSprite.height = CELL_SIZE;
    if (movingRight) {
      rightSprite.anchor.set(0.5, 0.5);
      rightSprite.rotation = Math.PI;
      rightSprite.x += endCapWidth / 2;
      rightSprite.y += CELL_SIZE / 2;
    }
    this.drawContainer.addChild(rightSprite);
  }

  drawPlayer(gridX: number, gridY: number, color: number, isInvincible?: boolean): void {
    const texture = Assets.get(SPRITE_PATH + 'frog.svg');
    const frogSprite = new Sprite(texture);
    frogSprite.x = gridX * CELL_SIZE;
    frogSprite.y = gridY * CELL_SIZE;
    frogSprite.width = CELL_SIZE;
    frogSprite.height = CELL_SIZE;
    frogSprite.tint = color;

    // Add glow effect when invincible
    if (isInvincible) {
      // Draw glow behind the frog
      const glow = new Graphics();
      const centerX = gridX * CELL_SIZE + CELL_SIZE / 2;
      const centerY = gridY * CELL_SIZE + CELL_SIZE / 2;
      const glowRadius = CELL_SIZE * 0.8;

      // Pulsing glow effect
      glow.circle(centerX, centerY, glowRadius);
      glow.fill({ color: 0xffff00, alpha: 0.4 });
      glow.filters = [new BlurFilter({ strength: 8 })];
      this.drawContainer.addChild(glow);

      // Make frog brighter/golden
      frogSprite.tint = 0xffdd44;
    }

    this.drawContainer.addChild(frogSprite);
  }

  drawTongue(tongue: Tongue, _frogColor: number): void {
    if (!tongue.active) return;

    const tongueWidth = 0.15; // thin tongue
    const startX = tongue.x + 0.5 - tongueWidth / 2; // center on frog
    const startY = tongue.startY;
    const tipY = tongue.currentY;
    const tongueLength = startY - tipY;

    // Draw tongue body (pink/red)
    const g = new Graphics();
    g.rect(startX * CELL_SIZE, tipY * CELL_SIZE, tongueWidth * CELL_SIZE, tongueLength * CELL_SIZE);
    g.fill(0xff6688);
    this.drawContainer.addChild(g);

    // Draw tongue tip (darker, rounded)
    const tip = new Graphics();
    const tipCenterX = (startX + tongueWidth / 2) * CELL_SIZE;
    const tipCenterY = tipY * CELL_SIZE + 0.1 * CELL_SIZE;
    tip.circle(tipCenterX, tipCenterY, tongueWidth * CELL_SIZE);
    tip.fill(0xff4466);
    this.drawContainer.addChild(tip);
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

  showNameInput(): void {
    if (!this.nameInput) {
      const width = 280;
      const height = 50;
      const border = 3;
      const radius = 10;

      // Background: green border with dark fill (local coords start at 0,0)
      const bg = new Graphics()
        .roundRect(0, 0, width, height, radius)
        .fill(0x1a3a1a)
        .stroke({ color: 0x7ce97c, width: border });

      const inputStyle = new TextStyle({
        fill: 0xffffff,
        fontSize: 22,
        fontFamily: 'SuperFrog',
      });

      this.nameInput = new Input({
        bg,
        placeholder: 'ENTER YOUR NAME',
        textStyle: inputStyle,
        align: 'center' as const,
        maxLength: 12,
        padding: {
          top: 12,
          right: 0,
          bottom: 12,
          left: 0,
        },
      });

      // Position the whole Input on the canvas (centered, below the title)
      this.nameInput.x = (CANVAS_WIDTH - width) / 2;
      this.nameInput.y = 380;

      this.drawInputs.addChild(this.nameInput);
    }
    this.nameInput.visible = true;

    // Auto-focus the input so user can start typing immediately
    setTimeout(() => {
      const inputElement = document.querySelector('input') as HTMLInputElement | null;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  }

  hideInput(): void {
    if (this.nameInput) {
      this.nameInput.visible = false;
    }
    if (this.startButton) {
      this.startButton.visible = false;
    }
  }

  getNameValue(): string {
    return this.nameInput?.value ?? '';
  }

  setStartCallback(callback: () => void): void {
    this.startCallback = callback;
  }

  showStartButton(): void {
    if (!this.startButton) {
      const width = 200;
      const height = 50;
      const border = 3;
      const radius = 10;

      this.startButton = new Container();
      this.startButton.eventMode = 'static';
      this.startButton.cursor = 'pointer';

      // Button background
      const bg = new Graphics()
        .roundRect(0, 0, width, height, radius)
        .fill(0x00a86b)
        .stroke({ color: 0x7ce97c, width: border });
      this.startButton.addChild(bg);

      // Button text
      const style = new TextStyle({
        fill: 0xffffff,
        fontSize: 24,
        fontFamily: 'SuperFrog',
      });
      const text = new Text({ text: 'TAP TO START', style });
      text.anchor.set(0.5);
      text.x = width / 2;
      text.y = height / 2;
      this.startButton.addChild(text);

      // Position centered below name input
      this.startButton.x = (CANVAS_WIDTH - width) / 2;
      this.startButton.y = 500;

      // Handle tap/click
      this.startButton.on('pointerdown', () => {
        if (this.startCallback && this.getNameValue() !== '') {
          this.startCallback();
        }
      });

      this.drawInputs.addChild(this.startButton);
    }
    this.startButton.visible = true;
  }

  clear(): void {
    const children = this.drawContainer.removeChildren();
    for (const child of children) {
      child.destroy();
    }
  }
}
