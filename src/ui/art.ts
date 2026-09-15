import type { CreatureName, ItemKind, ShapeName } from "../curriculum/types";
import type { Avatar } from "../app/state";
import { raw, type Raw } from "./html";

const svg = (view: string, body: string, cls = ""): Raw => raw(`<svg viewBox="${view}" class="${cls}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`);

/* ---------- Countable items ---------- */

const ITEM_ART: Record<ItemKind, string> = {
  shell: `<path d="M20 34C9 34 4 26 4 18 12 8 28 8 36 18c0 8-5 16-16 16z" fill="#f9a8d4"/><path d="M20 34 12 12M20 34 20 10M20 34 28 12" stroke="#f472b6" stroke-width="2"/>`,
  feather: `<path d="M30 4C14 8 6 22 8 36c12-2 22-12 22-32z" fill="#a78bfa"/><path d="M8 36C16 28 22 18 30 4" stroke="#6d28d9" stroke-width="2" fill="none"/>`,
  berry: `<circle cx="20" cy="24" r="12" fill="#dc2626"/><circle cx="16" cy="20" r="3" fill="#fca5a5"/><path d="M20 12c2-6 6-8 10-8-2 4-4 6-10 8z" fill="#16a34a"/>`,
  leaf: `<path d="M34 6C14 8 6 20 6 34c14 0 26-8 28-28z" fill="#22c55e"/><path d="M6 34C14 24 22 16 34 6" stroke="#15803d" stroke-width="2" fill="none"/>`,
  stone: `<path d="M8 26c-2-10 8-18 18-16 8 2 12 10 8 18-4 6-24 8-26-2z" fill="#94a3b8"/><path d="M14 16c4-2 8-2 12 0" stroke="#e2e8f0" stroke-width="2" fill="none"/>`,
  flower: `<g fill="#f472b6"><circle cx="20" cy="9" r="6"/><circle cx="31" cy="17" r="6"/><circle cx="27" cy="30" r="6"/><circle cx="13" cy="30" r="6"/><circle cx="9" cy="17" r="6"/></g><circle cx="20" cy="20" r="6" fill="#facc15"/>`,
  egg: `<path d="M20 4c9 0 14 12 14 20a14 14 0 01-28 0C6 16 11 4 20 4z" fill="#bae6fd"/><circle cx="16" cy="14" r="2" fill="#7dd3fc"/><circle cx="24" cy="24" r="2.5" fill="#7dd3fc"/>`,
  star: `<path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>`,
  fish: `<path d="M6 20c4-8 12-11 20-8l6-5v26l-6-5c-8 3-16 0-20-8z" fill="#fb923c"/><circle cx="12" cy="18" r="2.2" fill="#0f172a"/>`,
  acorn: `<path d="M10 16h20v4c0 8-4 16-10 16S10 28 10 20z" fill="#b45309"/><path d="M8 16c0-6 6-10 12-10s12 4 12 10z" fill="#78350f"/><rect x="18" y="2" width="4" height="5" fill="#78350f"/>`,
  cup: `<path d="M8 8h24l-3 26H11z" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/><path d="M32 12c6 0 6 12 0 12" stroke="#0369a1" stroke-width="3" fill="none"/><path d="M10 14h20" stroke="#bae6fd" stroke-width="3"/>`,
};

export function itemSvg(item: ItemKind, cls = "item"): Raw {
  return svg("0 0 40 40", ITEM_ART[item], cls);
}

/* ---------- Creatures ---------- */

