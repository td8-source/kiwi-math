// End-to-end check of cloud sync against a mock Supabase served from Playwright's request
// interception. Build first with a mock URL so the client is configured:
//   VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=mock-anon-key-0123456789abcdef npm run build
//   node scripts/cloud-check.mjs
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
await new Promise((r) => server.listen(4180, "127.0.0.1", r));
await mkdir(OUT, { recursive: true });

// The "cloud": family saves keyed by hash, account saves keyed by user id.
const cloud = { family: new Map(), saves: new Map(), users: new Map() };
const calls = [];

async function mockSupabase(context) {
  await context.route("https://mock.supabase.co/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    calls.push(`${req.method()} ${url.pathname}${url.search}`);
    const json = (status, data) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (url.pathname === "/rest/v1/rpc/family_pull") return json(200, cloud.family.get(body.p_hash) ?? null);
    if (url.pathname === "/rest/v1/rpc/family_push") { cloud.family.set(body.p_hash, body.p_state); return json(204, null); }
    if (url.pathname === "/auth/v1/signup" || (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password")) {
      const isSignup = url.pathname === "/auth/v1/signup";
      const existing = cloud.users.get(body.email);
      if (isSignup && existing) return json(400, { error_code: "user_already_exists", msg: "User already registered" });
      if (!isSignup && (!existing || existing.password !== body.password)) return json(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" });
      const user = existing ?? { id: `user-${cloud.users.size + 1}`, email: body.email, password: body.password };
      cloud.users.set(body.email, user);
      const u = { id: user.id, aud: "authenticated", role: "authenticated", email: user.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      return json(200, { access_token: `token-${user.id}`, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "refresh", user: u });
    }
    if (url.pathname === "/auth/v1/logout") return json(204, null);
    if (url.pathname === "/auth/v1/user") { const auth = req.headers()["authorization"] ?? ""; const id = auth.replace("Bearer token-", ""); const user = [...cloud.users.values()].find((x) => x.id === id); return user ? json(200, { id: user.id, email: user.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} }) : json(401, { msg: "no" }); }
    if (url.pathname === "/rest/v1/saves") {
      const auth = req.headers()["authorization"] ?? "";
      const id = auth.replace("Bearer token-", "");
      if (req.method() === "GET") { const row = cloud.saves.get(id); return json(200, row ? [{ state: row }] : []); }
      if (req.method() === "POST") { cloud.saves.set(body.user_id, body.state); return json(201, []); }
    }
    return json(404, { message: `unmocked ${url.pathname}` });
  });
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (process.platform === "linux" ? "/opt/pw-browsers/chromium" : undefined) });
const errors = [];

async function newDevice(name) {
  const context = await browser.newContext({ viewport: { width: 1180, height: 780 } });
  await mockSupabase(context);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  // Deliberately wrong passwords and unknown codes produce expected 4xx responses.
  page.on("console", (m) => { if (m.type() === "error" && !/status of 4\d\d/.test(m.text())) errors.push(`${name} console: ${m.text()}`); });
  await page.goto("http://127.0.0.1:4180/");
  await page.waitForSelector(".welcome-options, .profile-grid, .land");
  return page;
}
async function createExplorer(page, name, age) {
  await page.click('[data-action="new"]');
  await page.fill("input[name=name]", name);
  await page.click(`[data-action="age"][data-age="${age}"]`);
  await page.click('[data-action="create"]');
  await page.waitForSelector(".save-online, .land");
  if (await page.$(".save-online")) await page.click('[data-action="later"]');
  await page.waitForSelector(".land");
}
async function playBronze(page) {
  await page.click(".region-card.pos-0");
  await page.waitForSelector(".trail-list");
  await page.click('[data-action="play"][data-trail="y1-count"][data-tier="1"]');
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector(".question-area.question");
    const count = await page.$$eval(".objects .obj", (els) => els.length);
    await page.click(`.option[data-value="${count}"]`);
    await page.waitForSelector(".feedback.right");
    await page.waitForSelector(".question-area.question, .results", { timeout: 5000 });
  }
  await page.waitForSelector(".results");
  await page.click('[data-action="map"]');
  await page.waitForSelector(".land");
}
async function openCloudTab(page) {
  await page.click('[data-action="parent"]');
  await page.waitForSelector(".pin-gate");
  const creating = await page.$eval(".pin-gate h2", (h) => h.textContent.includes("Create"));
  for (const k of creating ? ["1", "2", "3", "4", "1", "2", "3", "4"] : ["1", "2", "3", "4"]) await page.click(`[data-action="pin"][data-key="${k}"]`);
  await page.waitForSelector(".dash");
  await page.click('[data-action="tab"][data-tab="cloud"]');
}
const expect = (cond, msg) => { if (!cond) { errors.push(`ASSERT: ${msg}`); console.error("FAIL", msg); } else console.log("ok  ", msg); };

