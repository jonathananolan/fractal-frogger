# Frogger Project Overview

Team Content Architect, Engine Developer, Systems Integrator
Week of: February 17-22, 2026
Demo: Saturday

---

# What We're Building

A polished Frogger game that feels good to play. The classic arcade experience: guide a frog across busy roads and rivers to reach safety.

Our guiding principle: Simple and very polished is better than complicated. No dead time.

---

# The Team

## Systems Integrator

The glue. Owns the overall plan, connects everyone's pieces together, manages game flow, and unblocks the team when someone gets stuck.

## Engine Developer

The mechanics. Builds how things move, how collisions work, and the core game rules that make it feel like Frogger.

## Content Architect

The look and feel. Designs screens, layouts, colors, and all the visual elements players interact with.

---

# The Week at a Glance

| Day   | Goal                                                    |
| ----- | ------------------------------------------------------- |
| Day 1 | Basic playable game: move frog, dodge cars, win or lose |
| Day 2 | Add water zone, logs, lives, and scoring                |
| Day 3 | Add help screen, debug tools, polish rough edges        |
| Day 4 | Multiplayer: two players on different devices           |
| Day 5 | Bug fixes, playtesting, demo preparation                |

---

# Milestone 1: "It's a Game" (End of Day 1)

What success looks like: You can play a complete round of Frogger from start to finish.

## The Player Experience

1. See a start screen with the game title
2. Press SPACE to begin
3. Control a frog with arrow keys (or WASD)
4. Dodge cars crossing the road
5. Reach the top of the screen to win
6. Get hit by a car and see game over
7. Press SPACE to play again

## Checklist

- [ ] Start screen appears
- [ ] Frog moves when you press keys
- [ ] Cars move across the screen
- [ ] Getting hit ends the game
- [ ] Reaching the top wins
- [ ] Can restart after winning or losing

## Who Does What

| Person             | Focus                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| Systems Integrator | Create main game structure, connect everyone's pieces, handle game states |
| Engine Developer   | Make frog move, make cars move, detect collisions                         |
| Content Architect  | Design start/win/lose screens, pick colors                                |

---

# Milestone 2: "It's Actually Frogger" (End of Day 2)

What success looks like: The game has water, logs, and multiple lives. Feels like real Frogger.

## The Player Experience

1. Cross the road (avoid cars)
2. Cross the river by hopping on logs
3. Fall in water = lose a life (not instant game over)
4. Have 3 lives to work with
5. See your score increase as you progress
6. Time pressure adds tension

## New Features

- [ ] Water zone between road and goal
- [ ] Logs float across the water
- [ ] Frog rides on logs automatically
- [ ] Falling in water costs a life
- [ ] 3 lives per game
- [ ] Lives display on screen
- [ ] Score display on screen
- [ ] Timer counting down

## Who Does What

| Person             | Focus                                                     |
| ------------------ | --------------------------------------------------------- |
| Systems Integrator | Add water zone, wire up lives and scoring                 |
| Engine Developer   | Make frog ride logs, detect water deaths, spawn obstacles |
| Content Architect  | Lives/score displays, visual distinction between zones    |

---

# Milestone 3: "Quality of Life" (End of Day 3)

What success looks like: Developers can debug easily, players can learn the controls.

## The Player Experience

1. Press H to see controls help
2. Press D to see debug info (for testing)
3. Game feels tighter and more polished

## New Features

- [ ] Help overlay (press H) shows all controls
- [ ] Debug panel (press D) shows game info for testing
- [ ] God mode (press G in debug) for testing without dying
- [ ] Timer works properly
- [ ] Rough edges from earlier milestones smoothed out

## Who Does What

| Person             | Focus                                                   |
| ------------------ | ------------------------------------------------------- |
| Systems Integrator | Wire up keyboard shortcuts, integrate timer             |
| Engine Developer   | God mode, provide debug information                     |
| Content Architect  | Help overlay design, debug panel layout, polish screens |

---

# Milestone 4: "Multiplayer" (End of Day 4)

What success looks like: Two people on different devices play the same game simultaneously.

## The Player Experience

1. One person starts a game
2. Another person scans a QR code to join
3. Both frogs appear on the same map
4. Race to see who crosses first
5. See rankings at the end

## New Features

- [ ] Real-time connection between players
- [ ] Multiple frogs on screen
- [ ] QR code to join a game
- [ ] Larger map for more players
- [ ] Something fun happens when frogs collide
- [ ] Final screen shows who won

## Who Does What

| Person             | Focus                                        |
| ------------------ | -------------------------------------------- |
| Systems Integrator | Server setup, QR code, sync game state       |
| Engine Developer   | Multiple frog movement, frog-frog collisions |
| Content Architect  | Player colors, lobby screen, leaderboard     |

---

# Milestone 5: "Demo Ready" (Day 5)

What success looks like: You're proud to show this to people.

## Focus Areas

- [ ] Fix remaining bugs
- [ ] Smooth out visual rough edges
- [ ] Playtest and tune difficulty
- [ ] Prepare demo talking points
- [ ] Everyone knows how to present their part

Everyone contributes: Bug fixes, playtesting, polish, demo prep

---

# Daily Rhythm

| Time       | Activity                                                           |
| ---------- | ------------------------------------------------------------------ |
| Morning    | Quick standup: What did you do? What are you doing? Any blockers?  |
| Midday     | Check-in: Are we on track for today's milestone?                   |
| End of Day | Demo current state to each other, celebrate wins, note what's next |

---

# The Rules

1. Don't break what works. Test before you commit.
2. Ask for help early. Stuck for 15 minutes? Ping the team.
3. Small commits, clear messages. Make it easy to review.
4. Milestone > Feature. Getting to the milestone matters more than any single feature.
5. Polish > New stuff. Once something works, make it feel good before adding more.

---

# Controls Reference

| Key               | What It Does                    |
| ----------------- | ------------------------------- |
| SPACE             | Start / Restart                 |
| Arrow Keys / WASD | Move frog                       |
| H                 | Toggle help overlay             |
| D                 | Toggle debug panel              |
| G                 | Toggle god mode (only in debug) |

---

# Out of Scope This Week

We're NOT doing these (no matter how cool they sound):

- Music and sound effects
- Roguelike mechanics
- Combat
- Resource management
- Persistent online leaderboards
- Mobile app

If we finish everything else, we can revisit. But these are traps.

---

# Who Owns What

| Area                            | Owner                                             |
| ------------------------------- | ------------------------------------------------- |
| Overall plan & integration      | Systems Integrator                                |
| Frog movement & collision       | Engine Developer                                  |
| Obstacle spawning & behavior    | Engine Developer                                  |
| All UI screens                  | Content Architect                                 |
| Game flow (start/play/win/lose) | Systems Integrator                                |
| Multiplayer server              | Systems Integrator                                |
| Debug tools                     | Everyone (ED provides data, CA designs, SI wires) |

---

# Open Questions

- [ ] How big should the map be for multiplayer?
- [ ] What happens when two frogs collide?
- [ ] How many seconds on the timer? (Start with 30, tune from there)
- [ ] What colors for each player in multiplayer?

---

# Decision Log

Track key decisions here as you make them:

| Date | Decision | Why |
| ---- | -------- | --- |
|      |          |     |
|      |          |     |
|      |          |     |