const CREATURE_ART: Record<CreatureName, string> = {
  kiwi: `<ellipse cx="44" cy="58" rx="34" ry="24" fill="#7c4a1e"/><circle cx="72" cy="42" r="14" fill="#7c4a1e"/><circle cx="77" cy="39" r="3" fill="#fff"/><circle cx="78" cy="39" r="1.5" fill="#000"/><path d="M84 44l30 4-30 3z" fill="#f59e0b"/><path d="M30 80v12M42 80v12M52 80v12" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>`,
  tui: `<ellipse cx="50" cy="60" rx="26" ry="30" fill="#0f172a"/><circle cx="60" cy="32" r="14" fill="#0f172a"/><circle cx="65" cy="29" r="3" fill="#fff"/><circle cx="66" cy="29" r="1.5" fill="#000"/><path d="M72 33l14 2-14 3z" fill="#334155"/><circle cx="56" cy="46" r="5" fill="#fff"/><path d="M30 70c-6 10-2 20 6 22" stroke="#0f172a" stroke-width="6" fill="none"/><path d="M40 60c8-4 14 0 16 6" stroke="#2dd4bf" stroke-width="3" fill="none"/>`,
  fantail: `<ellipse cx="48" cy="52" rx="16" ry="14" fill="#a16207"/><circle cx="60" cy="40" r="10" fill="#78350f"/><circle cx="64" cy="38" r="2.5" fill="#fff"/><circle cx="65" cy="38" r="1.2" fill="#000"/><path d="M70 41l8 1-8 2z" fill="#0f172a"/><path d="M34 56L10 30M34 58L6 44M34 60L8 60M34 62L10 76M34 60L16 88" stroke="#fef3c7" stroke-width="6" stroke-linecap="round"/><path d="M34 56L10 30M34 58L6 44M34 60L8 60M34 62L10 76M34 60L16 88" stroke="#a16207" stroke-width="2" stroke-linecap="round"/>`,
  weta: `<ellipse cx="50" cy="56" rx="26" ry="14" fill="#92400e"/><circle cx="76" cy="52" r="10" fill="#78350f"/><circle cx="80" cy="50" r="2.5" fill="#000"/><path d="M84 46l20-18M84 50l22-6" stroke="#78350f" stroke-width="2" fill="none"/><path d="M30 60l-14 20M40 64l-6 24M60 64l6 24M36 50L14 40M64 50l22-10" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M28 48c-10-16 0-30 10-26" stroke="#78350f" stroke-width="4" fill="none"/>`,
  tuatara: `<path d="M8 66c10-20 30-26 52-22 18 4 30 4 40 0-6 10-20 16-38 16-10 0-18 6-22 10z" fill="#4d7c0f"/><circle cx="86" cy="44" r="12" fill="#4d7c0f"/><circle cx="91" cy="41" r="3" fill="#fde047"/><circle cx="92" cy="41" r="1.5" fill="#000"/><path d="M30 42l4-8 4 8M42 40l4-8 4 8M54 40l4-8 4 8M66 40l4-8 4 8" fill="#a3e635"/><path d="M40 68v14M60 68v14" stroke="#4d7c0f" stroke-width="6" stroke-linecap="round"/>`,
  kea: `<ellipse cx="50" cy="58" rx="28" ry="24" fill="#65a30d"/><circle cx="72" cy="40" r="14" fill="#65a30d"/><circle cx="78" cy="37" r="3" fill="#fff"/><circle cx="79" cy="37" r="1.5" fill="#000"/><path d="M84 44c10-2 14 6 8 14-4-4-8-6-12-6z" fill="#374151"/><path d="M26 62c-6 6-4 14 4 16" stroke="#f97316" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M40 82v10M56 82v10" stroke="#374151" stroke-width="5" stroke-linecap="round"/>`,
  penguin: `<ellipse cx="50" cy="60" rx="26" ry="32" fill="#1e3a8a"/><ellipse cx="50" cy="66" rx="16" ry="22" fill="#f8fafc"/><circle cx="42" cy="40" r="3" fill="#fff"/><circle cx="58" cy="40" r="3" fill="#fff"/><circle cx="43" cy="40" r="1.5" fill="#000"/><circle cx="59" cy="40" r="1.5" fill="#000"/><path d="M46 46l4 5 4-5z" fill="#0f172a"/><path d="M24 56c-8 6-8 16-2 22M76 56c8 6 8 16 2 22" stroke="#1e3a8a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M38 92h10l-5 6zM52 92h10l-5 6z" fill="#fb923c"/>`,
  pukeko: `<ellipse cx="50" cy="56" rx="26" ry="22" fill="#1d4ed8"/><circle cx="70" cy="34" r="12" fill="#1d4ed8"/><circle cx="75" cy="31" r="3" fill="#fff"/><circle cx="76" cy="31" r="1.5" fill="#000"/><path d="M80 36l14 2-14 4z" fill="#dc2626"/><path d="M64 24c4-4 10-2 10 4z" fill="#dc2626"/><path d="M40 76v16M56 76v16M32 92h16M48 92h16" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/><path d="M26 60c-8 0-12 6-10 12" stroke="#0f172a" stroke-width="5" fill="none"/>`,
  kakapo: `<ellipse cx="50" cy="60" rx="32" ry="28" fill="#84cc16"/><circle cx="50" cy="34" r="18" fill="#a3e635"/><circle cx="42" cy="32" r="5" fill="#fff"/><circle cx="58" cy="32" r="5" fill="#fff"/><circle cx="43" cy="32" r="2.5" fill="#000"/><circle cx="59" cy="32" r="2.5" fill="#000"/><path d="M46 40c2 6 6 6 8 0z" fill="#78350f"/><path d="M36 84v8M64 84v8" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>`,
  dolphin: `<path d="M8 60c12-24 40-30 70-20l14 8-10 6c-14 10-40 16-58 10-8-2-12 0-16 6z" fill="#64748b"/><path d="M46 40l8-18 6 18z" fill="#64748b"/><path d="M84 46l14-8-4 14z" fill="#64748b"/><circle cx="82" cy="46" r="2.5" fill="#0f172a"/><path d="M12 62c10 4 20 2 28-4" stroke="#cbd5e1" stroke-width="3" fill="none"/>`,
  morepork: `<ellipse cx="50" cy="58" rx="28" ry="30" fill="#78350f"/><circle cx="38" cy="42" r="12" fill="#fde68a"/><circle cx="62" cy="42" r="12" fill="#fde68a"/><circle cx="38" cy="42" r="6" fill="#0f172a"/><circle cx="62" cy="42" r="6" fill="#0f172a"/><circle cx="40" cy="40" r="2" fill="#fff"/><circle cx="64" cy="40" r="2" fill="#fff"/><path d="M46 52l4 6 4-6z" fill="#f59e0b"/><path d="M26 30l6-12 6 12M62 30l6-12 6 12" fill="#78350f"/><path d="M40 86v6M60 86v6" stroke="#f59e0b" stroke-width="4"/>`,
  gecko: `<path d="M10 70c10-16 26-20 44-16 14 3 26-2 36-12-4 12-14 22-30 24-14 2-24 8-30 16z" fill="#10b981"/><circle cx="84" cy="44" r="10" fill="#10b981"/><circle cx="88" cy="41" r="3" fill="#fde047"/><circle cx="89" cy="41" r="1.5" fill="#000"/><path d="M34 58l-10-12M42 70l-8 14M64 56l-4-14M72 66l8 12" stroke="#10b981" stroke-width="5" stroke-linecap="round"/><g fill="#a7f3d0"><circle cx="40" cy="62" r="2"/><circle cx="54" cy="58" r="2"/><circle cx="66" cy="62" r="2"/></g>`,
};

