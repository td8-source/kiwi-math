import { mount, type Ctx } from "../app/context";
import { TIER_NAMES, findRegion } from "../curriculum";
import { STRAND_NAMES, type Tier } from "../curriculum/types";
import { trailResult, trailUnlocked, tierUnlocked, rescuePassed, rescueUnlocked } from "../app/progress";
import { sfx } from "../app/audio";
import { creatureSvg, lockSvg, starSvg, trailIconSvg } from "../ui/art";
import { delegate, html } from "../ui/html";
import { headerBar, headerHandlers } from "./map";

const TIERS: Tier[] = [1, 2, 3];

export function renderRegion(ctx: Ctx, regionId: string): void {
  const region = findRegion(regionId);
  if (!region) return ctx.go({ name: "map" });
  const el = mount(ctx, "region-screen");
  el.style.setProperty("--region", region.colour);

  const draw = (): void => {
    const p = ctx.profile();
    el.innerHTML = html`
      ${headerBar(ctx, { back: { label: "Map", action: "map" }, title: region.name })}
      <p class="region-blurb">${region.blurb} <span class="muted">${region.reoName} · ${region.yearLabel}</span></p>
      <div class="trail-list">
        ${region.trails.map((trail, i) => {
          const open = trailUnlocked(p, region, i);
          return html`
            <section class="trail-card ${open ? "" : "locked"}">
              <div class="trail-head">
                ${trailIconSvg(trail.icon)}
                <div>
                  <h2>${trail.name} ${trail.reoName ? html`<small class="reo-name">${trail.reoName}</small>` : ""}</h2>
                  <p>${trail.blurb}</p>
                  <span class="strand-badge strand-${trail.strand}">${STRAND_NAMES[trail.strand]}${trail.strand2 ? ` · ${STRAND_NAMES[trail.strand2]}` : ""}</span>
                </div>
                ${open ? "" : lockSvg()}
              </div>
              <div class="tier-row">
                ${TIERS.map((tier) => {
                  const res = trailResult(p, trail.id, tier);
                  const unlocked = open && tierUnlocked(p, trail.id, tier);
                  return html`
                    <button class="tier-btn tier-${tier} ${unlocked ? "" : "locked"}" data-action="play" data-trail="${trail.id}" data-tier="${tier}" ${unlocked ? "" : "disabled"}>
                      <span class="tier-name">${TIER_NAMES[tier]}</span>
                      <span class="tier-stars">${[1, 2, 3].map((s) => starSvg((res?.stars ?? 0) >= s))}</span>
                      ${unlocked ? "" : lockSvg("lock small")}
                    </button>
                  `;
                })}
              </div>
            </section>
          `;
        })}
        ${(() => {
          const open = rescueUnlocked(p, region);
          const res = p.rescues[region.id];
          const done = rescuePassed(p, region);
          return html`
            <section class="trail-card rescue-card ${open ? "" : "locked"} ${done ? "done" : ""}">
              <div class="trail-head">
                ${creatureSvg(region.rescue.creature, "creature rescue-art")}
                <div>
                  <h2>Rescue the ${region.rescue.name} <small class="reo-name">${region.rescue.reoName}</small></h2>
                  <p>${done ? region.rescue.fact : open ? "A mixed challenge of every trail in this region. Pass it to free the creature and travel on!" : "Pass Bronze on every trail to unlock the rescue."}</p>
                </div>
                ${open ? "" : lockSvg()}
              </div>
              <div class="tier-row">
                <button class="tier-btn tier-rescue ${open ? "" : "locked"}" data-action="rescue" ${open ? "" : "disabled"}>
                  <span class="tier-name">${done ? "Play again" : "Start the rescue"}</span>
                  <span class="tier-stars">${[1, 2, 3].map((s) => starSvg((res?.stars ?? 0) >= s))}</span>
                </button>
              </div>
            </section>
          `;
        })()}
      </div>
    `.value;
  };

  delegate(el, {
    ...headerHandlers(ctx, draw),
    map() { ctx.go({ name: "map" }); },
    play(t) { sfx.tap(); ctx.go({ name: "play", regionId: region.id, trailId: t.dataset.trail ?? null, tier: Number(t.dataset.tier) as Tier }); },
    rescue() { sfx.tap(); ctx.go({ name: "play", regionId: region.id, trailId: null, tier: 0 }); },
  });
  draw();
}
