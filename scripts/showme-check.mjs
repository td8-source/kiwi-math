/**
 * End-to-end check of the "Show me how" walkthrough against the built app.
 *   npm run build && node scripts/showme-check.mjs
 *
 * Plays a counting round, gets a question wrong twice to reach the reveal, then walks
 * the worked example through to its last step. Screenshots land in ./screenshots.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const DIST = join(process.cwd(), "dist");
const OUT = join(process.cwd(), "screenshots");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  let path = join(DIST, (req.url ?? "/").split("?")[0]);
  try { if ((await stat(path)).isDirectory()) path = join(path, "index.html"); } catch { path = join(DIST, "index.html"); }
  try { res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }); res.end(await readFile(path)); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(4182, "127.0.0.1", r));
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (process.platform === "linux" ? "/opt/pw-browsers/chromium" : undefined) });
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const expect = (cond, msg) => { if (!cond) { errors.push(`ASSERT: ${msg}`); console.error("FAIL", msg); } else console.log("ok  ", msg); };

await page.goto("http://127.0.0.1:4182/");
await page.click('[data-action="new"]');
await page.fill("input[name=name]", "Aroha");
await page.click('[data-action="age"][data-age="5"]');
await page.click('[data-action="create"]');
await page.waitForSelector(".save-online, .land");
if (await page.$(".save-online")) await page.click('[data-action="later"]');
await page.waitForSelector(".land");
await page.click(".region-card.pos-0");
await page.waitForSelector(".trail-list");
await page.click('[data-action="play"][data-trail="y1-count"][data-tier="1"]');

// Work through the round answering badly until a question reaches the reveal with a
// walkthrough on offer. Ten questions is plenty for a counting trail.
let walked = false;
for (let q = 0; q < 10 && !walked; q++) {
  await page.waitForSelector(".question-area");
  for (let attempt = 0; attempt < 2; attempt++) {
    const options = await page.$$(".option:not([disabled])");
    if (options.length) await options[attempt % options.length].click();
    else {
      for (const k of ["9", "9"]) await page.click(`[data-action="key"][data-key="${k}"]`);
      await page.click('[data-action="go"]');
    }
    await page.waitForTimeout(400);
    if (await page.$(".feedback.reveal")) break;
    if (await page.$(".feedback.right")) { await page.waitForTimeout(1400); break; }
  }
  if (!(await page.$(".feedback.reveal"))) continue;

  const offer = await page.$('[data-action="show-me"]');
  if (!offer) { await page.click('[data-action="next"]'); continue; }
  expect(await page.$(".feedback.reveal strong"), "the answer is already on screen before help is offered");
  await page.screenshot({ path: join(OUT, "60-showme-offer.png") });

  await offer.click();
  await page.waitForSelector(".showme");
  expect(!(await page.$(".options .option:not([disabled])")), "answer buttons stay disabled during the walkthrough");
  const first = await page.textContent(".showme-caption");
  await page.screenshot({ path: join(OUT, "61-showme-step.png") });
  expect(!!first?.trim(), `walkthrough opened on "${first}"`);

  // Counting steps advance themselves; the last one waits for the child.
  await page.waitForSelector('.showme [data-action="next"]', { timeout: 20000 });
  const last = await page.textContent(".showme-caption");
  expect(/altogether|in the frame|leaves|=/.test(last ?? ""), `walkthrough finished on "${last}"`);
  await page.screenshot({ path: join(OUT, "62-showme-final.png") });

  await page.click('.showme [data-action="next"]');
  await page.waitForTimeout(300);
  expect(!(await page.$(".showme")), "the walkthrough closes and the round carries on");
  walked = true;
}
expect(walked, "reached and completed a walkthrough");

await browser.close();
server.close();
if (errors.length) { console.error("\nERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log("\nShow me how: all checks passed.");
