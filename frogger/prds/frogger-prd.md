# Frogger PRD

**Author:** [Systems Integrator Name]
**Date:** February 17, 2026
**Team:** Content Architect, Engine Developer, Systems Integrator

---

## Vision

Build a polished, single-player Frogger game that demonstrates strong fundamentals—collision detection, game states, and clean architecture—then progressively enhance it with multiplayer, debugging tools, and polish features throughout the week.

**Guiding Principle:** Simple and very polished is better than complicated. No dead time.

---

## Context

This is a team project for Fractal Tech's accelerator program. We're using an existing PixiJS v8 scaffold (from the Snake game) that provides:
- Fixed-timestep game loop (150ms ticks, ~6.67 ticks/sec)
- Grid-based coordinate system (20x20 grid, 30px cells, 600x600 canvas)
- Scene interface (`init`, `update`, `render`, `onKeyDown`, `onKeyUp`, `destroy`)
- Renderer with `drawRect` (grid coords) and `drawText` (pixel coords)

The scaffold handles the engine plumbing. Our job is to replace `SnakeScene.ts` with `FroggerScene.ts` and build out the game systems.

---

## Team Roles & Responsibilities

### Systems Integrator (SI)
**Owns:** PRD, architecture, state management, integration, unblocking

| Day | Primary Responsibilities |
|-----|-------------------------|
| 1 (Mon/Tue) | Finalize PRD, define interfaces, create `FroggerScene.ts` scaffold with stubbed systems |
| 2 (Wed) | Wire systems together, manage game state machine, handle integration blockers |
| 3 (Thu) | Multiplayer integration (WebSockets), refactoring for cross-cutting concerns |
| 4 (Fri) | Polish, bug fixes, final integration |
| 5 (Sat) | Demo preparation |

### Engine Developer (ED)
**Owns:** Core game systems, collision detection, physics, movement, game mechanics

| Day | Primary Responsibilities |
|-----|-------------------------|
| 1 (Mon/Tue) | Collision system, movement system (frog + lanes) |
| 2 (Wed) | Lane generation, obstacle/log spawning, win/lose conditions |
| 3 (Thu) | Multiplayer frog logic, god mode, timer system |
| 4 (Fri) | Performance tuning, edge cases, polish |
| 5 (Sat) | Support demo |

### Content Architect (CA)
**Owns:** Entities, components (data), UI, visual design, screens

| Day | Primary Responsibilities |
|-----|-------------------------|
| 1 (Mon/Tue) | Entity definitions (Frog, Car, Log, etc.), start screen UI |
| 2 (Wed) | Game over screen, victory screen, score display |
| 3 (Thu) | Help overlay (H key), debug panel (D key), visual polish |
| 4 (Fri) | Animation polish, color schemes, final UI tweaks |
| 5 (Sat) | Support demo |

---

## Milestones

### Phase 1: MVP (End of Day 1)
**Goal:** Playable single-player Frogger with win/lose conditions

**Features:**
- Frog moves on grid (arrow keys / WASD)
- 3 zones: safe zone (bottom), road zone (middle), goal zone (top)
- Cars move horizontally across road lanes at varying speeds
- Collision with car = death = game over
- Reach top = victory
- Start screen, game over screen, victory screen
- Press SPACE to start/restart

**Success Criteria:**
- Player can complete a full game loop (start → play → win or lose → restart)
- Collisions feel correct
- No crashes or visual glitches

### Phase 2: Full Feature (End of Day 3)
**Goal:** Polished single-player with water zone and quality-of-life features

**Features:**
- Water zone with logs (between road and goal)
- Frog rides on logs; falling in water = death
- Multiple lives (3 lives per game)
- Score system (bonus for time remaining, lives remaining)
- Timer per crossing attempt
- Help overlay (press H)
- Debug panel (press D) - shows frog position, current lane, collision boxes
- God mode toggle (for testing)

**Success Criteria:**
- Water/log mechanics feel good
- UI is informative but not cluttered
- Debug tools work and help development

### Phase 3: Multiplayer (End of Day 4)
**Goal:** 2+ players racing to cross simultaneously

**Features:**
- WebSocket connection for real-time sync
- Multiple frogs on same map
- QR code to join game
- Larger map (scale up for more players)
- "Fun thing" when frogs collide (bounce? swap positions?)
- Victory screen shows all player rankings