// --- Family code: device A creates a code and plays; device B links and sees the progress.
const a = await newDevice("A");
await createExplorer(a, "Aroha", 6);
await playBronze(a);
await openCloudTab(a);
await a.click('[data-action="cloud-view"][data-view="family"]');
await a.screenshot({ path: join(OUT, "40-cloud-family-menu.png") });
await a.click('[data-action="cloud-family-create"]');
await a.waitForSelector(".family-code:not(.hidden-code)");
const code = (await a.textContent(".family-code")).trim();
console.log("family code:", code);
await a.screenshot({ path: join(OUT, "41-cloud-family-created.png") });
expect(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{6}$/.test(code), "device A generated a valid family code");
expect(cloud.family.size === 1, "device A pushed its save to the cloud");
await a.click('[data-action="back"]');
await a.waitForSelector(".sync-pill");
expect(await a.$eval(".sync-pill", (el) => el.dataset.status) === "idle", "header shows cloud sync up to date");

const b = await newDevice("B");
await b.screenshot({ path: join(OUT, "46-welcome.png") });
await b.click('[data-action="link"]');
await b.waitForSelector(".link-card");
await b.screenshot({ path: join(OUT, "47-link-screen.png") });
await b.click('[data-action="cloud-view"][data-view="family"]');
await b.fill("input[name=code]", "wrong-words-here-now-000000");
await b.click('[data-action="cloud-family-join"]');
await b.waitForSelector(".cloud-error");
expect((await b.textContent(".cloud-error")).includes("No family was found"), "device B rejects an unknown code");
await b.fill("input[name=code]", code.toUpperCase().replace(/-/g, " "));
await b.click('[data-action="cloud-family-join"]');
await b.waitForSelector(".profile-grid");
await b.screenshot({ path: join(OUT, "42-cloud-family-linked.png") });
let namesB = await b.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(namesB.includes("Aroha"), `device B landed on the explorer picker with Aroha (${namesB.join(", ")})`);
await b.click('[data-action="new"]');
await b.fill("input[name=name]", "Tama");
await b.click('[data-action="age"][data-age="5"]');
await b.click('[data-action="create"]');
await b.waitForSelector(".land");
await b.click('[data-action="switch"]');
await b.waitForSelector(".profile-grid");
namesB = await b.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(namesB.includes("Aroha") && namesB.includes("Tama"), `device B now has both explorers (${namesB.join(", ")})`);
expect(!(await b.$('[data-action="link"]')), "picker hides the link button once the device is linked");
const starsB = await b.$$eval(".profile-card", (els) => els.map((e) => e.textContent));
expect(starsB.some((t) => t.includes("Aroha") && /★ [1-3]/.test(t)), "Aroha's stars from device A arrived on device B");

// Device B's push is debounced; wait for it to reach the cloud before device A syncs.
const pushesBefore = calls.filter((c) => c.includes("family_push")).length;
for (let i = 0; i < 40 && calls.filter((c) => c.includes("family_push")).length === pushesBefore; i++) await b.waitForTimeout(250);
expect(calls.filter((c) => c.includes("family_push")).length > pushesBefore, "device B pushed Tama within a few seconds of creating the explorer");

// Device A syncs and receives Tama.
await a.reload();
await a.waitForSelector(".land");
await a.waitForTimeout(1500);
await a.click('[data-action="switch"]');
await a.waitForSelector(".profile-grid");
const namesA = await a.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(namesA.includes("Tama"), `device A received Tama after reload (${namesA.join(", ")})`);

// --- Parent account: device C creates an account, device D signs in and sees the profiles.
const c = await newDevice("C");
await createExplorer(c, "Mia", 7);
await openCloudTab(c);
await c.click('[data-action="cloud-view"][data-view="account"]');
await c.fill("input[name=email]", "parent@example.com");
await c.fill("input[name=password]", "kiwi-pass-123");
await c.screenshot({ path: join(OUT, "43-cloud-account-form.png") });
await c.click('[data-action="cloud-signup"]');
await c.waitForSelector(".cloud-message, .cloud-error");
expect(cloud.saves.size === 1, "device C pushed its save under the parent account");
await c.screenshot({ path: join(OUT, "44-cloud-account-linked.png") });

