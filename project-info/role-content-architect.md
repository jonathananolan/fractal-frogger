# Content Architect Checklist

**Role:** Define entities, design UI, create visual identity, build all screens.

**Your files:**

- `src/entities/types.ts` (shared with SI)
- `src/ui/StartScreen.ts`
- `src/ui/GameOverScreen.ts`
- `src/ui/VictoryScreen.ts`
- `src/ui/HUD.ts`
- `src/ui/HelpOverlay.ts`
- `src/ui/DebugPanel.ts`

---

## Day 1: Entities & Core Screens

**Goal:** Define what exists in the game, create the essential screens.

### Morning

- [ ] Work with SI to define entity types in `src/entities/types.ts`:
  ```typescript
  Point { x, y }
  Frog { position, lives, isAlive }
  Obstacle { id, position, width, velocity, type }
  Lane { y, type, obstacles, direction, speed }
  ```
- [ ] Define color palette:
  - [ ] Frog color (green?)
  - [ ] Car colors (vary by lane?)
  - [ ] Road color (gray)
  - [ ] Grass/safe zone color (green)
  - [ ] Goal zone color

### Afternoon

- [ ] Create `src/ui/StartScreen.ts`
  - [ ] Game title "FROGGER"
  - [ ] "Press SPACE to start"
  - [ ] Controls hint: "Arrow keys to move"
- [ ] Create `src/ui/GameOverScreen.ts`
  - [ ] "GAME OVER" text
  - [ ] Final score display
  - [ ] "Press SPACE to restart"
- [ ] Create `src/ui/VictoryScreen.ts`
  - [ ] "YOU WIN!" text
  - [ ] Final score display
  - [ ] "Press SPACE to play again"

### End of Day

- [ ] All three screens render correctly
- [ ] Colors look good together
- [ ] Hand off to SI for integration
- [ ] Commit and push

---

## Day 2: HUD & Visual Polish

**Goal:** In-game displays for lives, score, and lane visuals.

### Morning

- [ ] Create `src/ui/HUD.ts` with:
  - [ ] Lives display (top left? hearts or number?)
  - [ ] Score display (top right?)
  - [ ] Layout that doesn't block gameplay
- [ ] Define lane visuals:
  - [ ] Safe zone: grass texture/color
  - [ ] Road lanes: gray with lane markers?
  - [ ] Water lanes: blue
  - [ ] Goal zone: distinct target areas?

### Afternoon

- [ ] Define log visuals (brown rectangles, different from cars)
- [ ] Define car visuals (vary colors by lane for variety)
- [ ] Consider: should frog look different when on log?
- [ ] Polish start/game over/victory screens if time

### End of Day

- [ ] HUD displays lives and score
- [ ] Lanes are visually distinct
- [ ] Logs look different from cars
- [ ] Commit and push

---

## Day 3: Help & Debug UI

**Goal:** Create overlay screens for help and debugging.

### Morning

- [ ] Create `src/ui/HelpOverlay.ts`
  - [ ] Semi-transparent background
  - [ ] Title: "CONTROLS"
  - [ ] List all controls:
    ```
    Arrow Keys / WASD - Move
    H - Toggle this help
    D - Toggle debug panel
    SPACE - Start / Restart
    ```
  - [ ] "Press H to close"

### Afternoon

- [ ] Create `src/ui/DebugPanel.ts`
  - [ ] Small panel (corner of screen, doesn't block play)
  - [ ] Show frog position: "Pos: (x, y)"
  - [ ] Show current lane type: "Lane: road/water/safe"
  - [ ] Show god mode status: "God: ON/OFF"
  - [ ] Maybe: show FPS or tick count
- [ ] Add timer display to HUD
  - [ ] Countdown format: "0:30" or just "30"
  - [ ] Visual warning when low (red? flashing?)

### End of Day

- [ ] Help overlay shows all controls
- [ ] Debug panel shows useful info
- [ ] Timer displays and updates
- [ ] Commit and push

---

## Day 4: Multiplayer UI

**Goal:** Support multiple players visually.

### Morning

- [ ] Design player identification:
  - [ ] Player 1 = green frog
  - [ ] Player 2 = blue frog? (or different shade)
  - [ ] Player 3+ = other colors
- [ ] Create lobby/waiting UI (if needed):
  - [ ] "Waiting for players..."
  - [ ] Show connected player count
  - [ ] QR code display area

### Afternoon

- [ ] Update victory screen for multiplayer:
  - [ ] Show rankings: 1st, 2nd, 3rd...
  - [ ] Show each player's score
  - [ ] Highlight winner
- [ ] Consider: player labels on frogs? ("P1", "P2")
- [ ] Test all UI with SI's multiplayer integration

### End of Day

- [ ] Players are visually distinct
- [ ] Multiplayer victory screen works
- [ ] All UI scales if map is larger
- [ ] Commit and push

---

## Day 5: Final Polish

**Goal:** Everything looks cohesive and polished.

### All Day

- [ ] Review all screens — consistent style?
- [ ] Check text readability (size, contrast)
- [ ] Check color consistency across all UI
- [ ] Smooth any rough visual edges
- [ ] Playtest — does anything look off?
- [ ] Final commit and push

---

## Color Reference

Define your palette here as you decide:

| Element         | Color (hex) | Notes |
| --------------- | ----------- | ----- |
| Frog            |             |       |
| Frog (Player 2) |             |       |
| Car (lane 1)    |             |       |
| Car (lane 2)    |             |       |
| Log             |             |       |
| Road            |             |       |
| Water           |             |       |
| Grass           |             |       |
| Goal            |             |       |
| UI text         |             |       |
| UI background   |             |       |

---

## Screen Layout Reference

```
┌─────────────────────────────────┐
│ Lives: ♥♥♥          Score: 000  │  ← HUD (top)
├─────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Goal zone
│ ═══════  ════  ═══════════  ══  │  ← Water + logs
│ ═══  ════════════  ═══  ══════  │  ← Water + logs
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Safe middle
│ ▬▬▬    ▬▬▬▬    ▬▬▬    ▬▬▬▬   ▬▬ │  ← Road + cars
│ ▬▬    ▬▬▬    ▬▬▬▬   ▬▬    ▬▬▬▬  │  ← Road + cars
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Safe zone (start)
│                🐸                │  ← Frog starts here
└─────────────────────────────────┘
           Timer: 30
```

---

## UI Component Interface

Each UI component should export a render function:

```typescript
// Example: HUD.ts
export function renderHUD(renderer: Renderer, lives: number, score: number, time: number): void {
  // Draw lives
  // Draw score
  // Draw timer
}
```

SI will call your render functions from FroggerScene.

---

## Testing Your UI

Before handing off:

1. [ ] Does it render without errors?
2. [ ] Is text readable at game resolution?
3. [ ] Do colors work well together?
4. [ ] Does it look good on the 600x600 canvas?
5. [ ] Did you commit?
