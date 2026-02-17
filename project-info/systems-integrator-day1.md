# Systems Integrator - Day 1 Tasks

## Files to Create/Work In

- `src/scenes/FroggerScene.ts` (main game file)
- `src/entities/types.ts` (shared with CA)
- `src/main.ts` (entry point)

---

## Morning: Scaffold & Setup

| Task                                                     | File                         |
| -------------------------------------------------------- | ---------------------------- |
| Review PRD with team, answer questions                   | Meeting                      |
| Create folder structure (`systems/`, `entities/`, `ui/`) | Project structure            |
| Define Frog, Obstacle, Lane types with CA                | `src/entities/types.ts`      |
| Create FroggerScene scaffold with stubbed methods        | `src/scenes/FroggerScene.ts` |

---

## Afternoon: Game State & Integration

| Task                                                | File                         |
| --------------------------------------------------- | ---------------------------- |
| Implement game state machine                        | `src/scenes/FroggerScene.ts` |
| Wire SPACE key to transition states                 | `src/scenes/FroggerScene.ts` |
| Create hardcoded lane config (3 safe, 4 road, goal) | `src/scenes/FroggerScene.ts` |
| Integrate ED's movement system when ready           | `src/scenes/FroggerScene.ts` |
| Integrate ED's collision system when ready          | `src/scenes/FroggerScene.ts` |
| Integrate CA's screens when ready                   | `src/scenes/FroggerScene.ts` |

**State machine:**

```
START → PLAYING → VICTORY | GAME_OVER
        ↑__________________________|
```

---

## End of Day Checklist

- [ ] Full game loop works: start → play → win/lose → restart
- [ ] Commit and push working MVP
- [ ] Quick demo to team

---

## Reference

### Integration Checklist

Use this when wiring new systems:

```
[ ] Import the system/component
[ ] Initialize in init()
[ ] Call update in update() loop
[ ] Call render in render() if needed
[ ] Test the integration
[ ] Commit
```

### Lane Configuration (Day 1)

```
Row 0:     Goal zone
Rows 1-4:  Road lanes (cars)
Rows 5-7:  Safe zone (grass)
```

Water lanes come Day 2.

### Unblocking the Team

If someone is stuck:

1. Understand the blocker — What specifically isn't working?
2. Check interfaces — Are they getting the data they expect?
3. Stub if needed — Give them fake data so they can keep working
4. Pair if complex — Sometimes 10 minutes together saves an hour
