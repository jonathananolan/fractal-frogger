# Content Architect - Day 1 Tasks

## Files to Create/Work In

- `src/entities/types.ts` (shared with SI)
- `src/ui/StartScreen.ts`
- `src/ui/GameOverScreen.ts`
- `src/ui/VictoryScreen.ts`

---

## Morning: Entity Types & Color Palette

| Task                        | File                    |
| --------------------------- | ----------------------- |
| Define entity types with SI | `src/entities/types.ts` |
| Define color palette        | Design decision         |

**Entity types to define:**

```typescript
Point { x, y }
Frog { position, lives, isAlive }
Obstacle { id, position, width, velocity, type }
Lane { y, type, obstacles, direction, speed }
```

**Colors to pick:**

- Frog color
- Car colors (vary by lane?)
- Road color
- Grass/safe zone color
- Goal zone color

---

## Afternoon: Core Screens

| Task             | File                       |
| ---------------- | -------------------------- |
| Start screen     | `src/ui/StartScreen.ts`    |
| Game over screen | `src/ui/GameOverScreen.ts` |
| Victory screen   | `src/ui/VictoryScreen.ts`  |

**StartScreen contents:**

- Game title "FROGGER"
- "Press SPACE to start"
- Controls hint: "Arrow keys to move"

**GameOverScreen contents:**

- "GAME OVER" text
- Final score display
- "Press SPACE to restart"

**VictoryScreen contents:**

- "YOU WIN!" text
- Final score display
- "Press SPACE to play again"

---

## End of Day Checklist

- [ ] All three screens render correctly
- [ ] Colors look good together
- [ ] Hand off to SI for integration
- [ ] Commit and push

---

## Reference

### UI Component Interface

Each UI component should export a render function:

```typescript
export function renderStartScreen(renderer: Renderer): void {
  // Draw title
  // Draw instructions
}
```

SI will call your render functions from FroggerScene.

### Screen Layout Reference

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
```

Canvas size: 600x600 pixels.

### Color Palette (fill in as you decide)

| Element      | Color (hex) | Notes |
| ------------ | ----------- | ----- |
| Frog         |             |       |
| Car (lane 1) |             |       |
| Car (lane 2) |             |       |
| Road         |             |       |
| Water        |             |       |
| Grass        |             |       |
| Goal         |             |       |
| UI text      |             |       |
