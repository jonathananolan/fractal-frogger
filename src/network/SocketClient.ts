// SocketClient - handles WebSocket connection to multiplayer server

import { io, Socket } from 'socket.io-client';
import { Direction, ServerGameState } from '../../shared/types';

// Event callbacks interface
export interface SocketCallbacks {
  onWelcome: (playerId: string, color: number) => void;
  onPlayerJoined: (playerId: string, color: number, name: string) => void;
  onPlayerLeft: (playerId: string) => void;
  onGameState: (state: ServerGameState) => void;
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
      this.callbacks?.onWelcome(data.playerId, data.color);
    });

    this.socket.on('playerJoined', (data) => {
      console.log(`Player joined: ${data.name}`);
      this.callbacks?.onPlayerJoined(data.playerId, data.color, data.name);
    });

    this.socket.on('playerLeft', (data) => {
      console.log(`Player left: ${data.playerId}`);
      this.callbacks?.onPlayerLeft(data.playerId);
    });

    this.socket.on('gameState', (data) => {
      console.log(`gameState data: ${data}`);
      this.callbacks?.onGameState(data);
    });
  }

  /**
   * Join the game
   */
  join(name?: string): void {
    this.socket?.emit('join', { name });
  }

  sendInput(direction: Direction): void {
    this.socket?.emit('input', { direction });
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
