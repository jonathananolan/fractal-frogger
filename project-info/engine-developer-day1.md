# Engine Developer - Day 1 Tasks

## Files to Create/Work In

- `src/systems/MovementSystem.ts`
- `src/systems/CollisionSystem.ts`

---

## Morning: Movement System

| Task                                         | File                            |
| -------------------------------------------- | ------------------------------- |
| Create `MovementSystem.ts`                   | `src/systems/MovementSystem.ts` |
| Frog moves one grid cell per arrow key press | `src/systems/MovementSystem.ts` |
| Prevent frog from moving off grid edges      | `src/systems/MovementSystem.ts` |
| Obstacles move by velocity each tick         | `src/systems/MovementSystem.ts` |

**Movement reference:**

- Frog: discrete (ArrowUp/W = y-1, Down/S = y+1, Left/A = x-1, Right/D = x+1)
- Obstacles: continuous (`position.x += velocity * dt`)

---

## Afternoon: Collision System

| Task                                              | File                             |
| ------------------------------------------------- | -------------------------------- |
| Create `CollisionSystem.ts`                       | `src/systems/CollisionSystem.ts` |
| Point-in-rectangle collision check                | `src/systems/CollisionSystem.ts` |
| Detect frog hitting car → return collision event  | `src/systems/CollisionSystem.ts` |
| Detect frog reaching goal zone → return win event | `src/systems/CollisionSystem.ts` |
| Test collision accuracy                           | Manual testing                   |

**Collision formula:**

```
frog.x >= obstacle.x &&
frog.x < obstacle.x + obstacle.width &&
frog.y === obstacle.y
```

---

## End of Day Checklist

- [ ] Hand off working systems to Systems Integrator
- [ ] Frog movement feels responsive
- [ ] Collision detection works correctly
- [ ] Commit and push

---

## Reference

### Grid Coordinates

```
(0,0) ----→ x (19,0)
  |
  |
  ↓
  y
(0,19)      (19,19)

Top rows = goal
Middle rows = water, then road
Bottom rows = safe zone (start)
```

Grid is 20x20. Frog is 1x1 cell. Use grid coordinates, not pixels.
