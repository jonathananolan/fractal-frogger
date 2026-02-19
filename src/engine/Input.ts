import type { Scene } from './types.js';

const GAME_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Space',
  'KeyH',
  'KeyP',
]);

type SwipeDir = 'up' | 'down' | 'left' | 'right';

const DIR_TO_KEY: Record<SwipeDir, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

export class Input {
  private scene: Scene | null = null;
  private element: HTMLElement | null = null;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;

  // Pointer gesture handlers
  private onPointerDown: (e: PointerEvent) => void;
  private onPointerMove: (e: PointerEvent) => void;
  private onPointerUp: (e: PointerEvent) => void;
  private onPointerCancel: (e: PointerEvent) => void;

  private gesture = {
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startT: 0,
  };

  // Tunables (in CSS pixels)
  private readonly TAP_MAX_MOVE_PX = 12;
  private readonly SWIPE_MIN_DIST_PX = 35;
  private readonly SWIPE_MAX_TIME_MS = 400;

  constructor(element?: HTMLElement | null) {
    this.onKeyDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.scene?.onKeyDown(e.code);
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.scene?.onKeyUp(e.code);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Pointer gestures (tap + swipe) for mobile/desktop
    this.onPointerDown = (e: PointerEvent) => {
      if (!this.element) return;

      // Only primary contact (ignore right-click / secondary pointers)
      if ((e.pointerType === 'mouse' && e.button !== 0) || !e.isPrimary) return;

      // Capture so we still receive move/up even if finger leaves the element
      this.element.setPointerCapture?.(e.pointerId);

      const r = this.element.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      this.gesture.active = true;
      this.gesture.pointerId = e.pointerId;
      this.gesture.startX = x;
      this.gesture.startY = y;
      this.gesture.lastX = x;
      this.gesture.lastY = y;
      this.gesture.startT = performance.now();

      // Prevent scroll / double-tap zoom on mobile while interacting with the canvas
      e.preventDefault();
    };

    this.onPointerMove = (e: PointerEvent) => {
      if (!this.element) return;
      if (!this.gesture.active || e.pointerId !== this.gesture.pointerId) return;

      const r = this.element.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      this.gesture.lastX = x;
      this.gesture.lastY = y;

      e.preventDefault();
    };

    this.onPointerUp = (e: PointerEvent) => {
      if (!this.element) return;
      if (!this.gesture.active || e.pointerId !== this.gesture.pointerId) return;

      const dt = performance.now() - this.gesture.startT;
      const dx = this.gesture.lastX - this.gesture.startX;
      const dy = this.gesture.lastY - this.gesture.startY;
      const dist = Math.hypot(dx, dy);

      // TAP => Space (scene decides what to do in current state)
      if (dist <= this.TAP_MAX_MOVE_PX) {
        this.scene?.onKeyDown('Space');
      } else if (dist >= this.SWIPE_MIN_DIST_PX && dt <= this.SWIPE_MAX_TIME_MS) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let dir: SwipeDir;
        if (absX > absY) dir = dx > 0 ? 'right' : 'left';
        else dir = dy > 0 ? 'down' : 'up';

        this.scene?.onKeyDown(DIR_TO_KEY[dir]);
      }

      this.gesture.active = false;
      this.gesture.pointerId = -1;

      e.preventDefault();
    };

    this.onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId === this.gesture.pointerId) {
        this.gesture.active = false;
        this.gesture.pointerId = -1;
      }
    };

    if (element) this.attach(element);
  }

  attach(element: HTMLElement): void {
    // Detach from any existing element
    if (this.element) this.detach();
    this.element = element;

    // Strong defaults for mobile gesture reliability
    (this.element as any).style.touchAction = 'none';
    (this.element as any).style.webkitUserSelect = 'none';
    (this.element as any).style.userSelect = 'none';

    // passive:false so preventDefault actually works (important on mobile)
    this.element.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.element.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.element.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.element.addEventListener('pointercancel', this.onPointerCancel, { passive: true });
  }

  detach(): void {
    if (!this.element) return;
    this.element.removeEventListener('pointerdown', this.onPointerDown as any);
    this.element.removeEventListener('pointermove', this.onPointerMove as any);
    this.element.removeEventListener('pointerup', this.onPointerUp as any);
    this.element.removeEventListener('pointercancel', this.onPointerCancel as any);
    this.element = null;
  }

  setScene(scene: Scene | null): void {
    this.scene = scene;
  }

  destroy(): void {
    this.detach();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