const d = await newDevice("D");
await d.click('[data-action="link"]');
await d.waitForSelector(".link-card");
await d.click('[data-action="cloud-view"][data-view="account"]');
await d.fill("input[name=email]", "parent@example.com");
await d.fill("input[name=password]", "wrong");
await d.click('[data-action="cloud-signin"]');
await d.waitForSelector(".cloud-error");
expect((await d.textContent(".cloud-error")).includes("not right"), "device D rejects a wrong password");
await d.fill("input[name=password]", "kiwi-pass-123");
await d.click('[data-action="cloud-signin"]');
await d.waitForSelector(".profile-grid");
const namesD = await d.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(namesD.includes("Mia"), `device D received Mia after signing in (${namesD.join(", ")})`);
// PIN from device C (1234) should now be on device D too.
await d.click('[data-action="parent"]');
await d.waitForSelector(".pin-gate");
expect(await d.$eval(".pin-gate h2", (h) => h.textContent.includes("Enter")), "parent PIN synced to device D");

// --- Switching accounts on one device: parent one's explorers must not follow.
await d.click('[data-action="back"]');
await d.waitForSelector(".profile-grid, .land");
await openCloudTab(d);
await d.click('[data-action="cloud-signout"]');
await d.waitForSelector(".cloud-options");
expect(cloud.saves.get("user-1")?.profiles?.some((p) => p.name === "Mia"), "device D pushed Mia back to the account before signing out");
await d.click('[data-action="back"]');
await d.waitForSelector(".welcome-options");
expect(!(await d.$(".profile-grid")), "signing out removed the explorer picker from device D");

// A second parent signs up on the same device and must start with an empty picker.
await d.click('[data-action="parent"]');
await d.waitForSelector(".pin-gate");
expect(await d.$eval(".pin-gate h2", (h) => h.textContent.includes("Create")), "device D asks the new parent for a fresh PIN");
for (const k of ["9", "9", "9", "9", "9", "9", "9", "9"]) await d.click(`[data-action="pin"][data-key="${k}"]`);
await d.waitForSelector(".dash");
await d.click('[data-action="tab"][data-tab="cloud"]');
await d.click('[data-action="cloud-view"][data-view="account"]');
await d.fill("input[name=email]", "other-parent@example.com");
await d.fill("input[name=password]", "kiwi-pass-456");
await d.click('[data-action="cloud-signup"]');
await d.waitForSelector(".cloud-status");
await d.click('[data-action="back"]');
await d.waitForSelector(".welcome-options, .profile-grid");
const namesD2 = await d.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(!namesD2.includes("Mia"), `the new parent on device D does not see Mia (${namesD2.join(", ") || "no explorers"})`);
const otherId = [...cloud.users.values()].find((u) => u.email === "other-parent@example.com")?.id;
const leaked = cloud.saves.get(otherId)?.profiles ?? [];
expect(!leaked.some((p) => p.name === "Mia"), `Mia was not uploaded into the second account (${leaked.map((p) => p.name).join(", ") || "empty"})`);
await d.screenshot({ path: join(OUT, "45-cloud-account-switched.png") });

// The first parent signs back in on the same device and gets their explorer back.
await d.click('[data-action="parent"]');
await d.waitForSelector(".pin-gate");
for (const k of ["9", "9", "9", "9"]) await d.click(`[data-action="pin"][data-key="${k}"]`);
await d.waitForSelector(".dash");
await d.click('[data-action="tab"][data-tab="cloud"]');
await d.click('[data-action="cloud-signout"]');
await d.waitForSelector(".cloud-options");
await d.click('[data-action="cloud-view"][data-view="account"]');
await d.fill("input[name=email]", "parent@example.com");
await d.fill("input[name=password]", "kiwi-pass-123");
await d.click('[data-action="cloud-signin"]');
await d.waitForSelector(".cloud-status");
await d.click('[data-action="back"]');
await d.waitForSelector(".profile-grid");
const namesD3 = await d.$$eval(".profile-card .profile-name", (els) => els.map((e) => e.textContent.trim()));
expect(namesD3.includes("Mia"), `the first parent gets Mia back after signing in again (${namesD3.join(", ") || "no explorers"})`);

await browser.close();
server.close();
console.log(`\n${calls.length} mock cloud calls`);
if (errors.length) { console.error("\nERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log("\nAll cloud sync checks passed.");
