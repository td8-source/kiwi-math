import { mount, type Ctx, type Route } from "../app/context";
import { TIER_NAMES, trailRound, findTrail, findRegion, rescueRound } from "../curriculum";
import type { Question, Tier } from "../curriculum/types";
import { teReoNumber } from "../curriculum/helpers";
import { recordRound, type AnswerRecord, type RoundOutcome } from "../app/progress";
import { workedExample, type ShowStep } from "../app/showme";
import { sfx } from "../app/audio";
import { cancelSpeech, speak } from "../app/speech";
import { allowedTodayMs, playedTodayMs } from "../app/timer";
import { creatureSvg, featherSvg, speakerSvg, starSvg } from "../ui/art";
import { delegate, html, raw } from "../ui/html";
import { renderVisual } from "../ui/visuals";

type PlayRoute = Extract<Route, { name: "play" }>;

interface Session {
  questions: Question[];
  index: number;
  attempt: 1 | 2;
  answers: AnswerRecord[];
  results: ("right" | "second" | "wrong" | undefined)[];
  typed: string;
  startedAt: number;
  visualHidden: boolean;
  phase: "question" | "feedback-right" | "feedback-retry" | "feedback-reveal" | "done" | "leave";
  outcome?: RoundOutcome;
  timer?: number;
  /** The "Show me how" walkthrough, once a child asks for it. */
  show?: { steps: ShowStep[]; at: number };
  showTimer?: number;
}

const PRAISE = ["Ka pai!", "Tino pai!", "Yes! Well done!", "Brilliant!", "You've got it!", "Ka rawe!"];

