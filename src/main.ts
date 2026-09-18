import "./styles/main.css";
import { loadState, saveState } from "./app/storage";
import type { AppState, Profile } from "./app/state";
import type { Ctx, Route } from "./app/context";
import { setSoundEnabled } from "./app/audio";
import { cancelSpeech, setNarrationEnabled } from "./app/speech";
import { timeIsUp } from "./app/timer";
import { touch } from "./app/state";
import { initSync, schedulePush, syncNow } from "./app/sync";
import { initDiagnostics, noteScreen } from "./app/diagnostics";
import { passwordRecoveryPending } from "./app/cloud";
import { renderProfiles, renderNewProfile } from "./screens/profiles";
import { renderMap } from "./screens/map";
import { renderRegion } from "./screens/region";
import { renderPlay } from "./screens/play";
import { renderShop } from "./screens/shop";
import { renderParent } from "./screens/parent";
import { renderTimeUp } from "./screens/timeup";
import { renderLink, renderSaveOnline, renderWelcome } from "./screens/welcome";
import { mountReportButton } from "./screens/report";

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("Missing #app root");
  // Start catching errors before anything else, so a crash during boot is still reportable.
  initDiagnostics();
  const state: AppState = await loadState();

  const ctx: Ctx = {
    state,
    root,
    route: { name: "profiles" },
    currentProfile(): Profile | null {
      return state.profiles.find((p) => p.id === state.currentProfileId) ?? null;
    },
    profile(): Profile {
      const p = this.currentProfile();
      if (!p) throw new Error("No profile selected");
      return p;
    },
    save() {
      applySettings();
      const p = this.currentProfile();
      if (p) touch(p);
      void saveState(state);
      schedulePush();
    },
    go(route: Route) {
      render(route);
    },
  };

  function applySettings(): void {
    setSoundEnabled(state.settings.sound);
    const p = ctx.currentProfile();
    setNarrationEnabled(p ? p.settings.narration : false);
  }

  function render(route: Route): void {
    const needsProfile = !["profiles", "new-profile", "parent", "welcome", "link"].includes(route.name);
    if (needsProfile && !ctx.currentProfile()) route = { name: "profiles" };
    // With no explorers on this device yet, the picker becomes the welcome screen.
    if (route.name === "profiles" && state.profiles.length === 0) route = { name: "welcome" };
    // The daily limit blocks play and the map, but never the parent area or profile picker.
    const p = ctx.currentProfile();
    if (p && (route.name === "play" || route.name === "map" || route.name === "region" || route.name === "shop") && timeIsUp(p)) route = { name: "timeup" };
    cancelSpeech();
    applySettings();
    ctx.route = route;
    noteScreen(route);
    window.scrollTo(0, 0);
    switch (route.name) {
      case "welcome": return renderWelcome(ctx);
      case "link": return renderLink(ctx);
      case "save-online": return renderSaveOnline(ctx);
      case "profiles": return renderProfiles(ctx);
      case "new-profile": return renderNewProfile(ctx);
      case "map": return renderMap(ctx);
      case "region": return renderRegion(ctx, route.regionId);
      case "play": return renderPlay(ctx, route);
      case "shop": return renderShop(ctx);
      case "parent": return renderParent(ctx);
      case "timeup": return renderTimeUp(ctx);
    }
  }

  initSync({
    getState: () => state,
    setState(next) {
      // Keep the shared state object so every screen sees the merged data.
      Object.assign(state, next);
      applySettings();
      void saveState(state);
      if (ctx.route.name === "profiles" || ctx.route.name === "map" || ctx.route.name === "region") render(ctx.route);
    },
    onStatus(status) {
      document.querySelectorAll<HTMLElement>(".sync-pill").forEach((el) => { el.dataset.status = status; });
    },
  });

  // Lives outside #app, so the button stays put through every screen change.
  mountReportButton(ctx);

  const recovery = await passwordRecoveryPending();
  render(recovery ? { name: "link" } : ctx.currentProfile() ? { name: "map" } : { name: "profiles" });
  void syncNow();
}

void boot();