export function creatureSvg(name: CreatureName, cls = "creature"): Raw {
  return svg("0 0 120 100", CREATURE_ART[name], cls);
}

/* ---------- Explorer avatars ---------- */

const SKINS = ["#fcd5b5", "#e0ac69", "#8d5524", "#f1c27d", "#c68642", "#ffdbac"];

function hatArt(variant: string | undefined, colour: string): string {
  switch (variant) {
    case "sun": return `<ellipse cx="42" cy="28" rx="34" ry="8" fill="#fde68a"/><path d="M20 28c0-16 44-16 44 0z" fill="#fbbf24"/>`;
    case "beanie": return `<path d="M18 30c4-18 44-18 48 0z" fill="#ef4444"/><rect x="16" y="26" width="52" height="8" rx="4" fill="#fecaca"/><circle cx="42" cy="12" r="5" fill="#fecaca"/>`;
    case "ranger": return `<ellipse cx="42" cy="30" rx="36" ry="7" fill="#78350f"/><path d="M22 30c0-18 40-18 40 0z" fill="#92400e"/><rect x="22" y="24" width="40" height="5" fill="#fbbf24"/>`;
    case "crown": return `<path d="M16 32c6-14 14-20 26-22 12 2 20 8 26 22-8-6-16-8-26-8s-18 2-26 8z" fill="#16a34a"/><path d="M42 12v18M30 16l8 12M54 16l-8 12" stroke="#15803d" stroke-width="2"/>`;
    default: return `<path d="M18 32c8-12 40-12 48 0-12-5-36-5-48 0z" fill="${colour}"/>`;
  }
}

