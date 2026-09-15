import { mount, type Ctx } from "../app/context";
import { REGIONS, TIER_NAMES, findTrail } from "../curriculum";
import { STRAND_NAMES, type Strand, type Tier } from "../curriculum/types";
import { accuracy, trailResult, regionStars, regionUnlocked, totalStars, rescuedCreatures } from "../app/progress";
import { grantBonusMinutes, playedTodayMs, remainingTodayMs } from "../app/timer";
import type { Profile } from "../app/state";
import { avatarSvg, starSvg } from "../ui/art";
import { touch } from "../app/state";
import { cloudHandlers, cloudTab, detectRecovery, initialCloudUi } from "./cloudtab";
import { delegate, formatDate, formatDuration, html } from "../ui/html";

type Tab = "overview" | "curriculum" | "sessions" | "settings" | "cloud";
const STRANDS: Strand[] = ["number", "algebra", "measurement", "geometry", "statistics", "probability"];
const LIMITS = [0, 10, 15, 20, 30, 45, 60];

export function renderParent(ctx: Ctx): void {
  const el = mount(ctx, "parent-screen");
  let unlocked = false;
  let pinEntry = "";
  let pinFirst: string | null = null;
  let error = "";
  let tab: Tab = "overview";
  let selectedId: string | null = ctx.state.currentProfileId ?? ctx.state.profiles[0]?.id ?? null;
  let confirmAction: null | { kind: "reset" | "delete"; id: string } = null;
  const cloudUi = initialCloudUi();

  const selected = (): Profile | null => ctx.state.profiles.find((p) => p.id === selectedId) ?? null;

  const drawPin = (): void => {
    const creating = !ctx.state.parentPin;
    const heading = creating ? (pinFirst ? "Type the PIN again" : "Create a parent PIN") : "Enter the parent PIN";
    el.innerHTML = html`
      <header class="bar">
        <button class="btn ghost" data-action="back">‹ Back</button>
        <h1>Parents &amp; teachers</h1>
        <span></span>
      </header>
      <main class="pin-gate">
        <h2>${heading}</h2>
        ${creating ? html`<p class="muted">Choose 4 digits. Children will need this to reach the parent area.</p>` : ""}
        <div class="pin-dots">${[0, 1, 2, 3].map((i) => html`<span class="pin-dot ${pinEntry.length > i ? "on" : ""}"></span>`)}</div>
        ${error ? html`<p class="error">${error}</p>` : ""}
        <div class="numpad pin-pad">
          ${["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "clear"].map((k) => html`<button class="key ${k === "back" || k === "clear" ? "back" : ""}" data-action="pin" data-key="${k}">${k === "back" ? "⌫" : k === "clear" ? "C" : k}</button>`)}
        </div>
      </main>
    `.value;
  };

  const drawDashboard = (): void => {
    const p = selected();
    el.innerHTML = html`
      <header class="bar">
        <button class="btn ghost" data-action="back">‹ Back to game</button>
        <h1>Parents &amp; teachers</h1>
        <span></span>
      </header>
      <div class="dash">
        <nav class="child-tabs">
          ${ctx.state.profiles.map((c) => html`<button class="child-tab ${c.id === selectedId ? "on" : ""}" data-action="child" data-id="${c.id}">${avatarSvg(c.avatar, undefined, "avatar tiny")} ${c.name}</button>`)}
          ${ctx.state.profiles.length === 0 ? html`<p class="muted">No explorers yet. Create one from the start screen.</p>` : ""}
        </nav>
        <nav class="tabs">
          ${(["overview", "curriculum", "sessions", "settings", "cloud"] as Tab[]).map((t) => html`<button class="tab ${t === tab ? "on" : ""}" data-action="tab" data-tab="${t}">${t[0]?.toUpperCase()}${t.slice(1)}</button>`)}
        </nav>
        <section class="tab-body">
          ${tab === "cloud" ? cloudTab(ctx, cloudUi) : p ? (tab === "overview" ? overview(p) : tab === "curriculum" ? curriculum(p) : tab === "sessions" ? sessions(p) : settings(p)) : appSettings()}
        </section>
      </div>
    `.value;
  };

  const strandStats = (p: Profile): { strand: Strand; acc: number | null; total: number }[] =>
    STRANDS.map((strand) => {
      let correct = 0;
      let total = 0;
      for (const region of REGIONS) for (const trail of region.trails) {
        if (trail.strand !== strand && trail.strand2 !== strand) continue;
        for (const skill of trail.skills) {
          const st = p.stats.skills[skill.code];
          if (st) { correct += st.correct; total += st.total; }
        }
      }
      return { strand, acc: accuracy({ correct, total }), total };
    });

  const overview = (p: Profile) => {
    const acc = accuracy({ correct: p.stats.questionsCorrect, total: p.stats.questionsAnswered });
    const remaining = remainingTodayMs(p);
    return html`
      <div class="stat-grid">
        <div class="stat"><span class="stat-value">${totalStars(p)}</span><span class="stat-label">stars earned</span></div>
        <div class="stat"><span class="stat-value">${p.stats.questionsAnswered}</span><span class="stat-label">questions answered</span></div>
        <div class="stat"><span class="stat-value">${acc === null ? "–" : `${acc}%`}</span><span class="stat-label">first-try accuracy</span></div>
        <div class="stat"><span class="stat-value">${formatDuration(p.stats.timePlayedMs)}</span><span class="stat-label">time played (all time)</span></div>
        <div class="stat"><span class="stat-value">${formatDuration(playedTodayMs(p))}</span><span class="stat-label">played today${remaining !== null ? ` · ${Math.ceil(remaining / 60000)} min left` : ""}</span></div>
        <div class="stat"><span class="stat-value">${rescuedCreatures(p).length} / ${REGIONS.length}</span><span class="stat-label">creatures rescued</span></div>
      </div>
      <h3>Progress by region</h3>
      <div class="region-progress">
        ${REGIONS.map((r) => {
          const s = regionStars(p, r);
          const pct = Math.round((s.earned / s.total) * 100);
          return html`<div class="rp-row ${regionUnlocked(p, r.index) ? "" : "locked"}">
            <span class="rp-name">${r.name} <small>${r.yearLabel}</small></span>
            <span class="rp-bar"><span class="rp-fill" style="width:${pct}%; background:${r.colour}"></span></span>
            <span class="rp-num">${s.earned}/${s.total} ★${regionUnlocked(p, r.index) ? "" : " · locked"}</span>
          </div>`;
        })}
      </div>
      <h3>Accuracy by strand</h3>
      <div class="region-progress">
        ${strandStats(p).map((s) => html`<div class="rp-row">
          <span class="rp-name">${STRAND_NAMES[s.strand]} <small>${s.total} questions</small></span>
          <span class="rp-bar"><span class="rp-fill strand-fill-${s.strand}" style="width:${s.acc ?? 0}%"></span></span>
          <span class="rp-num">${s.acc === null ? "–" : `${s.acc}%`}</span>
        </div>`)}
      </div>
      <h3>Needs practice</h3>
      ${weakSkills(p)}
    `;
  };

  const weakSkills = (p: Profile) => {
    const rows = Object.entries(p.stats.skills)
      .filter(([, s]) => s.total >= 5)
      .map(([code, s]) => ({ code, acc: accuracy(s) ?? 0, total: s.total }))
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 5)
      .filter((r) => r.acc < 80);
    if (rows.length === 0) return html`<p class="muted">Nothing stands out yet. Skills with under 80% first-try accuracy (after 5+ questions) appear here.</p>`;
    return html`<ul class="weak-list">${rows.map((r) => { const info = skillInfo(r.code); return html`<li><strong>${info?.label ?? r.code}</strong> <span class="muted">${r.acc}% over ${r.total} questions · ${info?.trail ?? ""}</span></li>`; })}</ul>`;
  };

  const curriculum = (p: Profile) => html`
    <p class="muted">Every trail maps to the New Zealand Curriculum (Te Mātaiaho, Mathematics and Statistics) for Years 1 to 4, across Number, Algebra, Measurement, Geometry, Statistics and Probability.</p>
    ${REGIONS.map((region) => html`
      <details class="curr-region" ${regionUnlocked(p, region.index) ? "open" : ""}>
        <summary><span class="dotc" style="background:${region.colour}"></span> ${region.name} · ${region.yearLabel}</summary>
        <div class="table-wrap"><table class="curr-table">
          <thead><tr><th>Trail</th><th>Strand</th><th>Skill</th><th>Curriculum focus</th><th>Accuracy</th><th>Bronze</th><th>Silver</th><th>Gold</th></tr></thead>
          <tbody>
            ${region.trails.flatMap((trail) => trail.skills.map((skill, i) => {
              const st = p.stats.skills[skill.code];
              const acc = accuracy(st);
              return html`<tr>
                ${i === 0 ? html`<td rowspan="${trail.skills.length}" class="trail-cell">${trail.name}</td><td rowspan="${trail.skills.length}"><span class="strand-badge strand-${trail.strand}">${STRAND_NAMES[trail.strand]}</span>${trail.strand2 ? html`<br /><span class="strand-badge strand-${trail.strand2}">${STRAND_NAMES[trail.strand2]}</span>` : ""}</td>` : ""}
                <td>${skill.label}</td>
                <td class="muted small-text">${skill.curriculum}</td>
                <td>${acc === null ? "–" : html`<span class="acc ${acc >= 80 ? "good" : acc >= 60 ? "ok" : "low"}">${acc}%</span> <small class="muted">(${st?.total ?? 0})</small>`}</td>
                ${i === 0 ? ([1, 2, 3] as Tier[]).map((t) => { const r = trailResult(p, trail.id, t); return html`<td rowspan="${trail.skills.length}" class="tier-cell">${r ? html`${[1, 2, 3].map((n) => starSvg(r.stars >= n, "star tiny"))}<br /><small>${r.best}/10</small>` : html`<span class="muted">–</span>`}</td>`; }) : ""}
              </tr>`;
            }))}
          </tbody>
        </table></div>
      </details>
    `)}
  `;

  const sessions = (p: Profile) => {
    if (p.stats.sessions.length === 0) return html`<p class="muted">No rounds played yet.</p>`;
    return html`<div class="table-wrap"><table class="curr-table">
      <thead><tr><th>Date</th><th>Activity</th><th>Level</th><th>Score</th><th>Time</th></tr></thead>
      <tbody>${p.stats.sessions.map((s) => {
        const t = findTrail(s.trailId);
        const region = REGIONS.find((r) => `${r.id}:rescue` === s.trailId);
        return html`<tr><td>${formatDate(s.at)}</td><td>${t ? `${t.trail.name} (${t.region.name})` : region ? `Rescue the ${region.rescue.name}` : s.trailId}</td><td>${s.tier === 0 ? "Rescue" : TIER_NAMES[s.tier]}</td><td>${s.correct}/${s.total}</td><td>${Math.max(1, Math.round(s.durationMs / 1000))}s</td></tr>`;
      })}</tbody>
    </table></div>`;
  };

  const settings = (p: Profile) => html`
    <h3>Daily play limit</h3>
    <p class="muted">When the limit is reached, ${p.name} sees a friendly "time to rest" screen. Played today: ${formatDuration(playedTodayMs(p))}.</p>
    <div class="chip-row">
      ${LIMITS.map((m) => html`<button class="chip ${p.dailyLimitMin === m ? "on" : ""}" data-action="limit" data-min="${m}">${m === 0 ? "Off" : `${m} min`}</button>`)}
      ${p.dailyLimitMin ? html`<button class="btn small" data-action="bonus">+10 bonus minutes today</button>` : ""}
    </div>
    <h3>Learning options</h3>
    <div class="chip-row">
      <button class="btn small" data-action="narration">Read questions aloud: ${p.settings.narration ? "on" : "off"}</button>
      <button class="btn small" data-action="reo">Te reo Māori numbers: ${p.settings.teReo ? "on" : "off"}</button>
    </div>
    <h3>Regions</h3>
    <p class="muted">Regions normally unlock by rescuing the previous region's creature. Open more here if ${p.name} is ready.</p>
    <div class="chip-row">
      ${REGIONS.map((r) => html`<button class="chip ${p.parentUnlockedRegion >= r.index ? "on" : ""}" data-action="unlock" data-index="${r.index}">${r.name}</button>`)}
    </div>
    <h3>Danger zone</h3>
    ${confirmAction && confirmAction.id === p.id
      ? html`<div class="confirm-box">
          <p><strong>${confirmAction.kind === "reset" ? `Reset all of ${p.name}'s progress, stars and feathers?` : `Delete ${p.name}'s profile completely?`}</strong> This cannot be undone.</p>
          <button class="btn danger" data-action="confirm">Yes, ${confirmAction.kind === "reset" ? "reset" : "delete"}</button>
          <button class="btn" data-action="cancel">Cancel</button>
        </div>`
      : html`<div class="chip-row"><button class="btn" data-action="reset">Reset progress</button><button class="btn danger" data-action="delete">Delete profile</button></div>`}
    ${appSettings()}
  `;

  const appSettings = () => html`
    <h3>App settings</h3>
    <div class="chip-row">
      <button class="btn" data-action="sound">Sound effects: ${ctx.state.settings.sound ? "on" : "off"}</button>
      <button class="btn" data-action="changepin">Change parent PIN</button>
    </div>
  `;

  delegate(el, {
    back() { ctx.go(ctx.currentProfile() ? { name: "map" } : { name: "profiles" }); },
    pin(t) {
      const k = t.dataset.key ?? "";
      error = "";
      if (k === "back") pinEntry = pinEntry.slice(0, -1);
      else if (k === "clear") pinEntry = "";
      else if (pinEntry.length < 4) pinEntry += k;
      if (pinEntry.length === 4) {
        if (!ctx.state.parentPin) {
          if (pinFirst === null) { pinFirst = pinEntry; pinEntry = ""; }
          else if (pinFirst === pinEntry) { ctx.state.parentPin = pinEntry; ctx.state.parentPinUpdatedAt = Date.now(); ctx.save(); unlocked = true; }
          else { error = "The PINs did not match. Start again."; pinFirst = null; pinEntry = ""; }
        } else if (pinEntry === ctx.state.parentPin) unlocked = true;
        else { error = "That PIN is not right."; pinEntry = ""; }
      }
      unlocked ? drawDashboard() : drawPin();
    },
    child(t) { selectedId = t.dataset.id ?? null; confirmAction = null; drawDashboard(); },
    tab(t) { tab = (t.dataset.tab as Tab) ?? "overview"; drawDashboard(); },
    limit(t) { const p = selected(); if (!p) return; p.dailyLimitMin = Number(t.dataset.min); touch(p); ctx.save(); drawDashboard(); },
    bonus() { const p = selected(); if (!p) return; grantBonusMinutes(p, 10); touch(p); ctx.save(); drawDashboard(); },
    narration() { const p = selected(); if (!p) return; p.settings.narration = !p.settings.narration; touch(p); ctx.save(); drawDashboard(); },
    reo() { const p = selected(); if (!p) return; p.settings.teReo = !p.settings.teReo; touch(p); ctx.save(); drawDashboard(); },
    unlock(t) { const p = selected(); if (!p) return; const idx = Number(t.dataset.index); p.parentUnlockedRegion = p.parentUnlockedRegion === idx ? Math.max(0, idx - 1) : idx; touch(p); ctx.save(); drawDashboard(); },
    reset() { const p = selected(); if (p) { confirmAction = { kind: "reset", id: p.id }; drawDashboard(); } },
    delete() { const p = selected(); if (p) { confirmAction = { kind: "delete", id: p.id }; drawDashboard(); } },
    cancel() { confirmAction = null; drawDashboard(); },
    confirm() {
      const p = selected();
      if (!p || !confirmAction) return;
      if (confirmAction.kind === "reset") {
        p.progress = {}; p.rescues = {}; p.feathers = 0; p.playLog = {}; p.bonusLog = {};
        p.stats = { timePlayedMs: 0, questionsAnswered: 0, questionsCorrect: 0, skills: {}, sessions: [] };
        p.shop = { owned: [], equipped: {} };
        touch(p);
      } else {
        ctx.state.profiles = ctx.state.profiles.filter((c) => c.id !== p.id);
        ctx.state.deleted[p.id] = Date.now();
        if (ctx.state.currentProfileId === p.id) ctx.state.currentProfileId = null;
        selectedId = ctx.state.profiles[0]?.id ?? null;
      }
      confirmAction = null;
      ctx.save();
      drawDashboard();
    },
    sound() { ctx.state.settings.sound = !ctx.state.settings.sound; ctx.save(); drawDashboard(); },
    changepin() { ctx.state.parentPin = null; ctx.state.parentPinUpdatedAt = Date.now(); pinFirst = null; pinEntry = ""; unlocked = false; ctx.save(); drawPin(); },
    ...cloudHandlers(ctx, cloudUi, el, drawDashboard),
  });

  // Enter in a cloud form triggers the form's action instead of reloading the page.
  el.addEventListener("submit", (ev) => {
    const form = (ev.target as HTMLElement).closest<HTMLElement>("form[data-submit]");
    if (!form) return;
    ev.preventDefault();
    form.querySelector<HTMLElement>(`[data-action="${form.dataset.submit}"]`)?.click();
  });

  void detectRecovery(cloudUi).then((pending) => {
    if (pending) tab = "cloud";
    if (pending && unlocked) drawDashboard();
  });

  drawPin();
}

function skillInfo(code: string): { label: string; trail: string } | undefined {
  for (const region of REGIONS) for (const trail of region.trails) for (const s of trail.skills) if (s.code === code) return { label: s.label, trail: `${trail.name}, ${region.name}` };
  return undefined;
}
