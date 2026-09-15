import { mount, type Ctx } from "../app/context";
import { REGIONS } from "../curriculum";
import { regionStars, regionUnlocked, regionComplete, totalStars, rescuePassed } from "../app/progress";
import { sfx } from "../app/audio";
import { remainingTodayMs } from "../app/timer";
import { avatarSvg, creatureSvg, explorerSvg, featherSvg, lockSvg, regionSvg, speakerSvg, starSvg, type ExplorerLook } from "../ui/art";
import { delegate, html, type Raw } from "../ui/html";
import { findItem } from "../app/shop";
import { syncEnabled, syncStatus } from "../app/sync";
import type { Profile } from "../app/state";

export function lookFor(p: Profile): ExplorerLook {
  const v = (slot: string): string | undefined => (p.shop.equipped[slot] ? findItem(p.shop.equipped[slot] as string)?.variant : undefined);
  return { hat: v("hat"), backpack: v("backpack"), gear: v("gear"), boots: v("boots"), companion: v("companion") };
}

export function headerBar(ctx: Ctx, opts: { back?: { label: string; action: string }; title?: string } = {}): Raw {
  const p = ctx.profile();
  const remaining = remainingTodayMs(p);
  return html`
    <header class="bar">
      <div class="bar-left">
        ${opts.back ? html`<button class="btn ghost" data-action="${opts.back.action}">‹ ${opts.back.label}</button>` : ""}
        ${opts.title ? html`<h1>${opts.title}</h1>` : ""}
      </div>
      <div class="bar-right">
        ${syncEnabled() ? html`<span class="pill sync-pill" data-status="${syncStatus()}" title="Cloud sync">☁</span>` : ""}
        ${remaining !== null ? html`<span class="pill timer" title="Play time left today">⏱ ${Math.ceil(remaining / 60000)} min</span>` : ""}
        <span class="pill">${starSvg(true, "star inline")} ${totalStars(p)}</span>
        <span class="pill">${featherSvg("feather inline")} ${p.feathers}</span>
        <button class="pill toggle ${p.settings.narration ? "on" : ""}" data-action="narration" title="Read questions aloud">${speakerSvg()}</button>
        <button class="pill toggle ${p.settings.teReo ? "on" : ""}" data-action="te reo" title="Show te reo Māori numbers">reo</button>
        <button class="btn ghost small" data-action="shop">Backpack</button>
        <button class="pill profile-pill" data-action="switch" title="Change explorer">
          ${avatarSvg(p.avatar, lookFor(p).hat, "avatar tiny")}
          <span>${p.name}</span>
        </button>
      </div>
    </header>
  `;
}

/** Handlers shared by every screen that shows the header bar. */
export function headerHandlers(ctx: Ctx, redraw: () => void): Record<string, (el: HTMLElement) => void> {
  return {
    shop() { sfx.tap(); ctx.go({ name: "shop" }); },
    switch() { ctx.go({ name: "profiles" }); },
    narration() { const p = ctx.profile(); p.settings.narration = !p.settings.narration; ctx.save(); redraw(); },
    reo() { const p = ctx.profile(); p.settings.teReo = !p.settings.teReo; ctx.save(); redraw(); },
  };
}

export function renderMap(ctx: Ctx): void {
  const el = mount(ctx, "map-screen");
  const draw = (): void => {
    const p = ctx.profile();
    const highest = REGIONS.reduce((h, r) => (regionUnlocked(p, r.index) ? r.index : h), 0);
    el.innerHTML = html`
      ${headerBar(ctx)}
      <div class="land">
        <svg class="route" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <path d="M130 400 C 250 300, 300 150, 400 140 S 620 340, 700 320 S 880 120, 900 110" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 16" opacity="0.8"/>
        </svg>
        ${REGIONS.map((region) => {
          const unlocked = regionUnlocked(p, region.index);
          const stars = regionStars(p, region);
          return html`
            <button class="region-card pos-${region.index} ${unlocked ? "" : "locked"} ${regionComplete(p, region) ? "complete" : ""}" data-action="region" data-id="${region.id}" ${unlocked ? "" : "disabled"}>
              ${regionSvg(region.index)}
              ${unlocked ? "" : html`<span class="region-lock">${lockSvg()}</span>`}
              <span class="region-name">${region.name}</span>
              <span class="region-reo">${region.reoName} · ${region.yearLabel}</span>
              <span class="region-stars">${starSvg(true, "star inline")} ${stars.earned} / ${stars.total}</span>
            </button>
          `;
        })}
        <div class="explorer-wrap pos-${highest}">${explorerSvg(p.avatar, lookFor(p))}</div>
      </div>
      <section class="sanctuary">
        <h2>Wildlife sanctuary</h2>
        <div class="sanctuary-row">
          ${REGIONS.map((r) => html`<div class="sanctuary-slot ${rescuePassed(p, r) ? "rescued" : ""}" title="${rescuePassed(p, r) ? r.rescue.fact : `Rescue the ${r.rescue.name} in ${r.name}`}">${creatureSvg(r.rescue.creature)}<span>${rescuePassed(p, r) ? r.rescue.reoName : "?"}</span></div>`)}
        </div>
        <p class="muted">Kia ora, ${p.name}! Pick a region to explore its trails. Rescue each creature to travel on.</p>
        <button class="btn ghost small" data-action="parent">Parents &amp; teachers</button>
      </section>
    `.value;
  };

  delegate(el, {
    ...headerHandlers(ctx, draw),
    region(t) { sfx.tap(); ctx.go({ name: "region", regionId: t.dataset.id ?? "" }); },
    parent() { ctx.go({ name: "parent" }); },
  });
  draw();
}
