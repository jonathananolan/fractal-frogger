# Engine Developer Checklist

**Role:** Build the core game systems — movement, collision, spawning, physics.

**Your files:**
- `src/systems/MovementSystem.ts`
- `src/systems/CollisionSystem.ts`
- `src/systems/SpawnSystem.ts`

---

## Day 1: Movement & Collision

**Goal:** Frog moves, cars move, collisions work.

### Morning
- [ ] Create `src/systems/MovementSystem.ts`
- [ ] Implement frog movement: one grid cell per arrow key press
- [ ] Prevent frog from moving off the grid edges
- [ ] Implement obstacle movement: move by velocity each tick

### Afternoon
- [ ] Create `src/systems/CollisionSystem.ts`
- [ ] Implement point-in-rectangle collision check
- [ ] Detect frog hitting a car → return collision event
- [ ] Detect frog reaching goal zone → return win event
- [ ] Test collisions feel accurate (not too strict, not too loose)

### End of Day
- [ ] Hand off working systems to SI for integration
- [ ] Frog movement feels responsive
- [ ] Collision detection works correctly
- [ ] Commit and push

---

## Day 2: Logs & Spawning

**Goal:** Logs work, obstacles spawn continuously.

### Morning
- [ ] Implement log-riding mechanic:
  - [ ] Detect frog landing on log
  - [ ] Frog inherits log velocity while on log
  - [ ] Frog moves with log each tick
- [ ] Implement water death:
  - [ ] Frog in water lane + not on log = death

### Afternoon
- [ ] Create `src/systems/SpawnSystem.ts`
- [ ] Spawn obstacles at lane edges based on spawn rate
- [ ] Vary spawn timing slightly for natural feel
- [ ] Despawn obstacles when they exit the grid
- [ ] Different speeds for different lanes

### End of Day
- [ ] Log riding feels good
- [ ] Water death works correctly
- [ ] Obstacles spawn and despawn smoothly
- [ ] Commit and push

---

## Day 3: Timer & Debug Support

**Goal:** Support timer system, add god mode, provide debug data.

### Morning
- [ ] Add god mode flag to collision system
- [ ] When god mode = true, collisions don't trigger death
- [ ] Expose debug data function:
  ```typescript
  getDebugData(): {
    frogPosition: Point;
    currentLaneType: string;
    isOnLog: boolean;
    nearestObstacles: Obstacle[];
  }
  ```

### Afternoon
- [ ] Support SI's timer integration (no blocking work needed)
- [ ] Test edge cases:
  - [ ] Frog at exact edge of log
  - [ ] Two cars passing frog simultaneously
  - [ ] Frog moving onto log that's about to despawn
- [ ] Fix any edge case bugs

### End of Day
- [ ] God mode toggles correctly
- [ ] Debug data is accurate
- [ ] Edge cases handled
- [ ] Commit and push

---

## Day 4: Multiplayer Support

**Goal:** Handle multiple frogs, frog-frog interactions.

### Morning
- [ ] Update MovementSystem to handle array of frogs
- [ ] Each frog moves independently
- [ ] Each frog can ride logs independently

### Afternoon
- [ ] Implement frog-frog collision detection
- [ ] Decide and implement collision behavior:
  - Option A: Bounce back (both frogs pushed apart)
  - Option B: Pass through (no collision)
  - Option C: Swap positions (fun chaos)
- [ ] Test with SI's multiplayer integration
- [ ] Handle edge case: two frogs on same log

### End of Day
- [ ] Multiple frogs work correctly
- [ ] Frog-frog interaction feels fun
- [ ] No crashes with multiple players
- [ ] Commit and push

---

## Day 5: Polish & Edge Cases

**Goal:** Bulletproof the systems.

### All Day
- [ ] Playtest — note any weird behavior
- [ ] Fix collision edge cases
- [ ] Tune values:
  - [ ] Car speeds (feel challenging but fair)
  - [ ] Log speeds (not too fast to hop on)
  - [ ] Spawn rates (busy but not impossible)
- [ ] Performance check — no lag with many obstacles
- [ ] Final commit and push

---

## Collision Detection Reference

```
Point-in-Rectangle Check:

frog.x >= obstacle.x &&
frog.x < obstacle.x + obstacle.width &&
frog.y === obstacle.y
```

Remember: Grid coordinates, not pixels. Frog is 1x1 cell.

---

## Movement Reference

```
Frog: Discrete movement (1 cell per input)
  - ArrowUp/W: y - 1
  - ArrowDown/S: y + 1
  - ArrowLeft/A: x - 1
  - ArrowRight/D: x + 1

Obstacles: Continuous movement (velocity per tick)
  - position.x += velocity * dt
  - Wrap or despawn at grid edges
```

---

## Coordinate System

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

---

## Testing Your Systems

Before handing off to SI:
1. [ ] Does it work with hardcoded test data?
2. [ ] Does it handle edge cases (grid boundaries, etc.)?
3. [ ] Is the interface clean? (SI should just call `update()`)
4. [ ] Did you commit?