/** Six explorers: two kids, a pūkeko, a tuatara, a fantail, a wētā. */
export function avatarSvg(avatar: Avatar, hat?: string, cls = "avatar"): Raw {
  const c = avatar.character % 6;
  const colour = avatar.colour;
  const skin = SKINS[c] ?? SKINS[0];
  let body = "";
  if (c === 0 || c === 1) {
    body = `<circle cx="42" cy="46" r="24" fill="${skin}"/><circle cx="34" cy="44" r="3" fill="#0f172a"/><circle cx="50" cy="44" r="3" fill="#0f172a"/><path d="M34 56c4 4 12 4 16 0" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>${c === 1 ? `<circle cx="34" cy="44" r="6" fill="none" stroke="#0f172a" stroke-width="2"/><circle cx="50" cy="44" r="6" fill="none" stroke="#0f172a" stroke-width="2"/>` : `<path d="M18 40c0-14 10-22 24-22s24 8 24 22c-6-8-14-10-24-10s-18 2-24 10z" fill="#5b3413"/>`}${hatArt(hat, colour)}`;
  } else if (c === 2) {
    body = `<g transform="translate(0 4) scale(0.7)">${CREATURE_ART.pukeko}</g>${hat ? `<g transform="translate(14 -6) scale(0.7)">${hatArt(hat, colour)}</g>` : ""}`;
  } else if (c === 3) {
    body = `<g transform="translate(-4 4) scale(0.7)">${CREATURE_ART.tuatara}</g>${hat ? `<g transform="translate(30 4) scale(0.5)">${hatArt(hat, colour)}</g>` : ""}`;
  } else if (c === 4) {
    body = `<g transform="translate(6 4) scale(0.7)">${CREATURE_ART.fantail}</g>${hat ? `<g transform="translate(22 0) scale(0.55)">${hatArt(hat, colour)}</g>` : ""}`;
  } else {
    body = `<g transform="translate(0 4) scale(0.7)">${CREATURE_ART.weta}</g>${hat ? `<g transform="translate(30 6) scale(0.5)">${hatArt(hat, colour)}</g>` : ""}`;
  }
  return svg("0 0 84 84", body, cls);
}

export interface ExplorerLook {
  hat?: string;
  backpack?: string;
  gear?: string;
  boots?: string;
  companion?: string;
}

/** Full-body explorer used on the map and in the backpack shop. */
export function explorerSvg(avatar: Avatar, look: ExplorerLook = {}, cls = "explorer"): Raw {
  const c = avatar.character % 6;
  const colour = avatar.colour;
  const skin = SKINS[c] ?? SKINS[0];
  const boots = look.boots ?? "#78350f";
  const pack = look.backpack ? `<rect x="14" y="70" width="22" height="34" rx="8" fill="${look.backpack}"/><rect x="18" y="66" width="14" height="8" rx="4" fill="${look.backpack}"/>` : "";
  const gear = look.gear === "torch" ? `<rect x="82" y="88" width="8" height="24" rx="3" fill="#475569"/><path d="M78 88h16l-4-8h-8z" fill="#fde047"/>` : look.gear === "binoculars" ? `<rect x="76" y="86" width="10" height="16" rx="3" fill="#0f172a"/><rect x="88" y="86" width="10" height="16" rx="3" fill="#0f172a"/>` : look.gear === "map" ? `<rect x="76" y="86" width="22" height="18" rx="2" fill="#fef3c7" stroke="#b45309" stroke-width="2"/><path d="M80 100c4-6 8 0 14-6" stroke="#dc2626" stroke-width="2" fill="none"/>` : "";
  const buddy = look.companion ? `<g transform="translate(100 96) scale(0.45)">${CREATURE_ART[look.companion as CreatureName] ?? ""}</g>` : "";
  const isPerson = c === 0 || c === 1;
  const figure = isPerson
    ? `<circle cx="60" cy="40" r="22" fill="${skin}"/><circle cx="52" cy="38" r="3" fill="#0f172a"/><circle cx="68" cy="38" r="3" fill="#0f172a"/><path d="M52 50c4 4 12 4 16 0" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>${c === 0 ? `<path d="M38 34c0-14 8-22 22-22s22 8 22 22c-6-8-12-10-22-10s-16 2-22 10z" fill="#5b3413"/>` : ""}<g transform="translate(18 -6)">${hatArt(look.hat, colour)}</g><rect x="40" y="62" width="40" height="44" rx="10" fill="${colour}"/><rect x="42" y="104" width="14" height="26" rx="5" fill="#1e3a8a"/><rect x="64" y="104" width="14" height="26" rx="5" fill="#1e3a8a"/><path d="M38 128h20v10H38zM62 128h20v10H62z" fill="${boots}"/>`
    : `<g transform="translate(10 30) scale(0.9)">${CREATURE_ART[(["pukeko", "pukeko", "pukeko", "tuatara", "fantail", "weta"] as CreatureName[])[c] as CreatureName]}</g>${look.hat ? `<g transform="translate(30 6) scale(0.7)">${hatArt(look.hat, colour)}</g>` : ""}`;
  return svg("0 0 140 140", `${pack}${figure}${gear}${buddy}`, cls);
}