**Success Criteria:**
- Two players on different devices can play simultaneously
- Latency feels acceptable
- No desyncs or crashes

### Phase 4: Polish (Day 5)
**Goal:** Demo-ready product

**Features:**
- Visual polish (consistent color palette, smooth animations)
- Sound effects (optional stretch)
- Edge case handling
- Performance optimization

---

## Architecture

### Game State Machine
```
START → PLAYING → (VICTORY | GAME_OVER) → START
```

The Systems Integrator owns this state machine in `FroggerScene.ts`.

### Entity Definitions (Content Architect)

```typescript
interface Point {
  x: number;
  y: number;
}

interface Frog {
  position: Point;
  lives: number;
  isAlive: boolean;
  isOnLog: boolean;
  currentLogId?: string;
}

interface Obstacle {
  id: string;
  position: Point;
  width: number;      // in grid cells
  velocity: number;   // cells per tick (positive = right, negative = left)
  type: 'car' | 'log' | 'turtle';
}

interface Lane {
  y: number;
  type: 'safe' | 'road' | 'water' | 'goal';
  obstacles: Obstacle[];
  spawnRate: number;  // ticks between spawns
  direction: 1 | -1;  // 1 = right, -1 = left
  speed: number;      // base obstacle speed
}

interface GameData {
  frog: Frog;
  lanes: Lane[];
  score: number;
  timeRemaining: number;
  level: number;
}
```

### Systems (Engine Developer)

**MovementSystem**
- Handles frog discrete movement (one cell per input)
- Handles obstacle continuous movement (velocity-based)
- Handles frog riding on logs (frog inherits log velocity)

**CollisionSystem**
- Checks frog vs obstacles each tick
- Car collision → death
- Log collision → frog rides log
- Water (no log) → death
- Goal zone → victory

**SpawnSystem**
- Spawns obstacles at lane edges based on spawn rate
- Removes obstacles that exit the grid

**TimerSystem**
- Counts down time per attempt
- Time out → lose a life

### Integration Points (Systems Integrator)

`FroggerScene.ts` wires everything:
```typescript
class FroggerScene implements Scene {
  private state: GameState;
  private gameData: GameData;

  // Systems
  private movementSystem: MovementSystem;
  private collisionSystem: CollisionSystem;
  private spawnSystem: SpawnSystem;

  update(dt: number) {
    if (this.state !== 'playing') return;

    this.spawnSystem.update(this.gameData);
    this.movementSystem.update(this.gameData, dt);
    this.collisionSystem.update(this.gameData);

    this.checkWinLose();
  }
}
```

---

## Detailed Task Breakdown

### Day 1 Tasks

#### Systems Integrator
1. Create `FroggerScene.ts` with stubbed structure
2. Implement game state machine (START, PLAYING, VICTORY, GAME_OVER)
3. Define TypeScript interfaces for all entities
4. Wire initial lane configuration (hardcoded for MVP)
5. Connect movement and collision systems once ED delivers

#### Engine Developer
1. Implement `MovementSystem` - frog moves one cell per arrow key
2. Implement basic `CollisionSystem` - point-in-rectangle check
3. Implement obstacle movement (move all obstacles each tick)
4. Test collision detection works correctly

#### Content Architect
1. Define entity data structures with SI
2. Create start screen (title, "Press SPACE to start")
3. Create game over screen (score, "Press SPACE to restart")
4. Create victory screen
5. Define color scheme (frog color, car colors, lane colors)

### Day 2 Tasks

#### Systems Integrator
1. Add water zone to lane configuration
2. Integrate log-riding mechanic
3. Add lives system
4. Add score tracking

#### Engine Developer
1. Implement log-riding (frog velocity = log velocity when on log)
2. Implement water death (frog in water lane but not on log)
3. Implement `SpawnSystem` for continuous obstacle generation
4. Add obstacle despawning at grid edges

#### Content Architect
1. Lives display UI
2. Score display UI
3. Design lane visuals (road = gray, water = blue, grass = green)
4. Create log/turtle visual distinction

### Day 3 Tasks

#### Systems Integrator
1. Implement timer system
2. Add help overlay (H key)
3. Add debug panel framework (D key)
4. Begin WebSocket server setup

