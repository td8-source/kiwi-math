import { mount, type Ctx } from "../app/context";
import { playedTodayMs } from "../app/timer";
import { speak } from "../app/speech";
import { creatureSvg } from "../ui/art";
import { delegate, formatDuration, html } from "../ui/html";

export function renderTimeUp(ctx: Ctx): void {
  const el = mount(ctx, "timeup-screen");
  const p = ctx.profile();
  el.innerHTML = html`
    <main class="results timeup">
      ${creatureSvg("morepork", "creature big")}
      <h1>Time to rest, ${p.name}!</h1>
      <p class="result-line">Ruru the morepork says you've explored for ${formatDuration(playedTodayMs(p))} today. Ka pai!</p>
      <p class="muted">Come back tomorrow for more trails. Your progress is saved.</p>
      <div class="result-actions">
        <button class="btn primary big" data-action="switch">Change explorer</button>
        <button class="btn ghost" data-action="parent">Parents &amp; teachers</button>
      </div>
    </main>
  `.value;
  if (p.settings.narration) speak(`Time to rest, ${p.name}. Come back tomorrow for more trails.`);
  delegate(el, {
    switch() { ctx.state.currentProfileId = null; ctx.save(); ctx.go({ name: "profiles" }); },
    parent() { ctx.go({ name: "parent" }); },
  });
}