/* ---------- Regions ---------- */

export function regionSvg(index: number, cls = "region-art"): Raw {
  let body = "";
  if (index === 0) {
    body = `<rect width="200" height="130" fill="#bae6fd"/><circle cx="160" cy="30" r="18" fill="#fde047"/><path d="M0 70c40-16 80 16 120 0s60-10 80 0v60H0z" fill="#38bdf8"/><path d="M0 96c50-20 100 10 200-4v38H0z" fill="#fde68a"/><g transform="translate(30 80) scale(0.4)">${ITEM_ART.shell}</g><g transform="translate(120 84) scale(0.4)">${ITEM_ART.star}</g>`;
  } else if (index === 1) {
    body = `<rect width="200" height="130" fill="#dcfce7"/><rect x="60" y="30" width="16" height="100" fill="#78350f"/><circle cx="68" cy="34" r="34" fill="#16a34a"/><rect x="140" y="50" width="12" height="80" fill="#78350f"/><circle cx="146" cy="52" r="26" fill="#22c55e"/><path d="M0 110c40-10 80 10 120 0s60 10 80 0v20H0z" fill="#15803d"/><path d="M20 100c6-16 16-20 26-16-8 4-12 10-14 18z" fill="#4ade80"/>`;
  } else if (index === 2) {
    body = `<rect width="200" height="130" fill="#e0f2fe"/><path d="M0 120L50 30l40 60 30-50 40 70 40-40v60H0z" fill="#64748b"/><path d="M50 30l14 24H36zM120 40l12 20h-24z" fill="#fff"/><path d="M0 130c60-14 140-14 200 0z" fill="#7dd3fc"/>`;
  } else {
    body = `<rect width="200" height="130" fill="#1e1b4b"/><g fill="#fef3c7"><circle cx="30" cy="20" r="2"/><circle cx="70" cy="40" r="1.5"/><circle cx="110" cy="15" r="2.5"/><circle cx="150" cy="35" r="1.5"/><circle cx="180" cy="18" r="2"/><circle cx="90" cy="60" r="1.5"/><circle cx="50" cy="70" r="2"/><circle cx="170" cy="70" r="2"/></g><circle cx="160" cy="40" r="14" fill="#fde68a"/><circle cx="154" cy="36" r="12" fill="#1e1b4b"/><path d="M0 130L40 80l40 40 40-60 40 50 40-30v50z" fill="#312e81"/>`;
  }
  return svg("0 0 200 130", body, cls);
}

/* ---------- Glyphs ---------- */

export function starSvg(filled: boolean, cls = "star"): Raw {
  return svg("0 0 24 24", `<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" fill="${filled ? "#facc15" : "#e2e8f0"}" stroke="${filled ? "#ca8a04" : "#cbd5e1"}" stroke-width="1.5" stroke-linejoin="round"/>`, cls);
}

export function featherSvg(cls = "feather"): Raw {
  return svg("0 0 40 40", ITEM_ART.feather, cls);
}

