import type { Tier } from "../curriculum/types";
import type { AppState, Profile } from "./state";

export type Route =
  | { name: "welcome" }
  | { name: "link" }
  | { name: "save-online" }
  | { name: "profiles" }
  | { name: "new-profile" }
  | { name: "map" }
  | { name: "region"; regionId: string }
  | { name: "play"; regionId: string; trailId: string | null; tier: Tier | 0 }
  | { name: "shop" }
  | { name: "parent" }
  | { name: "timeup" };

export interface Ctx {
  state: AppState;
  root: HTMLElement;
  route: Route;
  profile(): Profile;
  currentProfile(): Profile | null;
  save(): void;
  go(route: Route): void;
}

export function mount(ctx: Ctx, className: string): HTMLElement {
  const el = document.createElement("div");
  el.className = `screen ${className}`;
  ctx.root.replaceChildren(el);
  return el;
}
