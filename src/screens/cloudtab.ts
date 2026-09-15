/**
 * The "Cloud" tab of the parent area: parent accounts (email + password) and family codes.
 */
import type { Ctx } from "../app/context";
import { cloudConfigured, currentUser, passwordRecoveryPending, pullFamily, requestPasswordReset, signIn, signOut, signUp, updatePassword } from "../app/cloud";
import { generateFamilyCode, isValidFamilyCode, normaliseFamilyCode } from "../app/familycode";
import { syncNow, syncStatus } from "../app/sync";
import { html, type Raw } from "../ui/html";

export interface CloudUi {
  view: "menu" | "account" | "family";
  busy: boolean;
  message: string;
  error: string;
  newCode: string | null;
  showCode: boolean;
  recovery: boolean;
  /** Typed values kept across redraws (passwords are never kept). */
  email: string;
  code: string;
}

export function initialCloudUi(): CloudUi {
  return { view: "menu", busy: false, message: "", error: "", newCode: null, showCode: false, recovery: false, email: "", code: "" };
}

function when(ts: number | undefined): string {
  if (!ts) return "never";
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return new Date(ts).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function cloudTab(ctx: Ctx, ui: CloudUi): Raw {
  const s = ctx.state.sync;
  if (!cloudConfigured()) {
    return html`
      <h3>Cloud sync</h3>
      <p class="muted">Cloud sync is not set up in this build. To let children continue on other devices, create a free Supabase project, run <code>supabase/schema.sql</code> in its SQL editor, and add the project URL and anon key as <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> repository variables (or a local <code>.env.local</code>). The README has the full steps.</p>
    `;
  }
  const notice = html`${ui.error ? html`<p class="error cloud-error">${ui.error}</p>` : ""}${ui.message ? html`<p class="cloud-message">${ui.message}</p>` : ""}`;
  if (ui.recovery) {
    return html`
      <h3>Choose a new password</h3>
      ${notice}
      <form class="cloud-form" data-submit="cloud-newpassword">
        <label class="field"><span>New password</span><input name="password" type="password" minlength="6" autocomplete="new-password" required /></label>
        <button class="btn primary" data-action="cloud-newpassword" ${ui.busy ? "disabled" : ""}>Save password</button>
      </form>
    `;
  }
  if (s.mode !== "none") {
    const status = syncStatus();
    return html`
      <h3>Cloud sync is on</h3>
      ${notice}
      <div class="cloud-status">
        <p>${s.mode === "account" ? html`Signed in as <strong>${s.email ?? "parent account"}</strong>.` : html`Linked with a <strong>family code</strong>.`}</p>
        <p class="muted">Last synced: ${when(s.lastSyncedAt)} · Status: ${status === "syncing" ? "syncing…" : status === "error" ? "problem (see above)" : status === "offline" ? "offline, will retry" : "up to date"}${s.lastError ? html` · <span class="error">${s.lastError}</span>` : ""}</p>
        ${s.mode === "family"
          ? html`<p class="muted">Enter this code in the parent area on another device or browser to continue there:</p>
              <p class="family-code ${ui.showCode ? "" : "hidden-code"}">${ui.showCode ? s.familyCode : "••••-••••-••••-••••-••••••"}</p>
              <button class="btn small" data-action="cloud-showcode">${ui.showCode ? "Hide code" : "Show code"}</button>`
          : html`<p class="muted">Sign in with the same email and password on another device or browser to continue there.</p>`}
      </div>
      <div class="chip-row">
        <button class="btn primary" data-action="cloud-syncnow" ${ui.busy ? "disabled" : ""}>Sync now</button>
        <button class="btn" data-action="cloud-signout" ${ui.busy ? "disabled" : ""}>${s.mode === "account" ? "Sign out" : "Unlink this device"}</button>
      </div>
      <p class="muted small-text">Progress stays on this device after signing out. Every explorer profile on this device is included in the cloud copy, and profiles from other devices appear here after a sync. Only first names, ages, avatars and progress are stored.</p>
    `;
  }
  if (ui.view === "account") {
    return html`
      <h3>Parent account</h3>
      <p class="muted">Children never need their own login. One parent account holds every explorer profile.</p>
      ${notice}
      <form class="cloud-form" data-submit="cloud-signin">
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required value="${ui.email}" /></label>
        <label class="field"><span>Password</span><input name="password" type="password" minlength="6" autocomplete="current-password" required /></label>
        <div class="chip-row">
          <button class="btn primary" data-action="cloud-signin" ${ui.busy ? "disabled" : ""}>Sign in</button>
          <button class="btn" data-action="cloud-signup" ${ui.busy ? "disabled" : ""}>Create account</button>
          <button class="btn ghost" data-action="cloud-reset" ${ui.busy ? "disabled" : ""}>Forgot password</button>
          <button class="btn ghost" data-action="cloud-view" data-view="menu">Back</button>
        </div>
      </form>
    `;
  }
  if (ui.view === "family") {
    return html`
      <h3>Family code</h3>
      <p class="muted">A family code is a secret made of four words and six digits. Anyone with the code can see and change the progress, so keep it private, like a password. There is no way to recover a lost code.</p>
      ${notice}
      ${ui.newCode
        ? html`<div class="cloud-status"><p><strong>Your new family code:</strong></p><p class="family-code">${ui.newCode}</p><p class="muted">Write it down or save it somewhere safe, then enter it in the parent area on your other devices.</p></div>`
        : ""}
      <form class="cloud-form" data-submit="cloud-family-join">
        <label class="field"><span>Enter an existing family code</span><input name="code" type="text" autocomplete="off" placeholder="kiwi-fern-river-mist-123456" value="${ui.code}" /></label>
        <div class="chip-row">
          <button class="btn primary" data-action="cloud-family-join" ${ui.busy ? "disabled" : ""}>Link this device</button>
          <button class="btn" data-action="cloud-family-create" ${ui.busy ? "disabled" : ""}>Create a new family code</button>
          <button class="btn ghost" data-action="cloud-view" data-view="menu">Back</button>
        </div>
      </form>
    `;
  }
  return html`
    <h3>Cloud sync</h3>
    <p class="muted">Continue on another device or browser. Progress keeps saving on this device either way; cloud sync adds a copy online and merges it so nothing earned is ever lost.</p>
    ${notice}
    <div class="cloud-options">
      <button class="cloud-option" data-action="cloud-view" data-view="account">
        <strong>Parent account</strong>
        <span class="muted">Email and password. Password reset by email. Recommended.</span>
      </button>
      <button class="cloud-option" data-action="cloud-view" data-view="family">
        <strong>Family code</strong>
        <span class="muted">No email needed. A secret code links your devices.</span>
      </button>
    </div>
  `;
}

function field(el: HTMLElement, name: string): string {
  return (el.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? "").trim();
}

export function cloudHandlers(ctx: Ctx, ui: CloudUi, root: HTMLElement, redraw: () => void): Record<string, (el: HTMLElement) => void> {
  const remember = (): void => {
    ui.email = field(root, "email") || ui.email;
    ui.code = field(root, "code") || ui.code;
  };
  const run = async (fn: () => Promise<void>): Promise<void> => {
    remember();
    ui.busy = true;
    ui.error = "";
    ui.message = "";
    redraw();
    try {
      await fn();
    } catch (err) {
      ui.error = err instanceof Error ? err.message : "Something went wrong.";
    }
    ui.busy = false;
    redraw();
  };
  const link = async (mode: "account" | "family", extra: Partial<typeof ctx.state.sync>): Promise<void> => {
    ctx.state.sync = { mode, ...extra };
    ctx.save();
    await syncNow();
    if (ctx.state.sync.lastError) ui.error = ctx.state.sync.lastError;
    else ui.message = "Synced. Explorer profiles from your other devices are now here too.";
  };
  return {
    "cloud-view"(t) { ui.view = (t.dataset.view as CloudUi["view"]) ?? "menu"; ui.error = ""; ui.message = ""; redraw(); },
    "cloud-showcode"() { ui.showCode = !ui.showCode; redraw(); },
    "cloud-signin"() {
      remember();
      const email = field(root, "email");
      const password = field(root, "password");
      if (!email || !password) { ui.error = "Enter your email and password."; redraw(); return; }
      void run(async () => {
        const r = await signIn(email, password);
        if (!r.ok) { ui.error = r.error; return; }
        await link("account", { email: r.value.email });
      });
    },
    "cloud-signup"() {
      remember();
      const email = field(root, "email");
      const password = field(root, "password");
      if (!email || password.length < 6) { ui.error = "Enter an email and a password of at least 6 characters."; redraw(); return; }
      void run(async () => {
        const r = await signUp(email, password);
        if (!r.ok) { ui.error = r.error; return; }
        if (r.value.needsConfirmation) { ui.message = "Account created. Check your email for a confirmation link, then sign in here."; return; }
        await link("account", { email });
      });
    },
    "cloud-reset"() {
      remember();
      const email = field(root, "email");
      if (!email) { ui.error = "Enter your email first, then press Forgot password."; redraw(); return; }
      void run(async () => {
        const r = await requestPasswordReset(email);
        ui.error = r.ok ? "" : r.error;
        ui.message = r.ok ? "If that email has an account, a reset link is on its way. Open it on this device to choose a new password." : "";
      });
    },
    "cloud-newpassword"() {
      const password = field(root, "password");
      if (password.length < 6) { ui.error = "Passwords need at least 6 characters."; redraw(); return; }
      void run(async () => {
        const r = await updatePassword(password);
        if (!r.ok) { ui.error = r.error; return; }
        ui.recovery = false;
        if (typeof history !== "undefined") history.replaceState(null, "", location.pathname + location.search);
        const user = await currentUser();
        if (user) await link("account", { email: user.email });
        ui.message = "Password saved. You are signed in.";
      });
    },
    "cloud-family-join"() {
      remember();
      const code = normaliseFamilyCode(field(root, "code"));
      if (!isValidFamilyCode(code)) { ui.error = "That does not look like a family code. It has four words and six digits, like kiwi-fern-river-mist-123456."; redraw(); return; }
      void run(async () => {
        const r = await pullFamily(code);
        if (!r.ok) { ui.error = r.error; return; }
        if (r.value === null) { ui.error = "No family was found with that code. Check every word and digit, or create a new code."; return; }
        await link("family", { familyCode: code });
      });
    },
    "cloud-family-create"() {
      void run(async () => {
        const code = generateFamilyCode();
        await link("family", { familyCode: code });
        if (!ctx.state.sync.lastError) { ui.newCode = code; ui.showCode = true; ui.message = ""; }
      });
    },
    "cloud-syncnow"() {
      void run(async () => {
        await syncNow();
        if (ctx.state.sync.lastError) ui.error = ctx.state.sync.lastError;
        else ui.message = "Up to date.";
      });
    },
    "cloud-signout"() {
      void run(async () => {
        if (ctx.state.sync.mode === "account") await signOut();
        ctx.state.sync = { mode: "none" };
        ui.view = "menu";
        ui.newCode = null;
        ctx.save();
        ui.message = "Cloud sync is off. Progress on this device is kept.";
      });
    },
  };
}

/** Call once when the parent area opens: detects a password-reset link. */
export async function detectRecovery(ui: CloudUi): Promise<boolean> {
  const pending = await passwordRecoveryPending();
  if (pending) ui.recovery = true;
  return pending;
}