export function lockSvg(cls = "lock"): Raw {
  return svg("0 0 24 24", `<rect x="5" y="10" width="14" height="11" rx="2" fill="#64748b"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#64748b" stroke-width="2.5" fill="none"/><circle cx="12" cy="16" r="1.8" fill="#f8fafc"/>`, cls);
}

export function speakerSvg(cls = "speaker"): Raw {
  return svg("0 0 24 24", `<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8c2 2 2 6 0 8M18.5 5.5c3.5 3.5 3.5 9.5 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`, cls);
}

const TRAIL_ICONS: Record<string, string> = {
  shell: ITEM_ART.shell,
  numbers: `<text x="20" y="27" text-anchor="middle" font-size="20" font-weight="900" fill="#0f172a">123</text>`,
  plusminus: `<text x="20" y="31" text-anchor="middle" font-size="26" font-weight="900" fill="#0f172a">±</text>`,
  pair: `<circle cx="13" cy="20" r="9" fill="#f472b6"/><circle cx="27" cy="20" r="9" fill="#38bdf8" opacity="0.9"/>`,
  pattern: `<circle cx="8" cy="20" r="5" fill="#ef4444"/><rect x="16" y="15" width="10" height="10" fill="#3b82f6"/><circle cx="34" cy="20" r="5" fill="#ef4444"/>`,
  ruler: `<rect x="4" y="14" width="32" height="12" rx="2" fill="#fde68a" stroke="#b45309" stroke-width="2"/><path d="M10 14v5M16 14v8M22 14v5M28 14v8" stroke="#b45309" stroke-width="2"/>`,
  clock: `<circle cx="20" cy="20" r="15" fill="#fff" stroke="#0f172a" stroke-width="2.5"/><path d="M20 20V10M20 20l7 4" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>`,
  shapes: `<rect x="4" y="18" width="16" height="16" fill="#3b82f6"/><path d="M28 6l10 16H18z" fill="#f97316"/>`,
  chart: `<rect x="6" y="20" width="7" height="14" fill="#22c55e"/><rect x="16" y="10" width="7" height="24" fill="#3b82f6"/><rect x="26" y="16" width="7" height="18" fill="#f97316"/>`,
  dice: `<rect x="6" y="6" width="28" height="28" rx="6" fill="#fff" stroke="#0f172a" stroke-width="2.5"/><circle cx="14" cy="14" r="3" fill="#0f172a"/><circle cx="26" cy="26" r="3" fill="#0f172a"/><circle cx="20" cy="20" r="3" fill="#0f172a"/>`,
  grid: `<g fill="#0ea5e9">${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${6 + c * 10}" y="${6 + r * 10}" width="8" height="8" rx="1.5"/>`)).join("")}</g>`,
  hop: `<path d="M4 32c6-20 10-20 16 0s10-20 16 0" stroke="#f97316" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="4" cy="32" r="3" fill="#0f172a"/><circle cx="20" cy="32" r="3" fill="#0f172a"/><circle cx="36" cy="32" r="3" fill="#0f172a"/>`,
  blocks: `<rect x="4" y="6" width="8" height="28" fill="#f59e0b"/><rect x="16" y="6" width="8" height="28" fill="#f59e0b"/><rect x="28" y="26" width="8" height="8" fill="#ef4444"/><rect x="28" y="16" width="8" height="8" fill="#ef4444"/>`,
  bolt: `<path d="M22 4L8 24h10l-2 12 14-20H20z" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>`,
  pie: `<circle cx="20" cy="20" r="15" fill="#e2e8f0"/><path d="M20 20V5a15 15 0 0115 15z" fill="#f472b6"/><path d="M20 5v15h15" stroke="#0f172a" stroke-width="1.5" fill="none"/>`,
  puzzle: `<text x="20" y="31" text-anchor="middle" font-size="30" font-weight="900" fill="#f97316">?</text>`,
  times: `<text x="20" y="31" text-anchor="middle" font-size="32" font-weight="900" fill="#7c3aed">×</text>`,
  divide: `<text x="20" y="31" text-anchor="middle" font-size="32" font-weight="900" fill="#0ea5e9">÷</text>`,
  target: `<circle cx="20" cy="20" r="15" fill="#fff" stroke="#ef4444" stroke-width="3"/><circle cx="20" cy="20" r="9" fill="none" stroke="#ef4444" stroke-width="3"/><circle cx="20" cy="20" r="3" fill="#ef4444"/>`,
};

export function trailIconSvg(icon: string, cls = "trail-icon"): Raw {
  return svg("0 0 40 40", TRAIL_ICONS[icon] ?? TRAIL_ICONS.puzzle ?? "", cls);
}

export function logoSvg(cls = "logo"): Raw {
  return svg("0 0 120 120", `<circle cx="60" cy="60" r="56" fill="#16a34a"/><circle cx="60" cy="60" r="48" fill="#4ade80"/><g transform="translate(14 22) scale(0.75)">${CREATURE_ART.kiwi}</g><text x="60" y="108" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">1 2 3</text>`, cls);
}

