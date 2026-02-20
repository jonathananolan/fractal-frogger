import type { LeaderboardEntry } from '../../shared/types.js';

function hexToCSS(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function updateLeaderboard(players: LeaderboardEntry[], localPlayerId: string | null): void {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  list.innerHTML = '';

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const entry = document.createElement('li');
    entry.className = 'leaderboard-entry';
    if (player.id === localPlayerId) {
      entry.style.background = 'rgba(124, 233, 124, 0.15)';
    }

    entry.innerHTML = `
      <span class="leaderboard-rank">${i + 1}.</span>
      <span class="leaderboard-color-dot" style="background-color: ${hexToCSS(player.color)}"></span>
      <span class="leaderboard-name">${escapeHtml(player.name)}</span>
      <span class="leaderboard-score">${player.score}</span>
    `;
    list.appendChild(entry);
  }
}
