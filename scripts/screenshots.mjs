// Drives the built app in headless Chromium and captures screenshots of every screen.
// Usage: npm run build && node scripts/screenshots.mjs
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const DIST = join(process.cwd(), "dist");
const OUT = join(process.cwd(), "screenshots");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

const server = createServer(async (req, res) => {
  let path = join(DIST, decodeURIComponent((req.url ?? "/").split("?")[0]));
  try { if ((await stat(path)).isDirectory()) path = join(path, "index.html"); } catch { path = join(DIST, "index.html"); }
  try { res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }); res.end(await readFile(path)); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(4173, "127.0.0.1", r));
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (process.platform === "linux" ? "/opt/pw-browsers/chromium" : undefined) });
const page = await browser.newPage({ viewport: { width: 1180, height: 780 } });
page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE", m.text()); });
const shot = (name) => page.screenshot({ path: join(OUT, `${name}.png`) });

await page.goto("http://127.0.0.1:4173/");
await page.waitForSelector(".welcome-options");
await shot("00-welcome");

await page.click('[data-action="new"]');
await page.fill("input[name=name]", "Aroha");
await page.click('[data-action="age"][data-age="6"]');
await page.click('[data-action="character"][data-i="4"]');
await shot("02-new-profile");
await page.click('[data-action="create"]');
await page.waitForSelector(".save-online, .land");
if (await page.$(".save-online")) { await shot("02b-save-online"); await page.click('[data-action="later"]'); }
await page.waitForSelector(".land");
await shot("03-map");
await page.click('[data-action="switch"]');
await page.waitForSelector(".profile-grid");
await shot("01-profiles");
await page.click(".profile-card");
await page.waitForSelector(".land");

await page.click(".region-card.pos-0");
await page.waitForSelector(".trail-list");
await shot("04-region");

// Play a bronze round of Counting Shells, answering correctly from the DOM.
await page.click('[data-action="play"][data-trail="y1-count"][data-tier="1"]');
await page.waitForSelector(".question-area");
await shot("05-play-choice");
for (let i = 0; i < 10; i++) {
  await page.waitForSelector(".question-area.question");
  const count = await page.$$eval(".objects .obj", (els) => els.length);
  if (i === 3) {
    const values = await page.$$eval(".option", (els) => els.map((e) => e.dataset.value));
    const bad = values.find((v) => v !== String(count));
    await page.click(`.option[data-value="${bad}"]`);
    await page.waitForSelector(".feedback.retry");
    await shot("06-play-hint");
  }
  console.log(`question ${i + 1}: ${count} objects`);
  await page.click(`.option[data-value="${count}"]`);
  await page.waitForSelector(".feedback.right");
  if (i === 0) await shot("07-play-correct");
  await page.waitForSelector(".question-area.question, .results", { timeout: 5000 });
}
await page.waitForSelector(".results");
await shot("08-results");
await page.click('[data-action="region"]');
await page.waitForSelector(".trail-list");
await page.click('[data-action="map"]');
await page.waitForSelector(".land");

async function openTrail(trail, tier) {
  if (!(await page.$(".land"))) { await page.click('[data-action="map"]'); await page.waitForSelector(".land"); }
  const idx = Number(trail[1]) - 1;
  await page.evaluate((i) => document.querySelector(`.region-card.pos-${i}`)?.removeAttribute("disabled"), idx);
  await page.click(`.region-card.pos-${idx}`);
  await page.waitForSelector(".trail-list");
  await page.evaluate(({ trail, tier }) => document.querySelectorAll(`[data-action="play"][data-trail="${trail}"][data-tier="${tier}"]`).forEach((b) => b.removeAttribute("disabled")), { trail, tier });
  await page.click(`[data-action="play"][data-trail="${trail}"][data-tier="${tier}"]`);
  await page.waitForSelector(".question-area");
}
async function leaveToMap() {
  await page.click('[data-action="leave"]');
  await page.click('[data-action="region"]');
  await page.waitForSelector(".trail-list");
  await page.click('[data-action="map"]');
  await page.waitForSelector(".land");
}

// Parent dashboard: create PIN 1234, set a daily limit, unlock all regions.
await page.click('[data-action="parent"]');
for (const k of ["1", "2", "3", "4", "1", "2", "3", "4"]) await page.click(`[data-action="pin"][data-key="${k}"]`);
await page.waitForSelector(".dash");
await shot("09-parent-overview");
await page.click('[data-action="tab"][data-tab="curriculum"]');
await shot("10-parent-curriculum");
await page.click('[data-action="tab"][data-tab="settings"]');
await page.click('[data-action="unlock"][data-index="3"]');
await page.click('[data-action="limit"][data-min="20"]');
await shot("11-parent-settings");
await page.click('[data-action="back"]');
await page.waitForSelector(".land");
await shot("12-map-unlocked");

await openTrail("y4-addsub", 1);
await page.waitForSelector(".numpad");
await page.click('[data-action="key"][data-key="4"]');
await page.click('[data-action="key"][data-key="2"]');
await shot("13-play-numpad");
await leaveToMap();
await page.click('[data-action="shop"]');
await page.waitForSelector(".shop-layout");
await shot("14-backpack");
await page.click('[data-action="map"]');
await page.waitForSelector(".land");

const samples = [
  ["y1-measure", 1, "15-visual-measure"], ["y1-time", 3, "16-visual-clock"], ["y1-shapes", 1, "17-visual-shapes"], ["y1-data", 1, "18-visual-pictograph"], ["y1-chance", 3, "19-visual-bag"], ["y1-patterns", 2, "20-visual-pattern"],
  ["y2-units", 1, "21-visual-ruler"], ["y2-timemoney", 3, "22-visual-coins"], ["y2-geometry", 3, "23-visual-geometry"], ["y2-stats", 3, "24-visual-barchart"],
  ["y3-length", 3, "25-visual-length"], ["y3-timemoney", 2, "26-visual-calendar"], ["y3-geometry", 3, "27-visual-grid"], ["y3-stats", 2, "28-visual-tally"],
  ["y4-measure", 3, "29-visual-area"], ["y4-geometry", 3, "30-visual-angle"], ["y4-stats", 3, "31-visual-spinner"], ["y4-timemoney", 2, "32-visual-elapsed"],
];
for (const [trail, tier, name] of samples) {
  await openTrail(trail, tier);
  await shot(name);
  await leaveToMap();
}

// Time-up screen: exhaust today's limit through the app's own state, then reload.
await page.evaluate(() => {
  const raw = localStorage.getItem("nature-maths-state");
  if (!raw) return;
  const state = JSON.parse(raw);
  const p = state.profiles.find((x) => x.id === state.currentProfileId);
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  p.playLog[key] = 21 * 60000;
  localStorage.setItem("nature-maths-state", JSON.stringify(state));
});
await page.reload();
await page.waitForSelector(".timeup");
await shot("33-timeup");

await browser.close();
server.close();
console.log("Screenshots written to", OUT);
