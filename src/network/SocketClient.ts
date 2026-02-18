// SocketClient - handles WebSocket connection to multiplayer server

import { io, Socket } from 'socket.io-client';
import type { Lane } from '../entities/types.js';

// Remote player representation
export interface RemotePlayer {
  id: string;
  name: string;
  color: number;
  position: { x: number; y: number };
  isAlive: boolean;
}

// Event callbacks interface
export interface SocketCallbacks {
  onWelcome: (playerId: string, color: number, players: RemotePlayer[], lanes: Lane[]) => void;
  onPlayerJoined: (playerId: string, color: number, name: string) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerMoved: (playerId: string, x: number, y: number) => void;
  onPlayerDied: (playerId: string) => void;
  onPlayerWon: (playerId: string) => void;
  onObstacles: (lanes: Lane[]) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private callbacks: SocketCallbacks | null = null;
  private _playerId: string | null = null;
  private _playerColor: number = 0x44ff44;

  get playerId(): string | null {
    return this._playerId;
  }

  get playerColor(): number {
    return this._playerColor;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Connect to the game server
   */
  connect(serverUrl: string, callbacks: SocketCallbacks): void {
    if (this.socket) {
      this.disconnect();
    }

    this.callbacks = callbacks;
    this.socket = io(serverUrl, {
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this._playerId = null;
    });

    this.socket.on('welcome', (data) => {
      this._playerId = data.playerId;
      this._playerColor = data.color;
      console.log(`Welcome! Player ID: ${data.playerId}, Color: ${data.color.toString(16)}`);
      this.callbacks?.onWelcome(data.playerId, data.color, data.players, data.lanes);
    });

    this.socket.on('playerJoined', (data) => {
      console.log(`Player joined: ${data.name}`);
      this.callbacks?.onPlayerJoined(data.playerId, data.color, data.name);
    });

    this.socket.on('playerLeft', (data) => {
      console.log(`Player left: ${data.playerId}`);
      this.callbacks?.onPlayerLeft(data.playerId);
    });

    this.socket.on('playerMoved', (data) => {
      this.callbacks?.onPlayerMoved(data.playerId, data.x, data.y);
    });

    this.socket.on('playerDied', (data) => {
      console.log(`Player died: ${data.playerId}`);
      this.callbacks?.onPlayerDied(data.playerId);
    });

    this.socket.on('playerWon', (data) => {
      console.log(`Player won: ${data.playerId}`);
      this.callbacks?.onPlayerWon(data.playerId);
    });

    this.socket.on('obstacles', (data) => {
      this.callbacks?.onObstacles(data.lanes);
    });
  }

  /**
   * Join the game
   */
  join(name?: string): void {
    this.socket?.emit('join', { name });
  }

  /**
   * Send local player position
   */
  sendMove(x: number, y: number): void {
    this.socket?.emit('move', { x, y });
  }

  /**
   * Notify server of death
   */
  sendDeath(cause: string): void {
    this.socket?.emit('death', { cause });
  }

  /**
   * Notify server of victory
   */
  sendVictory(): void {
    this.socket?.emit('victory');
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._playerId = null;
    }
  }
}

// Singleton instance
export const socketClient = new SocketClient();