export function renderPlay(ctx: Ctx, route: PlayRoute): void {
  const region = findRegion(route.regionId);
  if (!region) return ctx.go({ name: "map" });
  const found = route.trailId ? findTrail(route.trailId) : undefined;
  const trail = found?.trail ?? null;
  const tier = route.tier;
  const isRescue = tier === 0 || !trail;
  const questions = isRescue ? rescueRound(region) : trailRound(trail, tier as Tier);
  const title = isRescue ? `Rescue the ${region.rescue.name}` : `${trail.name} · ${TIER_NAMES[tier as Tier]}`;

  const el = mount(ctx, "play-screen");
  el.style.setProperty("--region", region.colour);
  const s: Session = { questions, index: 0, attempt: 1, answers: [], results: Array(questions.length).fill(undefined), typed: "", startedAt: Date.now(), visualHidden: false, phase: "question" };

  const current = (): Question => s.questions[s.index] as Question;
  const canAnswer = (): boolean => s.phase === "question" || s.phase === "feedback-retry";
  const clearTimer = (): void => { if (s.timer) { window.clearTimeout(s.timer); s.timer = undefined; } };
  const clearShowTimer = (): void => { if (s.showTimer) { window.clearTimeout(s.showTimer); s.showTimer = undefined; } };
  const useReo = (): boolean => ctx.profile().settings.teReo;
  /** Only offered once the answer is on screen, so it can never be used to get one. */
  const canShow = (): boolean => s.phase === "feedback-reveal" && !!workedExample(current());

  const outOfTime = (): boolean => {
    const p = ctx.profile();
    const allowed = allowedTodayMs(p);
    return allowed !== null && playedTodayMs(p) + (Date.now() - s.startedAt) >= allowed;
  };

  const sayPrompt = (): void => {
    const q = current();
    if (ctx.profile().settings.narration) speak(q.say ?? q.prompt);
  };

  const startQuestion = (): void => {
    clearTimer();
    if (s.index > 0 && outOfTime()) return finish(true);
    clearShowTimer();
    s.attempt = 1;
    s.typed = "";
    s.phase = "question";
    s.visualHidden = false;
    s.show = undefined;
    const q = current();
    if (q.flash) s.timer = window.setTimeout(() => { s.visualHidden = true; draw(); }, q.flash);
    draw();
    sayPrompt();
  };

  const submit = (value: string): void => {
    if (!canAnswer()) return;
    const q = current();
    const correct = normalise(value) === normalise(q.answer);
    clearTimer();
    if (correct) {
      const firstTry = s.attempt === 1;
      s.answers.push({ skill: q.skill, firstTry, correctEventually: true });
      s.results[s.index] = firstTry ? "right" : "second";
      s.phase = "feedback-right";
      sfx.correct();
      if (firstTry) window.setTimeout(() => sfx.coin(), 250);
      draw();
      if (ctx.profile().settings.narration) speak(firstTry ? (PRAISE[s.index % PRAISE.length] as string) : "That's it!");
      s.timer = window.setTimeout(next, firstTry ? 1000 : 1200);
      return;
    }
    sfx.wrong();
    if (s.attempt === 1) {
      s.attempt = 2;
      s.typed = "";
      s.visualHidden = false;
      s.phase = "feedback-retry";
      draw();
      if (ctx.profile().settings.narration && q.hint) speak(`Not quite. ${q.hint}`);
      return;
    }
    s.answers.push({ skill: q.skill, firstTry: false, correctEventually: false });
    s.results[s.index] = "wrong";
    s.phase = "feedback-reveal";
    draw();
    if (ctx.profile().settings.narration) speak(`The answer is ${q.answer}. ${q.explain ?? ""}`);
  };

  const next = (): void => {
    clearTimer();
    if (s.index + 1 >= s.questions.length) return finish(false);
    s.index += 1;
    startQuestion();
  };

  const finish = (timedOut: boolean): void => {
    cancelSpeech();
    const profile = ctx.profile();
    if (s.answers.length === 0) return ctx.go({ name: "timeup" });
    s.outcome = recordRound(profile, { region, trailId: trail?.id ?? null, tier, answers: s.answers, durationMs: Date.now() - s.startedAt });
    ctx.save();
    if (timedOut) return ctx.go({ name: "timeup" });
    s.phase = "done";
    if (s.outcome.stars > 0) sfx.fanfare(); else sfx.unlock();
    draw();
    if (profile.settings.narration) {
      const o = s.outcome;
      speak(o.rescued ? `Ka rawe! You rescued the ${o.rescued.name}!` : o.stars === 3 ? "Perfect! Tino pai!" : o.stars > 0 ? "Ka pai! Great work!" : "Keep practising, you're getting there.");
    }
  };

  /**
   * Walk through the strategy, after the answer has already been revealed. Counting
   * steps advance on their own so a child can count along; the last one waits.
   */
  const showStep = (): void => {
    clearShowTimer();
    const step = s.show?.steps[s.show.at];
    if (!step) return;
    draw();
    if (ctx.profile().settings.narration) speak(step.say ?? step.caption);
    if (step.hold) s.showTimer = window.setTimeout(advanceShow, step.hold);
  };

  const advanceShow = (): void => {
    if (!s.show) return;
    if (s.show.at + 1 >= s.show.steps.length) { clearShowTimer(); return; }
    s.show.at += 1;
    showStep();
  };

  const startShow = (): void => {
    const steps = workedExample(current());
    if (!steps?.length) return;
    sfx.tap();
    s.show = { steps, at: 0 };
    showStep();
  };

  const draw = (): void => {
    if (s.phase === "done" && s.outcome) return drawResults(s.outcome);
    if (s.phase === "leave") return drawLeave();
    const q = current();
    const answered = s.phase !== "question" && s.phase !== "feedback-retry";
    const step = s.show?.steps[s.show.at];
    const lastStep = !!s.show && s.show.at + 1 >= s.show.steps.length;
    const showVisual = q.visual && !(s.visualHidden && s.phase === "question");
    const optionsHtml = q.mode === "numpad"
      ? numpadHtml(s.typed, answered, useReo())
      : html`<div class="options ${q.mode === "truefalse" ? "tf" : ""} count-${q.options?.length ?? 0}">
          ${(q.options ?? []).map((o) => {
            const state = answered ? (o.value === q.answer ? "is-right" : "is-dim") : "";
            const long = (o.label?.length ?? 0) > 14 ? "long" : (o.label?.length ?? 0) > 8 ? "medium" : "";
            return html`<button class="option ${o.visual ? "has-visual" : ""} ${state} ${long}" data-action="answer" data-value="${o.value}" ${answered ? "disabled" : ""}>
              ${o.visual ? renderVisual(o.visual, true) : ""}
              ${o.label !== undefined ? html`<span class="option-label">${o.label}</span>` : ""}
              ${o.reo && useReo() ? html`<span class="option-reo">${o.reo}</span>` : ""}
            </button>`;
          })}
        </div>`;

    el.innerHTML = html`
      <header class="bar play-bar">
        <button class="btn ghost" data-action="leave">✕ Leave</button>
        <h1>${title}</h1>
        <div class="progress-shells" aria-label="progress">
          ${s.results.map((r, i) => html`<span class="shell ${r ?? ""} ${i === s.index ? "current" : ""}"></span>`)}
        </div>
      </header>
      <main class="question-area ${s.phase} ${step ? "walking" : ""}">
        ${step
          ? html`<div class="visual showme-visual">${step.visual ? renderVisual(step.visual) : ""}</div>`
          : q.visual ? html`<div class="visual ${q.flash ? "flash" : ""}">${showVisual ? renderVisual(q.visual) : html`<div class="peek-gone">Gone! How many were there?</div>`}</div>` : ""}
        <h2 class="prompt">
          <button class="say-btn" data-action="say" title="Read it to me" aria-label="Read the question aloud">${speakerSvg()}</button>
          <span>${q.prompt}</span>
        </h2>
        ${step
          ? html`<div class="showme" role="status" aria-live="polite">
              <p class="showme-caption">${step.caption}</p>
              <div class="showme-actions">
                ${lastStep
                  ? html`<button class="btn primary big" data-action="next">Got it! ›</button>`
                  : html`<button class="btn primary big" data-action="show-next">Next ›</button><button class="btn ghost" data-action="show-skip">Skip</button>`}
              </div>
            </div>`
          : html`
            ${s.phase === "feedback-retry" ? html`<div class="feedback retry"><strong>Not quite.</strong> ${q.hint ?? "Have another go!"}</div>` : ""}
            ${s.phase === "feedback-right" ? html`<div class="feedback right">${s.attempt === 1 ? raw(`${featherSvg("feather inline")} ${PRAISE[s.index % PRAISE.length]}`) : "That's it!"}</div>` : ""}
            ${s.phase === "feedback-reveal" ? html`<div class="feedback reveal"><strong>The answer is ${q.answer}.</strong> ${q.explain ?? q.hint ?? ""}<div class="chip-row feedback-actions">${canShow() ? html`<button class="btn" data-action="show-me">Show me how</button>` : ""}<button class="btn primary" data-action="next">Next ›</button></div></div>` : ""}
            ${optionsHtml}`}
      </main>
    `.value;
  };

  const drawResults = (o: RoundOutcome): void => {
    el.innerHTML = html`
      <main class="results">
        ${o.rescued ? html`<div class="rescued-banner">${creatureSvg(o.rescued.creature, "creature big")}<div><h1>You rescued the ${o.rescued.name}!</h1><p class="reo-name">${o.rescued.reoName}</p><p class="muted">${o.rescued.fact}</p></div></div>` : html`<h1>${o.stars === 3 ? "Perfect! Tino pai!" : o.stars > 0 ? "Ka pai! Great work!" : "Keep practising!"}</h1>`}
        <div class="result-stars">${[1, 2, 3].map((n) => starSvg(o.stars >= n, `star big ${o.stars >= n ? "pop" : ""}`))}</div>
        <p class="result-line">${o.correct} out of ${o.total} first time</p>
        <p class="result-line feathers">${featherSvg("feather inline")} +${o.feathersEarned} feathers</p>
        ${o.unlocked.length ? html`<ul class="unlocks">${o.unlocked.map((u) => html`<li>🎉 ${u}</li>`)}</ul>` : ""}
        ${o.stars === 0 ? html`<p class="muted">You need ${Math.ceil(o.total * 0.7)} right first time to earn a star. Give it another go!</p>` : ""}
        <div class="result-actions">
          <button class="btn primary big" data-action="again">Play again</button>
          <button class="btn big" data-action="region">Back to ${region.name}</button>
          <button class="btn ghost" data-action="map">World map</button>
        </div>
      </main>
    `.value;
  };

  const drawLeave = (): void => {
    el.innerHTML = html`
      <main class="results">
        <h1>Leave this round?</h1>
        <p class="result-line">Your progress in this round will not be saved.</p>
        <div class="result-actions">
          <button class="btn primary big" data-action="stay">Keep playing</button>
          <button class="btn big" data-action="region">Leave</button>
        </div>
      </main>
    `.value;
  };

  delegate(el, {
    answer(t) { submit(t.dataset.value ?? ""); },
    key(t) {
      if (!canAnswer()) return;
      const k = t.dataset.key ?? "";
      sfx.tap();
      if (k === "back") s.typed = s.typed.slice(0, -1);
      else if (s.typed.length < 5) s.typed += k;
      draw();
    },
    go() { if (s.typed) submit(s.typed); },
    say() { const q = current(); speak(q.say ?? q.prompt); },
    next() { clearShowTimer(); next(); },
    "show-me"() { startShow(); },
    "show-next"() { sfx.tap(); advanceShow(); },
    "show-skip"() { clearShowTimer(); cancelSpeech(); s.show = undefined; draw(); },
    leave() { clearTimer(); clearShowTimer(); cancelSpeech(); s.phase = "leave"; draw(); },
    stay() { s.phase = "question"; startQuestion(); },
    region() { clearTimer(); clearShowTimer(); ctx.go({ name: "region", regionId: region.id }); },
    map() { clearTimer(); clearShowTimer(); ctx.go({ name: "map" }); },
    again() { clearTimer(); clearShowTimer(); ctx.go(route); },
  });

  const onKey = (ev: KeyboardEvent): void => {
    if (!document.body.contains(el)) { window.removeEventListener("keydown", onKey); return; }
    if (!canAnswer() || current().mode !== "numpad") return;
    if (/^\d$/.test(ev.key) && s.typed.length < 5) { s.typed += ev.key; draw(); }
    else if (ev.key === "Backspace") { s.typed = s.typed.slice(0, -1); draw(); }
    else if (ev.key === "Enter" && s.typed) submit(s.typed);
  };
  window.addEventListener("keydown", onKey);

  startQuestion();
}

function normalise(v: string): string {
  return v.trim().replace(/^0+(?=\d)/, "");
}

function numpadHtml(typed: string, disabled: boolean, reo: boolean) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "go"];
  const reoWord = reo && typed ? teReoNumber(Number(typed)) : undefined;
  return html`
    <div class="numpad-wrap">
      <div class="typed ${typed ? "" : "empty"}">${typed || "?"}${reoWord ? html`<span class="typed-reo">${reoWord}</span>` : ""}</div>
      <div class="numpad">
        ${keys.map((k) =>
          k === "go"
            ? html`<button class="key go" data-action="go" ${disabled || !typed ? "disabled" : ""}>Go</button>`
            : html`<button class="key ${k === "back" ? "back" : ""}" data-action="key" data-key="${k}" ${disabled ? "disabled" : ""}>${k === "back" ? "⌫" : k}</button>`,
        )}
      </div>
    </div>
  `;
}