/* ---------- Shapes (used by the visual renderer) ---------- */

export function shapeSvg(shape: ShapeName, colour = "#3b82f6", symmetryLine?: "vertical" | "horizontal" | "diagonal" | "none", cls = "shape"): Raw {
  const stroke = `stroke="#0f172a" stroke-width="3" stroke-linejoin="round"`;
  let body = "";
  switch (shape) {
    case "circle": body = `<circle cx="50" cy="50" r="40" fill="${colour}" ${stroke}/>`; break;
    case "oval": body = `<ellipse cx="50" cy="50" rx="44" ry="28" fill="${colour}" ${stroke}/>`; break;
    case "triangle": body = `<path d="M50 10L92 88H8z" fill="${colour}" ${stroke}/>`; break;
    case "square": body = `<rect x="12" y="12" width="76" height="76" fill="${colour}" ${stroke}/>`; break;
    case "rectangle": body = `<rect x="6" y="26" width="88" height="48" fill="${colour}" ${stroke}/>`; break;
    case "rhombus": body = `<path d="M50 8L92 50 50 92 8 50z" fill="${colour}" ${stroke}/>`; break;
    case "trapezium": body = `<path d="M26 22h48l20 56H6z" fill="${colour}" ${stroke}/>`; break;
    case "pentagon": body = `<path d="M50 8l40 29-15 47H25L10 37z" fill="${colour}" ${stroke}/>`; break;
    case "hexagon": body = `<path d="M28 12h44l22 38-22 38H28L6 50z" fill="${colour}" ${stroke}/>`; break;
    case "octagon": body = `<path d="M32 8h36l24 24v36L68 92H32L8 68V32z" fill="${colour}" ${stroke}/>`; break;
    case "cube": body = `<path d="M20 34l24-16h36v40L56 74H20z" fill="${colour}" ${stroke}/><path d="M20 34h36v40M56 34l24-16" fill="none" ${stroke}/>`; break;
    case "cuboid": body = `<path d="M10 40l20-14h60v34L70 74H10z" fill="${colour}" ${stroke}/><path d="M10 40h60v34M70 40l20-14" fill="none" ${stroke}/>`; break;
    case "sphere": body = `<circle cx="50" cy="50" r="40" fill="${colour}" ${stroke}/><ellipse cx="38" cy="36" rx="12" ry="8" fill="#fff" opacity="0.5"/>`; break;
    case "cylinder": body = `<path d="M20 22v56c0 8 60 8 60 0V22" fill="${colour}" ${stroke}/><ellipse cx="50" cy="22" rx="30" ry="8" fill="${colour}" ${stroke}/>`; break;
    case "cone": body = `<path d="M50 8L20 78c0 8 60 8 60 0z" fill="${colour}" ${stroke}/><ellipse cx="50" cy="78" rx="30" ry="8" fill="${colour}" ${stroke}/>`; break;
    case "pyramid": body = `<path d="M50 8L90 70 10 70z" fill="${colour}" ${stroke}/><path d="M50 8L70 86 10 70" fill="none" ${stroke}/><path d="M70 86L90 70" fill="none" ${stroke}/>`; break;
  }
  let line = "";
  if (symmetryLine === "vertical") line = `<path d="M50 2v96" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 5"/>`;
  else if (symmetryLine === "horizontal") line = `<path d="M2 50h96" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 5"/>`;
  else if (symmetryLine === "diagonal") line = `<path d="M6 94L94 6" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 5"/>`;
  return svg("0 0 100 100", body + line, cls);
}
