# Systems Integrator - Day 1 Task Checklist

## Setup & Verify (Do First)

### Task 1: Run the app
```bash
npm install
npm run dev
```
- [ ] App loads without errors
- [ ] See start screen with "FROGGER" title
- [ ] Press SPACE transitions to playing state
- [ ] Lanes render (green, gray, blue bands visible)

---

## Morning Tasks

### Task 2: Verify game state machine works
**File:** `src/scenes/FroggerScene.ts`

Test these transitions manually:
- [ ] `start` → press SPACE → `playing`
- [ ] `playing` → (when ED implements collision) → `gameOver`
- [ ] `playing` → (when ED implements goal detection) → `victory`
- [ ] `gameOver` → press SPACE → `start`
- [ ] `victory` → press SPACE → `start`

The state machine is already implemented at **line 257-265**. Just verify it works.

---

### Task 3: Review entity types with Content Architect
**File:** `src/entities/types.ts`

Walk through with CA:
- [ ] `Point` - x, y coordinates (line 4-7)
- [ ] `Frog` - position, lives, isAlive, isOnLog (line 9-15)
- [ ] `Obstacle` - id, position, width, velocity, type (line 19-25)
- [ ] `Lane` - y, type, obstacles, spawnRate, direction, speed (line 29-36)

Ask CA: "Does this cover what you need for the UI?"

---

### Task 4: Verify lane configuration
**File:** `src/scenes/FroggerScene.ts`, method `createLanes()` (line 70-106)

Check the layout makes sense:
```
Rows 0-6:   goal (green)
Rows 7-11:  water (blue) - will have logs
Row 12:     safe middle (green)
Rows 13-17: road (gray) - will have cars
Rows 18-19: safe start (green)
```

- [ ] Lanes render in correct positions
- [ ] Colors are distinguishable

---

## Afternoon Tasks

### Task 5: Test keyboard input
**File:** `src/scenes/FroggerScene.ts`, method `onKeyDown()` (line 255-293)

- [ ] Arrow keys mapped correctly (line 22-31)
- [ ] WASD mapped correctly
- [ ] H key toggles help (line 271-274) - overlay should show
- [ ] D key toggles debug (line 277-280) - panel should show
- [ ] G key only works when debug is on (line 283-286)

---

### Task 6: Prepare for Engine Developer integration
**File:** `src/scenes/FroggerScene.ts`

The systems are already imported and instantiated (lines 9-11, 41-43):
```typescript
private movementSystem = new MovementSystem();
private collisionSystem = new CollisionSystem();
private spawnSystem = new SpawnSystem();
```

When ED finishes their implementations:
- [ ] Movement: `moveFrog()` called at line 291
- [ ] Collision: `update()` called at line 117
- [ ] Spawn: `update()` called at line 114

**Nothing to code here** - just be ready to test when ED is done.

---

### Task 7: Prepare for Content Architect integration
**File:** `src/scenes/FroggerScene.ts`

UI functions are already imported and called (lines 14-19, 166-177):
```typescript
renderStartScreen(renderer);
renderGameOverScreen(renderer, this.gameData.score);
renderVictoryScreen(renderer, this.gameData.score);
renderHUD(renderer, this.gameData.frog.lives, this.gameData.score);
```

When CA finishes their screens:
- [ ] Start screen looks good
- [ ] Game over screen shows score
- [ ] Victory screen shows score
- [ ] HUD shows lives and score during play

---

### Task 8: Test frog rendering
**File:** `src/scenes/FroggerScene.ts`, method `renderFrog()` (line 237-240)

- [ ] Frog appears as green square
- [ ] Frog starts at bottom center (x=10, y=19)

---

## End of Day

### Task 9: Integration test with team
Once ED and CA have working pieces:
- [ ] Frog moves with arrow keys (ED's MovementSystem)
- [ ] Cars appear and move (ED's SpawnSystem + MovementSystem)
- [ ] Hitting a car triggers game over (ED's CollisionSystem)
- [ ] Reaching top triggers victory (ED's CollisionSystem)
- [ ] All screens display correctly (CA's UI)
- [ ] Can restart after win/loss

---

### Task 10: Commit working state
```bash
git add -A
git commit -m "Day 1: Basic game loop working"
git push
```

---

## Quick Reference

| What | Where |
|------|-------|
| Game state | `FroggerScene.ts:35` |
| State transitions | `FroggerScene.ts:257-265` |
| Lane config | `FroggerScene.ts:70-106` |
| Movement call | `FroggerScene.ts:291` |
| Collision call | `FroggerScene.ts:117` |
| Death handling | `FroggerScene.ts:139-153` |
| Victory handling | `FroggerScene.ts:156-159` |
