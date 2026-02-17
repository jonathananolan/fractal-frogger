# Systems Integrator Checklist

**Role:** Own the PRD, wire everything together, manage game state, unblock the team.

**Your files:**

- `src/scenes/FroggerScene.ts` (main game file)
- `src/entities/types.ts` (shared with CA)
- `src/main.ts` (entry point)
- WebSocket server (Day 4)

---

## Day 1: Scaffold & Wire

**Goal:** Get the basic game structure running so ED and CA can plug in their pieces.

### Morning

- [ ] Review PRD with team, answer questions
- [ ] Create folder structure (`systems/`, `entities/`, `ui/`)
- [ ] Create `src/entities/types.ts` with CA — define Frog, Obstacle, Lane types
- [ ] Create `FroggerScene.ts` scaffold with stubbed methods

### Afternoon

- [ ] Implement game state machine: `START → PLAYING → VICTORY | GAME_OVER`
- [ ] Wire up SPACE key to transition states
- [ ] Create hardcoded lane configuration (3 safe rows, 4 road rows, goal row)
- [ ] Integrate ED's movement system when ready
- [ ] Integrate ED's collision system when ready
- [ ] Integrate CA's screens when ready

### End of Day

- [ ] Full game loop works: start → play → win/lose → restart
- [ ] Commit and push working MVP
- [ ] Quick demo to team

---

## Day 2: Lives, Score, Water

**Goal:** Add water zone, lives system, and scoring.

### Morning

- [ ] Add water zone to lane configuration (between road and goal)
- [ ] Add log lanes to configuration
- [ ] Implement lives system (start with 3, lose 1 on death)
- [ ] Implement respawn logic (frog returns to start on death)

### Afternoon

- [ ] Integrate ED's log-riding mechanic
- [ ] Integrate ED's water death detection
- [ ] Add score tracking (points for crossing)
- [ ] Wire CA's lives display to game state
- [ ] Wire CA's score display to game state

### End of Day

- [ ] Water/logs working
- [ ] Lives decrement correctly
- [ ] Score displays and updates
- [ ] Commit and push

---

## Day 3: Timer & Debug Tools

**Goal:** Add timer pressure and developer tools.

### Morning

- [ ] Implement timer system (countdown per attempt)
- [ ] Timer runs out = lose a life
- [ ] Wire timer to CA's timer display

### Afternoon

- [ ] Add H key → toggle help overlay
- [ ] Add D key → toggle debug panel
- [ ] Add G key → toggle god mode (only when debug is on)
- [ ] Collect debug data (frog position, current lane, state) for debug panel
- [ ] Wire ED's god mode flag

### End of Day

- [ ] Timer works and feels right (tune duration)
- [ ] Help overlay shows controls
- [ ] Debug panel shows useful info
- [ ] Commit and push

---

## Day 4: Multiplayer

**Goal:** Two players can play on different devices.

### Morning

- [ ] Set up WebSocket server (Express + ws or Socket.io)
- [ ] Define message protocol: `join`, `move`, `state_sync`, `game_over`
- [ ] Generate game room IDs
- [ ] Implement QR code generation for join URL

### Afternoon

- [ ] Sync game state across clients
- [ ] Handle multiple frogs in FroggerScene
- [ ] Scale up map if needed (more rows/columns)
- [ ] Integrate ED's multiplayer collision logic
- [ ] Handle player disconnect gracefully

### End of Day

- [ ] Two players can join same game
- [ ] Both see each other's frogs
- [ ] Game ends correctly for all players
- [ ] Commit and push

---

## Day 5: Polish & Demo Prep

**Goal:** Make it demo-ready.

### All Day

- [ ] Fix any remaining bugs
- [ ] Playtest with team — note rough edges
- [ ] Tune difficulty (timer, car speeds, spawn rates)
- [ ] Final visual polish pass
- [ ] Write demo script: what do you show? what do you say?
- [ ] Practice demo
- [ ] Final commit and push

---

## Your Integration Checklist

Use this when wiring new systems:

```
[ ] Import the system/component
[ ] Initialize in init()
[ ] Call update in update() loop
[ ] Call render in render() if needed
[ ] Test the integration
[ ] Commit
```

---

## Unblocking the Team

If someone is stuck:

1. **Understand the blocker** — What specifically isn't working?
2. **Check interfaces** — Are they getting the data they expect?
3. **Stub if needed** — Give them fake data so they can keep working
4. **Pair if complex** — Sometimes 10 minutes together saves an hour

---

## Daily Standup Questions

1. What did you finish yesterday?
2. What are you working on today?
3. Any blockers I can help with?