#### Engine Developer
1. Integrate timer with game loop
2. Add god mode toggle (no death)
3. Implement debug data collection (positions, collision boxes)
4. Begin multiplayer frog state sync

#### Content Architect
1. Timer display UI
2. Help overlay content (controls list)
3. Debug panel layout (show frog pos, lane info)
4. Polish existing screens

### Day 4 Tasks

#### Systems Integrator
1. Complete WebSocket integration
2. Implement QR code join
3. Handle multiplayer state sync
4. Scale map for multiplayer

#### Engine Developer
1. Multiple frog collision handling
2. Frog-frog "fun interaction" (bounce back?)
3. Network latency compensation
4. Edge case fixes

#### Content Architect
1. Multiplayer lobby UI
2. Player identification (colors/numbers)
3. Leaderboard/ranking display
4. Final visual polish

### Day 5 Tasks

#### Everyone
1. Bug fixes
2. Play testing
3. Demo preparation
4. Documentation

---

## Interface Contracts

### Scene ↔ Systems

```typescript
// Systems Integrator provides this to Engine Developer
interface SystemContext {
  gameData: GameData;
  gridSize: number;
}

// Engine Developer implements
interface GameSystem {
  update(context: SystemContext, dt: number): void;
}
```

### Input Handling

| Key | Action | State |
|-----|--------|-------|
| SPACE | Start/Restart | START, GAME_OVER, VICTORY |
| Arrow keys / WASD | Move frog | PLAYING |
| H | Toggle help | PLAYING |
| D | Toggle debug | PLAYING |
| G | Toggle god mode | PLAYING (debug only) |

### Rendering Contract

Content Architect provides render methods; Systems Integrator calls them:

```typescript
interface UIRenderer {
  renderStartScreen(renderer: Renderer): void;
  renderGameOverScreen(renderer: Renderer, score: number): void;
  renderVictoryScreen(renderer: Renderer, score: number): void;
  renderHUD(renderer: Renderer, gameData: GameData): void;
  renderHelpOverlay(renderer: Renderer): void;
  renderDebugPanel(renderer: Renderer, debugData: DebugData): void;
}
```

---

## Out of Scope (This Week)

- Music/sound effects (nice-to-have if time permits)
- Roguelike elements
- Combat
- Resource management
- Persistent leaderboard database
- Mobile touch controls

---

## Open Questions

1. **Map size for multiplayer:** Do we scale up the grid (30x30?) or keep 20x20 and zoom out? → SI to decide by Day 3
2. **Frog-frog collision behavior:** Bounce back? Pass through? Swap positions? → Team to decide during playtesting
3. **Timer duration:** How many seconds per crossing? → Start with 30s, tune during playtesting

---

## Success Metrics

| Milestone | Metric |
|-----------|--------|
| MVP | Can complete full game loop without crashes |
| Full Feature | Debug tools help identify and fix bugs faster |
| Multiplayer | 2 players can play simultaneously with <200ms perceived latency |
| Polish | Team is proud to demo the game |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Stick to phase definitions; nice-to-haves go in Phase 4+ |
| Integration delays | Daily standups; SI unblocks immediately |
| Multiplayer complexity | Get single-player rock solid first; multiplayer is additive |
| Merge conflicts | Clear file ownership; systems in separate files |

---

## File Structure

```
src/
├── engine/           # (unchanged from scaffold)
│   ├── types.ts
│   ├── Game.ts
│   ├── Renderer.ts
│   └── Input.ts
├── scenes/
│   └── FroggerScene.ts    # SI owns, wires everything
├── systems/               # ED owns
│   ├── MovementSystem.ts
│   ├── CollisionSystem.ts
│   └── SpawnSystem.ts
├── entities/              # CA defines, SI creates
│   └── types.ts           # Frog, Obstacle, Lane, etc.
├── ui/                    # CA owns
│   ├── StartScreen.ts
│   ├── GameOverScreen.ts
│   ├── VictoryScreen.ts
│   ├── HUD.ts
│   └── DebugPanel.ts
└── main.ts               # Entry point (minimal changes)
```

---

## Next Steps

1. **SI:** Create initial file structure and stubbed `FroggerScene.ts`
2. **CA:** Define entity types in `entities/types.ts`
3. **ED:** Start `MovementSystem.ts` and `CollisionSystem.ts`
4. **All:** Daily standup to sync progress and unblock
