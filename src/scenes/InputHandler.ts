// Input Handler - maps keyboard input to game actions
// Uses callback pattern for scene actions

export type Direction = 'up' | 'down' | 'left' | 'right';

// Direction mapping for keyboard keys
const KEY_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

export interface InputCallbacks {
  onStartGame: () => void;
  onShootTongue: () => void;
  onToggleHelp: () => void;
  onToggleDebug: () => void;
  onMove: (direction: Direction) => void;
}

export class InputHandler {
  private callbacks: InputCallbacks;
  private isPlaying: () => boolean;

  constructor(callbacks: InputCallbacks, isPlaying: () => boolean) {
    this.callbacks = callbacks;
    this.isPlaying = isPlaying;
  }

  handleKeyDown(key: string): void {
    // ENTER: Start game from name entry screen
    if (key === 'Enter') {
      this.callbacks.onStartGame();
      return;
    }

    // SPACE: Shoot tongue during gameplay
    if (key === 'Space') {
      if (this.isPlaying()) {
        this.callbacks.onShootTongue();
      }
      return;
    }

    // Only handle other keys during play
    if (!this.isPlaying()) return;

    // H: Toggle help
    if (key === 'KeyH') {
      this.callbacks.onToggleHelp();
      return;
    }

    // P: Toggle debug
    if (key === 'KeyP') {
      this.callbacks.onToggleDebug();
      return;
    }

    // Movement
    const direction = KEY_DIRECTION[key];
    if (direction) {
      this.callbacks.onMove(direction);
    }
  }

  handleKeyUp(_key: string): void {
    // No-op for Frogger
  }
}
