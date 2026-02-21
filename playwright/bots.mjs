// Frogger Bot Army - 15 bots with game-state-aware AI
// Usage: node playwright/bots.mjs

import { chromium } from "playwright";

const GAME_URL = "https://fractal-frogger-9z75.onrender.com/";
const NUM_BOTS = 15;
const GAME_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const NAMES = [
  "Ribbit Rick",
  "Toad Tyler",
  "Hoppy Helen",
  "Frogzilla",
  "Leap Liam",
  "Croak Craig",
  "Lily Luna",
  "Jumpy Jane",
  "Swamp Sam",
  "Pond Pete",
  "Marsh Mia",
  "Bog Boris",
  "Splash Sue",
  "Waddle Will",
  "Bullfrog Bo",
];

// The brain: reads game state and picks the best move
// Returns a keyboard action or null (wait)
function botBrain(state) {
  if (!state || state.state !== "playing") return null;

  const { frog, lanes, gridSize } = state;
  const fx = frog.position.x;
  const fy = frog.position.y;

  const currentLane = lanes.find((l) => l.y === fy);
  const laneAbove = lanes.find((l) => l.y === fy - 1);

  // Check if a position is safe from obstacles in a given lane
  function isSafeAt(lane, x, lookAheadTicks) {
    if (!lane || lane.type === "safe" || lane.type === "goal") return true;
    for (const obs of lane.obstacles) {
      const obsLeft = obs.position.x;
      const obsRight = obs.position.x + obs.width;
      // Check current position and where obstacle will be soon
      for (let t = 0; t <= lookAheadTicks; t++) {
        const futureLeft = obsLeft + obs.velocity * t;
        const futureRight = obsRight + obs.velocity * t;
        if (x + 0.9 > futureLeft && x < futureRight) return false;
      }
    }
    return true;
  }

  // On water: check if we're on a log. If not, we'll die - try to get on one
  function isOnLogAt(lane, x) {
    if (!lane || lane.type !== "water") return true; // not water = fine
    for (const obs of lane.obstacles) {
      const logLeft = obs.position.x;
      const logRight = obs.position.x + obs.width;
      if (x + 0.9 > logLeft && x < logRight) return true;
    }
    return false;
  }

  function canSurviveAt(lane, x) {
    if (!lane) return false;
    if (lane.type === "safe" || lane.type === "goal") return true;
    if (lane.type === "road") return isSafeAt(lane, x, 3);
    if (lane.type === "water") return isOnLogAt(lane, x);
    return true;
  }

  // If invincible, just rush forward
  if (frog.isInvincible) {
    return "ArrowUp";
  }

  // Priority 1: If current position is dangerous (water without log), move!
  if (currentLane && currentLane.type === "water" && !isOnLogAt(currentLane, fx)) {
    // Try to find a log on current lane to jump to
    for (const obs of currentLane.obstacles) {
      const logCenter = obs.position.x + obs.width / 2;
      if (logCenter > fx + 0.5) return "ArrowRight";
      if (logCenter < fx - 0.5) return "ArrowLeft";
    }
    // No log nearby, try going back
    return "ArrowDown";
  }

  // Priority 2: Try to move up if the lane above is safe
  if (laneAbove) {
    if (canSurviveAt(laneAbove, fx)) {
      return "ArrowUp";
    }

    // Lane above isn't safe at our x. Try adjacent x positions
    if (canSurviveAt(laneAbove, fx - 1) && fx > 0) return "ArrowLeft";
    if (canSurviveAt(laneAbove, fx + 1) && fx < gridSize - 1) return "ArrowRight";
  }

  // Priority 3: Wait or dodge sideways if stuck
  // Check if current position is about to get hit
  if (currentLane && !canSurviveAt(currentLane, fx)) {
    if (canSurviveAt(currentLane, fx - 1) && fx > 0) return "ArrowLeft";
    if (canSurviveAt(currentLane, fx + 1) && fx < gridSize - 1) return "ArrowRight";
    return "ArrowDown"; // retreat
  }

  // Priority 4: Occasionally shoot tongue for prizes (10% chance when safe)
  if (Math.random() < 0.1) return "Space";

  // Priority 5: Wait a tick for a better opening
  return null;
}

// Dumb fallback if game state isn't available
function dumbAction() {
  const roll = Math.random();
  if (roll < 0.45) return "ArrowUp";
  if (roll < 0.60) return "ArrowLeft";
  if (roll < 0.75) return "ArrowRight";
  if (roll < 0.82) return "ArrowDown";
  if (roll < 0.88) return "Space";
  return null;
}

async function runBot(browser, botIndex) {
  const name = NAMES[botIndex % NAMES.length];
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`[Bot ${botIndex}] ${name} - connecting...`);
    await page.goto(GAME_URL, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2000 + Math.random() * 1000);

    // Click canvas to activate PixiJS Input, then type name
    const canvas = page.locator("canvas");
    await canvas.click({ position: { x: 300, y: 405 } });
    await page.waitForTimeout(500);
    await page.waitForSelector("input", { timeout: 5000 });
    await page.keyboard.type(name, { delay: 30 });
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    console.log(`[Bot ${botIndex}] ${name} - playing!`);
    await page.waitForTimeout(500);

    let smartMoves = 0;
    let dumbMoves = 0;

    const startTime = Date.now();
    while (Date.now() - startTime < GAME_DURATION_MS) {
      // Try to read game state for smart AI, fall back to random
      let action = null;
      try {
        const state = await page.evaluate(() => {
          const fn = (window).__froggerState;
          return fn ? fn() : null;
        });
        if (state && state.state === "playing") {
          action = botBrain(state);
          if (action) smartMoves++;
        } else {
          action = dumbAction();
          if (action) dumbMoves++;
        }
      } catch {
        action = dumbAction();
        if (action) dumbMoves++;
      }

      if (action) {
        await page.keyboard.press(action);
      }

      // Tick every 150-300ms
      await page.waitForTimeout(150 + Math.random() * 150);
    }

    console.log(`[Bot ${botIndex}] ${name} - done. Smart: ${smartMoves}, Dumb: ${dumbMoves}`);
  } catch (err) {
    console.error(`[Bot ${botIndex}] ${name} - error: ${err.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  console.log(`Launching ${NUM_BOTS} frogger bots at ${GAME_URL}`);
  console.log(`They'll play for ${GAME_DURATION_MS / 1000 / 60} minutes.`);
  console.log(`Press Ctrl+C to stop early.\n`);

  const browser = await chromium.launch({ headless: true });

  const bots = [];
  for (let i = 0; i < NUM_BOTS; i++) {
    bots.push(runBot(browser, i));
    await new Promise((r) => setTimeout(r, 800));
  }

  await Promise.all(bots);

  console.log("\nAll bots finished. Closing browser.");
  await browser.close();
}

main().catch(console.error);
