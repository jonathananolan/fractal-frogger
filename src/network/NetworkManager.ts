// Network Manager - handles all multiplayer socket communication
// Extracted from FroggerScene for single responsibility

import { socketClient, RemotePlayer } from './SocketClient.js';
import { soundManager } from '../audio/SoundManager.js';
import { updateLeaderboard } from '../ui/Leaderboard.js';
import type { Lane, LeaderboardEntry, Player, Prize, Point, Frog, GameData } from '../../shared/types.js';
import { POSITION_SYNC_INTERVAL } from '../../shared/constants.js';

// Server URL - use localhost in dev, same origin in production
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export interface NetworkCallbacks {
  onColorAssigned: (color: number) => void;
  onLanesSync: (lanes: Lane[]) => void;
  onLocalPlayerSync: (player: Player, shouldSyncPosition: boolean) => void;
  onPrizesSync: (prizes: Prize[]) => void;
  findUnoccupiedSpawnPosition: () => Point;
}

export class NetworkManager {
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private serverPrizes: Prize[] = [];
  private leaderboardData: LeaderboardEntry[] = [];
  private lastSyncTick: number = 0;
  private callbacks: NetworkCallbacks | null = null;

  get isConnected(): boolean {
    return socketClient.isConnected;
  }

  getRemotePlayers(): Map<string, RemotePlayer> {
    return this.remotePlayers;
  }

  getServerPrizes(): Prize[] {
    return this.serverPrizes;
  }

  removeServerPrize(prizeId: string): void {
    this.serverPrizes = this.serverPrizes.filter(p => p.id !== prizeId);
  }

  connect(callbacks: NetworkCallbacks): void {
    this.callbacks = callbacks;

    socketClient.connect(SERVER_URL, {
      onWelcome: (playerId, color, players, lanes) => {
        callbacks.onColorAssigned(color);
        // Add existing players (excluding self)
        for (const player of players) {
          if (player.id !== playerId) {
            this.remotePlayers.set(player.id, player);
          }
        }
        // Sync lanes from server
        callbacks.onLanesSync(lanes);
      },

      onPlayerJoined: (playerId, color, name, position) => {
        this.remotePlayers.set(playerId, {
          id: playerId,
          name,
          color,
          position,
          isAlive: true,
          score: 0,
          isInvincible: false,
        });
        // Play sound when another player joins
        soundManager.playPlayerJoined();
      },

      onPlayerLeft: (playerId) => {
        this.remotePlayers.delete(playerId);
      },

      onPlayerMoved: (playerId, x, y) => {
        const player = this.remotePlayers.get(playerId);
        if (player) {
          player.position = { x, y };
        }
      },

      onPlayerDied: (playerId) => {
        const player = this.remotePlayers.get(playerId);
        if (player) {
          player.isAlive = false;
          // Reset after brief delay
          setTimeout(() => {
            if (player) {
              player.isAlive = true;
              player.position = callbacks.findUnoccupiedSpawnPosition();
            }
          }, 1000);
        }
      },

      onPlayerWon: (playerId) => {
        console.log(`Player ${playerId} won!`);
      },

      onObstacles: (lanes) => {
        callbacks.onLanesSync(lanes);
      },

      onLeaderboard: (players) => {
        this.leaderboardData = players;
        updateLeaderboard(players, socketClient.playerId);
      },

      onGameState: (players, lanes, prizes) => {
        // Update player positions from server state
        for (const player of players) {
          if (player.id === socketClient.playerId) {
            callbacks.onLocalPlayerSync(player, true);
            continue;
          }

          const existing = this.remotePlayers.get(player.id);
          if (existing) {
            existing.position = player.position;
            existing.isAlive = player.isAlive;
            existing.score = player.score;
            existing.isInvincible = player.isInvincible;
          } else {
            // New player we haven't seen yet
            this.remotePlayers.set(player.id, {
              id: player.id,
              name: player.name,
              color: player.color,
              position: player.position,
              isAlive: player.isAlive,
              score: player.score,
              isInvincible: player.isInvincible,
            });
          }
        }
        // Sync lanes and prizes from server
        callbacks.onLanesSync(lanes);
        this.serverPrizes = prizes;
        callbacks.onPrizesSync(prizes);
      },

      onPrizeCollected: (prizeId, playerId) => {
        // Remove collected prize from local state
        this.serverPrizes = this.serverPrizes.filter(p => p.id !== prizeId);
        console.log(`Prize ${prizeId} collected by ${playerId}`);
      },
    });
  }

  join(name: string): void {
    socketClient.join(name);
  }

  sendInput(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (socketClient.isConnected) {
      socketClient.sendInput(direction);
    }
  }

  sendDeath(cause: string): void {
    if (socketClient.isConnected) {
      socketClient.sendDeath(cause);
    }
  }

  sendVictory(): void {
    if (socketClient.isConnected) {
      socketClient.sendVictory();
    }
  }

  sendScoreUpdate(score: number): void {
    if (socketClient.isConnected) {
      socketClient.sendScoreUpdate(score);
    }
  }

  sendPrizeCollected(prizeId: string): void {
    if (socketClient.isConnected) {
      socketClient.sendPrizeCollected(prizeId);
    }
  }

  disconnect(): void {
    socketClient.disconnect();
  }
}
