# Move The Amphibian Safely Game

Team:

Content Architect - Jonathan Nolan,
Engine Developer - John Hoeksema,
Systems Integrator - Joseph Waine

# What We're Building

Massively multiplayer online frogger game for the modern arcade - think frogger with lots of players.

Our version of a classic arcade game that feels good to play with some humorous modern twists and multi player mode. :) The classic objective remains: guide a frog across busy roads and rivers to safety.

Guiding principle: simple and very polished is better than complicated. We want our team to be in flow state as much as possible.

# The Team

## Systems Integrator

The 'taskmaster' and the glue that owns the overall plan, connects everyone's pieces together, manages flow, and if a team member gets blocked, their assistance comes to the rescue.

## Engine Developer

The mechanics wizard. The ED will build how things move, how collisions work, as well as the core game rules that make it feel like the classic frog game.

## Content Architect

The look and feel designer. The CA will designs screens, layouts, colors, and all the visual elements players interact with, working with the ED and SI when necessary.

# Proposed EOD Goals for the Week

Day 1 :
Basic playable game: move frog, dodge cars, win or lose
Day 2 :
Add water zone, logs, lives, and scoring  
Day 3 :
Multiplayer: 20 players on different devices  
Day 4 :
Debugging, polishing - Bug fixes,
Day 5 : playtesting, demo preparation

# Milestone 1

Player can successfully complete round of MTASG from start to finish.

## EOD experience -

1. See a start screen with the game title
2. Press SPACE to begin
3. Control the frog with arrow or WASD keys
4. Dodge cars crossing the road
5. Reach the top of the screen to win
6. Get hit by a car and see game over
7. Press SPACE to play again

## Roles

Systems Integrator will Create main game structure, connect everyone's pieces, handle game states

Engine Developer will Make frog move, make cars move, detect collisions

Content Architect will Design start/win/lose screens, pick colors

# Milestone 2

The game successfully has water, logs, and multiple lives.

## EOD experience -

1. Cross the road (avoid cars)
2. Cross the river by hopping on logs
3. Fall in water = lose a life (not instant game over)
4. Have 3 lives to work with
5. See your score increase as you progress
6. Time pressure adds tension

## Who Does What

Systems Integrator: Add water zone, wire up lives and scoring
Engine Developer: Make frog ride logs, detect water deaths, spawn obstacles
Content Architect: Lives/score displays, visual distinction between zones

# Milestone 3

What success looks like: multiple people on different devices play the same game simultaneously.

## EOD experience -

1. One person starts a game
2. Another person scans a QR code to join
3. Both frogs appear on the same map
4. Race to see who crosses first
5. See rankings at the end

# Milestone 4

What success looks like: Developers can debug easily, players can learn the controls.

## EOD experience -

1. Press H to see controls help
2. Press D to see debug info (for testing)
3. Game feels tighter and more polished

## Who Does What

Systems Integrator: Wire up keyboard shortcuts, integrate timer
Engine Developer: God mode, provide debug information
Content Architect: Help overlay design, debug panel layout, polish screens

## Who Does What

Systems Integrator: Server setup, QR code, sync game state |
Engine Developer: Multiple frog movement, frog-frog collisions |
Content Architect: Player colors, lobby screen, leaderboard |

# Milestone 5: DEMO

The our game should be in a cool and presentable place!

everyone contributes: bug fixes, playtesting, polish, demo prep

## Possible Game Titles

Get the Frogs Across
Cross the Road (You Are The Frogs)
Don't Hit the Toads
Help These Frogs Get Home
Frogs Trying to Cross the Street
The Frogs Must Cross
Please Let the Frogs Pass
Frogs vs. Traffic: A Crossing Simulator
Small Amphibians, Busy Roads
Why Did the Frogs Cross the Road

## Team Agreements -

1. Don't break what works. Test before you commit.
2. Ask for help early. If stuck for more than 10 or 15 minutes, reach out to the team on discord or in person.
3. Make small commits that are easy to review.
4. Milestones are better than features. Getting to the milestone matters more than any single feature.
5. Polish is better than new stuff. Once something works, make it feel good before adding more.

# Controls Reference

SPACE: Start / Restart
Arrow Keys / WASD: Move frog
H: Toggle help overlay
G: Toggle God mode

# Out of Scope This Week But NICE TO HAVE

If we finish everything else, we can revisit these:

- music and sound effects
- combat
- persistent online leaderboards
- mobile play (transparent overlay) - put it in the html chrome outside of the rendered game canvas
- replay mode - save the game/specifc moves and then play it back

game pad support - game pad api - built into web browser

# Meeting Notes - with david

get a backend figured out to make sure itll work down the line for multiplayer

only have to pass position of frog - every tick - cock running on the server - the board will change - occasionally have to broadcast player xyz is at x position

figure out levels, how they are generated

writing tests for the collision logic -

movement system

testing what ui elements are showing up,

level configuration

win state

'think about optimization as a nice to have'
