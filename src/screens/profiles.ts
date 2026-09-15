import { mount, type Ctx } from "../app/context";
import { AVATAR_CHARACTERS, AVATAR_COLOURS, createProfile } from "../app/state";
import { sfx } from "../app/audio";
import { speak } from "../app/speech";
import { avatarSvg, logoSvg } from "../ui/art";
import { delegate, html } from "../ui/html";
import { totalStars } from "../app/progress";
import { findItem } from "../app/shop";

export function renderProfiles(ctx: Ctx): void {
  const el = mount(ctx, "profiles-screen");
  const profiles = ctx.state.profiles;
  el.innerHTML = html`
    <header class="title-block">
      ${logoSvg()}
      <h1>Nature Maths</h1>
      <p class="subtitle">An Aotearoa maths quest for ages 5 to 8</p>
    </header>
    <h2 class="prompt-heading">Kia ora! Who is exploring today?</h2>
    <div class="profile-grid">
      ${profiles.map(
        (p) => html`
          <button class="profile-card" data-action="pick" data-id="${p.id}">
            ${avatarSvg(p.avatar, p.shop.equipped.hat ? findItem(p.shop.equipped.hat)?.variant : undefined)}
            <span class="profile-name">${p.name}</span>
            <span class="profile-meta">★ ${totalStars(p)}</span>
          </button>
        `,
      )}
      <button class="profile-card new" data-action="new">
        <span class="plus">+</span>
        <span class="profile-name">New explorer</span>
      </button>
    </div>
    <footer class="screen-footer">
      <button class="btn ghost small" data-action="parent">Parents &amp; teachers</button>
    </footer>
  `.value;

  delegate(el, {
    pick(target) {
      sfx.tap();
      ctx.state.currentProfileId = target.dataset.id ?? null;
      ctx.save();
      const p = ctx.currentProfile();
      if (p?.settings.narration) speak(`Kia ora ${p.name}! Let's explore.`);
      ctx.go({ name: "map" });
    },
    new() {
      sfx.tap();
      ctx.go({ name: "new-profile" });
    },
    parent() {
      ctx.go({ name: "parent" });
    },
  });
}

export function renderNewProfile(ctx: Ctx): void {
  const el = mount(ctx, "new-profile-screen");
  const draft = { name: "", age: 5 as 5 | 6 | 7 | 8, character: 0, colour: AVATAR_COLOURS[0] as string };

  const draw = (): void => {
    el.innerHTML = html`
      <header class="bar">
        <button class="btn ghost" data-action="back">‹ Back</button>
        <h1>Make your explorer</h1>
        <span></span>
      </header>
      <div class="new-profile-layout">
        <div class="preview-card">
          ${avatarSvg({ character: draft.character, colour: draft.colour }, undefined, "avatar big")}
          <div class="preview-name">${draft.name || "Your name"}</div>
        </div>
        <form class="profile-form" data-form>
          <label class="field">
            <span>What is your name?</span>
            <input name="name" type="text" maxlength="16" autocomplete="off" placeholder="Type your name" value="${draft.name}" />
          </label>
          <div class="field">
            <span>How old are you?</span>
            <div class="chip-row">
              ${[5, 6, 7, 8].map((a) => html`<button type="button" class="chip ${draft.age === a ? "on" : ""}" data-action="age" data-age="${a}">${a}</button>`)}
            </div>
          </div>
          <div class="field">
            <span>Pick an explorer</span>
            <div class="avatar-row">
              ${Array.from({ length: AVATAR_CHARACTERS }, (_, i) => html`<button type="button" class="avatar-pick ${draft.character === i ? "on" : ""}" data-action="character" data-i="${i}">${avatarSvg({ character: i, colour: draft.colour })}</button>`)}
            </div>
          </div>
          <div class="field">
            <span>Pick a colour</span>
            <div class="chip-row">
              ${AVATAR_COLOURS.map((c) => html`<button type="button" class="swatch ${draft.colour === c ? "on" : ""}" style="background:${c}" data-action="colour" data-c="${c}" aria-label="colour"></button>`)}
            </div>
          </div>
          <button type="submit" class="btn primary big" data-action="create">Start exploring!</button>
        </form>
      </div>
    `.value;
    const input = el.querySelector<HTMLInputElement>("input[name=name]");
    input?.addEventListener("input", () => {
      draft.name = input.value;
      const nameEl = el.querySelector(".preview-name");
      if (nameEl) nameEl.textContent = draft.name || "Your name";
    });
    el.querySelector("form")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      create();
    });
    input?.focus();
  };

  const create = (): void => {
    const profile = createProfile(draft.name, draft.age, { character: draft.character, colour: draft.colour });
    ctx.state.profiles.push(profile);
    ctx.state.currentProfileId = profile.id;
    ctx.save();
    sfx.fanfare();
    ctx.go({ name: "map" });
  };

  delegate(el, {
    back() { ctx.go({ name: "profiles" }); },
    age(t) { draft.age = Number(t.dataset.age) as 5 | 6 | 7 | 8; sfx.tap(); draw(); },
    character(t) { draft.character = Number(t.dataset.i); sfx.tap(); draw(); },
    colour(t) { draft.colour = t.dataset.c ?? draft.colour; sfx.tap(); draw(); },
    create() { create(); },
  });
  draw();
}
