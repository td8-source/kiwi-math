/**
 * First-open flow: welcome (start fresh or continue from another device), the PIN-free
 * link screen, and the optional "save progress online?" prompt after the first explorer.
 */
import { mount, type Ctx } from "../app/context";
import { cloudConfigured } from "../app/cloud";
import { sfx } from "../app/audio";
import { creatureSvg, logoSvg } from "../ui/art";
import { delegate, html } from "../ui/html";
import { cloudHandlers, cloudTab, detectRecovery, initialCloudUi } from "./cloudtab";

export function renderWelcome(ctx: Ctx): void {
  const el = mount(ctx, "welcome-screen");
  const cloud = cloudConfigured();
  el.innerHTML = html`
    <header class="title-block">
      ${logoSvg()}
      <h1>Nature Maths</h1>
      <p class="subtitle">An Aotearoa maths quest for ages 5 to 8</p>
    </header>
    <h2 class="prompt-heading">Kia ora! How would you like to begin?</h2>
    <div class="welcome-options">
      <button class="welcome-card" data-action="new">
        ${creatureSvg("fantail", "creature welcome-art")}
        <strong>Start fresh</strong>
        <span>Make an explorer and start playing right away.${cloud ? " You can save progress online later." : ""}</span>
      </button>
      ${cloud
        ? html`<button class="welcome-card" data-action="link">
            ${creatureSvg("kea", "creature welcome-art")}
            <strong>Continue from another device</strong>
            <span>Sign in to a parent account or enter a family code to bring your explorers here.</span>
          </button>`
        : ""}
    </div>
    <footer class="screen-footer">
      <button class="btn ghost small" data-action="parent">Parents &amp; teachers</button>
    </footer>
  `.value;
  delegate(el, {
    new() { sfx.tap(); ctx.go({ name: "new-profile" }); },
    link() { sfx.tap(); ctx.go({ name: "link" }); },
    parent() { ctx.go({ name: "parent" }); },
  });
}

export function renderLink(ctx: Ctx): void {
  const el = mount(ctx, "link-screen");
  const ui = initialCloudUi();
  const hasProfiles = ctx.state.profiles.length > 0;
  const draw = (): void => {
    el.innerHTML = html`
      <header class="bar">
        <button class="btn ghost" data-action="back">‹ Back</button>
        <h1>Continue from another device</h1>
        <span></span>
      </header>
      <main class="link-card">
        ${cloudTab(ctx, ui)}
        ${ctx.state.sync.mode !== "none" ? html`<div class="chip-row"><button class="btn primary big" data-action="explorers">Go to explorers ›</button></div>` : ""}
      </main>
    `.value;
  };
  delegate(el, {
    back() { ctx.go(hasProfiles ? { name: "profiles" } : { name: "welcome" }); },
    explorers() { ctx.go({ name: "profiles" }); },
    ...cloudHandlers(ctx, ui, el, draw, { onLinked: () => { sfx.fanfare(); ctx.go({ name: "profiles" }); } }),
  });
  el.addEventListener("submit", (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLElement>("form[data-submit]");
    if (!form) return;
    ev.preventDefault();
    form.querySelector<HTMLElement>(`[data-action="${form.dataset.submit}"]`)?.click();
  });
  void detectRecovery(ui).then((pending) => { if (pending) draw(); });
  draw();
}

export function renderSaveOnline(ctx: Ctx): void {
  const el = mount(ctx, "save-online-screen");
  const p = ctx.profile();
  el.innerHTML = html`
    <main class="results save-online">
      ${creatureSvg("kiwi", "creature big")}
      <h1>Ka pai, ${p.name} is ready to explore!</h1>
      <p class="result-line">Want to save progress online so it can continue on other devices?</p>
      <p class="muted">A parent can set up an account or a family code now. It only takes a minute, and you can always do it later from the Parents &amp; teachers area.</p>
      <div class="result-actions">
        <button class="btn primary big" data-action="setup">Set up now</button>
        <button class="btn big" data-action="later">Maybe later</button>
      </div>
    </main>
  `.value;
  delegate(el, {
    setup() { ctx.go({ name: "link" }); },
    later() { sfx.tap(); ctx.go({ name: "map" }); },
  });
}
