# Frogger Project Milestones

**Team:** Content Architect, Engine Developer, Systems Integrator
**Week of:** February 17-22, 2026
**Demo:** Saturday

---

## The Vision

A polished Frogger game that feels good to play. Start simple, get it working, then layer on features. **Simple and polished beats complicated and buggy.**

---

## Milestone 1: "It's a Game" (End of Day 1)

**What success looks like:** You can play a complete round of Frogger from start to finish.

### The Player Experience
1. See a start screen with the game title
2. Press SPACE to begin
3. Control a frog with arrow keys (or WASD)
4. Dodge cars crossing the road
5. Reach the top of the screen to win
6. Get hit by a car and see game over
7. Press SPACE to play again

### Checklist
- [ ] Start screen appears
- [ ] Frog moves when you press keys
- [ ] Cars move across the screen
- [ ] Getting hit by a car ends the game
- [ ] Reaching the top wins the game
- [ ] Victory screen appears
- [ ] Game over screen appears
- [ ] Can restart after winning or losing

### Who Does What

| Person | Focus |
|--------|-------|
| **Systems Integrator** | Create the main game file, connect everyone's pieces, handle start/play/win/lose states |
| **Engine Developer** | Make the frog move, make cars move, detect when frog hits car or reaches goal |
| **Content Architect** | Design the start screen, win screen, lose screen, pick colors for frog/cars/lanes |

---

## Milestone 2: "It's Actually Frogger" (End of Day 2)

**What success looks like:** The game has water, logs, and multiple lives—feels like real Frogger.

### The Player Experience
1. Cross the road (avoid cars)
2. Cross the river by hopping on logs
3. Fall in water = lose a life (not instant game over)
4. Have 3 lives to work with
5. See your score increase as you cross
6. Time pressure adds tension

### New Features
- [ ] Water zone between road and goal
- [ ] Logs float across the water
- [ ] Frog rides on logs automatically
- [ ] Falling in water costs a life
- [ ] 3 lives per game
- [ ] Lives display on screen
- [ ] Score display on screen
- [ ] Timer counting down

### Who Does What

| Person | Focus |
|--------|-------|
| **Systems Integrator** | Add water zone, wire up lives system, add scoring |
| **Engine Developer** | Make frog ride on logs, detect water deaths, spawn logs continuously |
| **Content Architect** | Lives display, score display, visual distinction between road/water/grass |

---

## Milestone 3: "Quality of Life" (End of Day 3)

**What success looks like:** Developers can debug easily, players can learn the controls.

### The Player Experience
1. Press H to see controls help
2. Press D to see debug info (for testing)
3. Game feels tighter and more polished

### New Features
- [ ] Help overlay (press H) - shows all controls
- [ ] Debug panel (press D) - shows frog position, useful for testing
- [ ] God mode (press G in debug) - can't die, for testing
- [ ] Timer integrated properly
- [ ] Any rough edges from Milestones 1-2 smoothed out

### Who Does What

| Person | Focus |
|--------|-------|
| **Systems Integrator** | Wire up keyboard shortcuts (H, D, G), integrate timer fully |
| **Engine Developer** | God mode toggle, provide debug data (positions, states) |
| **Content Architect** | Help overlay design, debug panel layout, polish all screens |

---

## Milestone 4: "Multiplayer" (End of Day 4)

**What success looks like:** Two people on different devices play the same game simultaneously.

### The Player Experience
1. One person starts a game
2. Another person scans a QR code to join
3. Both frogs appear on the same map
4. Race to see who crosses first
5. See rankings at the end

### New Features
- [ ] WebSocket connection between players
- [ ] Multiple frogs on screen
- [ ] QR code to join a game
- [ ] Larger map (more room for multiple players)
- [ ] Something fun happens when frogs collide
- [ ] Final screen shows who won

### Who Does What

| Person | Focus |
|--------|-------|
| **Systems Integrator** | WebSocket server, QR code generation, sync game state |
| **Engine Developer** | Multiple frog movement, frog-frog collision handling |
| **Content Architect** | Player colors/numbers, lobby UI, leaderboard display |

---

## Milestone 5: "Demo Ready" (Day 5)

**What success looks like:** You're proud to show this to people.

### Focus Areas
- [ ] Fix any remaining bugs
- [ ] Smooth out visual rough edges
- [ ] Playtest and tune difficulty
- [ ] Prepare demo talking points
- [ ] Everyone knows how to present their part

### Who Does What

**Everyone:** Bug fixes, playtesting, polish, demo prep

---

## Daily Rhythm

| Time | Activity |
|------|----------|
| **Morning** | Quick standup: What did you do? What are you doing? Any blockers? |
| **Midday** | Check-in: Are we on track for today's milestone? |
| **End of Day** | Demo current state to each other, celebrate wins, note what's next |

---

## The Rules

1. **Don't break what works.** Test before you commit.
2. **Ask for help early.** Stuck for 15 minutes? Ping the team.
3. **Small commits, clear messages.** Make it easy to review.
4. **Milestone > Feature.** Getting to the milestone matters more than any single feature.
5. **Polish > New stuff.** Once MVP works, make it feel good before adding more.

---

## Out of Scope This Week

We're NOT doing these (no matter how cool they sound):
- Music and sound effects
- Roguelike mechanics
- Combat
- Resource management
- Persistent online leaderboards
- Mobile app

If we finish everything else, we can revisit. But these are traps.

---

## Quick Reference: Who Owns What

| Area | Owner |
|------|-------|
| Overall PRD & integration | Systems Integrator |
| Frog movement & collision | Engine Developer |
| Car/log spawning & physics | Engine Developer |
| All UI screens | Content Architect |
| Entity definitions | Content Architect (with SI) |
| Game state (start/play/win/lose) | Systems Integrator |
| WebSocket server | Systems Integrator |
| Debug tools | Everyone (ED provides data, CA designs UI, SI wires it) |

---

## Decision Log

Track key decisions here as you make them:

| Date | Decision | Why |
|------|----------|-----|
| | | |
| | | |
| | | |

---

## Questions to Answer

- [ ] How big should the map be for multiplayer? (20x20? Bigger?)
- [ ] What happens when two frogs collide? (Bounce? Pass through?)
- [ ] How many seconds on the timer? (Start with 30, tune from there)
- [ ] What colors for each player in multiplayer?
