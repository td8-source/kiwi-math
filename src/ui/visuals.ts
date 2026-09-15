import type { CreatureName, ItemKind, PatternToken, ShapeName, Visual } from "../curriculum/types";
import { html, raw, type Raw } from "./html";
import { creatureSvg, itemSvg, shapeSvg } from "./art";

const DICE: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};
const SCATTER: [number, number][] = [[20, 30], [70, 20], [45, 60], [80, 70], [25, 80], [60, 40], [15, 55], [85, 45], [50, 15], [40, 85]];

function dotsSvg(count: number, pattern: "dice" | "scatter" | "line"): Raw {
  if (pattern === "dice") {
    const faces = count <= 6 ? [count] : [5, count - 5];
    return raw(`<div class="dice-row">${faces.map((n) => `<svg viewBox="0 0 100 100" class="dice"><rect x="4" y="4" width="92" height="92" rx="16" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>${(DICE[n] ?? []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#0f172a"/>`).join("")}</svg>`).join("")}</div>`);
  }
  if (pattern === "line") return raw(`<svg viewBox="0 0 ${count * 22} 24" class="dots-line">${Array.from({ length: count }, (_, i) => `<circle cx="${i * 22 + 11}" cy="12" r="9" fill="#0ea5e9"/>`).join("")}</svg>`);
  return raw(`<svg viewBox="0 0 100 100" class="dots-scatter">${SCATTER.slice(0, count).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#0ea5e9"/>`).join("")}</svg>`);
}

function tenFrame(count: number, second = 0, frames = 1): Raw {
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const cells: string[] = [];
    for (let i = 0; i < 10; i++) {
      const idx = f * 10 + i;
      cells.push(`<div class="tf-cell ${idx < count ? "filled" : idx < count + second ? "filled second" : ""}"></div>`);
    }
    out.push(`<div class="tenframe">${cells.join("")}</div>`);
  }
  return raw(`<div class="tenframes">${out.join("")}</div>`);
}

function objectsGrid(v: { item: ItemKind; count: number; crossed?: number }): Raw {
  const perRow = v.count <= 10 ? 5 : 10;
  const cells = Array.from({ length: v.count }, (_, i) => `<div class="obj ${v.crossed !== undefined && i >= v.count - v.crossed ? "crossed" : ""}">${itemSvg(v.item).value}</div>`);
  return raw(`<div class="objects cols-${perRow}">${cells.join("")}</div>`);
}

function numberLine(v: Extract<Visual, { kind: "numberline" }>): Raw {
  const step = v.step ?? 1;
  const ticks: number[] = [];
  for (let n = v.from; n <= v.to; n += step) ticks.push(n);
  const w = 600;
  const pad = 30;
  const x = (n: number) => pad + ((n - v.from) / (v.to - v.from)) * (w - pad * 2);
  const every = ticks.length > 12 ? Math.ceil(ticks.length / 12) : 1;
  return raw(`<svg viewBox="0 0 ${w} 80" class="numberline"><line x1="${pad - 10}" y1="40" x2="${w - pad + 10}" y2="40" stroke="#0f172a" stroke-width="3"/>${ticks.map((n, i) => { const hidden = v.hidden?.includes(n); const label = hidden ? "?" : i % every === 0 ? String(n) : ""; return `<line x1="${x(n)}" y1="32" x2="${x(n)}" y2="48" stroke="#0f172a" stroke-width="2"/><text x="${x(n)}" y="70" text-anchor="middle" font-size="18" font-weight="700" fill="${hidden ? "#f97316" : "#0f172a"}">${label}</text>`; }).join("")}${v.mark !== undefined ? `<circle cx="${x(v.mark)}" cy="40" r="9" fill="#f97316" stroke="#fff" stroke-width="3"/>` : ""}</svg>`);
}

function blocks(v: Extract<Visual, { kind: "blocks" }>): Raw {
  const h = Array.from({ length: v.hundreds ?? 0 }, () => `<div class="pv-hundred"></div>`).join("");
  const t = Array.from({ length: v.tens }, () => `<div class="pv-ten"></div>`).join("");
  const o = Array.from({ length: v.ones }, () => `<div class="pv-one"></div>`).join("");
  return raw(`<div class="pv">${h ? `<div class="pv-group">${h}</div>` : ""}${t ? `<div class="pv-group">${t}</div>` : ""}${o ? `<div class="pv-group pv-ones">${o}</div>` : ""}</div>`);
}

function fraction(v: Extract<Visual, { kind: "fraction" }>, small: boolean): Raw {
  if (v.shape === "bar") return raw(`<div class="frac-bar ${small ? "small" : ""}">${Array.from({ length: v.parts }, (_, i) => `<div class="frac-part ${i < v.shaded ? "shaded" : ""}"></div>`).join("")}</div>`);
  const r = 45;
  const slices = Array.from({ length: v.parts }, (_, i) => {
    const a0 = (i / v.parts) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / v.parts) * Math.PI * 2 - Math.PI / 2;
    const large = 1 / v.parts > 0.5 ? 1 : 0;
    const fill = i < v.shaded ? "#f472b6" : "#f1f5f9";
    return v.parts === 1 ? `<circle cx="50" cy="50" r="${r}" fill="${fill}" stroke="#0f172a" stroke-width="2"/>` : `<path d="M50 50L${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)}A${r} ${r} 0 ${large} 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)}Z" fill="${fill}" stroke="#0f172a" stroke-width="2"/>`;
  });
  return raw(`<svg viewBox="0 0 100 100" class="frac-circle ${small ? "small" : ""}">${slices.join("")}</svg>`);
}

function arrayGrid(v: Extract<Visual, { kind: "array" }>): Raw {
  const cell = v.item ? itemSvg(v.item, "item small").value : `<span class="dot"></span>`;
  const cols = Math.max(v.rows, v.cols);
  return raw(`<div class="array" style="grid-template-columns: repeat(${cols}, 1fr)">${Array.from({ length: v.rows * v.cols }, () => `<div class="array-cell">${cell}</div>`).join("")}</div>`);
}

function sequence(values: readonly (number | null)[]): Raw {
  return raw(`<div class="sequence">${values.map((n) => (n === null ? `<div class="seq-box missing">?</div>` : `<div class="seq-box">${n}</div>`)).join("")}</div>`);
}

function hundredChart(v: Extract<Visual, { kind: "hundredchart" }>): Raw {
  const size = v.size ?? 3;
  const cells: string[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const n = v.start + r * 10 + c;
    cells.push(`<div class="hc-cell ${v.hidden.includes(n) ? "missing" : ""}">${v.hidden.includes(n) ? "?" : n}</div>`);
  }
  return raw(`<div class="hundredchart" style="grid-template-columns: repeat(${size}, 1fr)">${cells.join("")}</div>`);
}

function groups(v: Extract<Visual, { kind: "groups" }>): Raw {
  const parts = v.groups.map((n) => `<div class="group"><div class="objects cols-5">${Array.from({ length: n }, () => `<div class="obj">${itemSvg(v.item).value}</div>`).join("")}</div></div>`);
  return raw(`<div class="groups">${parts.join(`<div class="group-op">${v.operator ?? "+"}</div>`)}</div>`);
}

/* ---------- Measurement ---------- */

function clock(v: Extract<Visual, { kind: "clock" }>, small: boolean): Raw {
  const hourAngle = ((v.hour % 12) + v.minute / 60) * 30;
  const minuteAngle = v.minute * 6;
  const hand = (angle: number, len: number, w: number) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return `<line x1="50" y1="50" x2="${50 + len * Math.cos(a)}" y2="${50 + len * Math.sin(a)}" stroke="#0f172a" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = ((n * 30 - 90) * Math.PI) / 180;
    return `<text x="${50 + 36 * Math.cos(a)}" y="${50 + 36 * Math.sin(a) + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">${n}</text>`;
  }).join("");
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = ((i * 6 - 90) * Math.PI) / 180;
    const r1 = i % 5 === 0 ? 42 : 44;
    return `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}" x2="${50 + 46 * Math.cos(a)}" y2="${50 + 46 * Math.sin(a)}" stroke="#64748b" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
  }).join("");
  return raw(`<svg viewBox="0 0 100 100" class="clock ${small ? "small" : ""}"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#0f172a" stroke-width="3"/>${ticks}${numbers}${hand(hourAngle, 22, 5)}${hand(minuteAngle, 32, 3)}<circle cx="50" cy="50" r="3" fill="#0f172a"/></svg>`);
}

const COIN_LOOK: Record<number, { label: string; fill: string; size: number }> = {
  10: { label: "10c", fill: "#b45309", size: 48 },
  20: { label: "20c", fill: "#b45309", size: 54 },
  50: { label: "50c", fill: "#b45309", size: 62 },
  100: { label: "$1", fill: "#ca8a04", size: 52 },
  200: { label: "$2", fill: "#ca8a04", size: 58 },
};

function coins(v: Extract<Visual, { kind: "coins" }>): Raw {
  return raw(`<div class="coins">${v.coins.map((c) => { const l = COIN_LOOK[c] ?? COIN_LOOK[10]!; return `<svg viewBox="0 0 70 70" class="coin" style="width:${l.size}px;height:${l.size}px"><circle cx="35" cy="35" r="32" fill="${l.fill}" stroke="#78350f" stroke-width="3"/><circle cx="35" cy="35" r="26" fill="none" stroke="#fde68a" stroke-width="1.5"/><text x="35" y="42" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">${l.label}</text></svg>`; }).join("")}</div>`);
}

function lengths(v: Extract<Visual, { kind: "lengths" }>): Raw {
  return raw(`<div class="lengths">${v.bars.map((b) => `<div class="length-row"><span class="length-label">${b.label}</span><div class="length-bar" style="width:${b.length * 10}%; background:${b.colour ?? "#92400e"}"></div></div>`).join("")}</div>`);
}

function ruler(v: Extract<Visual, { kind: "ruler" }>): Raw {
  const max = v.max ?? 12;
  const w = 600;
  const pad = 20;
  const unit = (w - pad * 2) / max;
  const isLeaf = v.unit === "leaf";
  const ticks = Array.from({ length: max + 1 }, (_, i) => `<line x1="${pad + i * unit}" y1="60" x2="${pad + i * unit}" y2="${i % 5 === 0 ? 76 : 70}" stroke="#0f172a" stroke-width="2"/><text x="${pad + i * unit}" y="94" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">${isLeaf ? "" : i}</text>`).join("");
  const leaves = isLeaf ? Array.from({ length: max }, (_, i) => `<g transform="translate(${pad + i * unit + 4} 62) scale(${(unit - 8) / 40})">${itemSvg("leaf").value.replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`).join("") : "";
  const obj = `<g transform="translate(${pad} 12)"><path d="M0 22C${v.length * unit * 0.3} 0 ${v.length * unit * 0.7} 0 ${v.length * unit} 22C${v.length * unit * 0.7} 40 ${v.length * unit * 0.3} 40 0 22z" fill="#a78bfa" stroke="#6d28d9" stroke-width="2"/><path d="M0 22H${v.length * unit}" stroke="#6d28d9" stroke-width="2"/></g>`;
  return raw(`<svg viewBox="0 0 ${w} 110" class="ruler">${obj}<rect x="${pad - 10}" y="60" width="${w - pad * 2 + 20}" height="${isLeaf ? 46 : 40}" fill="#fde68a" stroke="#b45309" stroke-width="2"/>${ticks}${leaves}${isLeaf ? "" : `<text x="${w - pad + 4}" y="94" font-size="14" fill="#0f172a">${v.unit ?? "cm"}</text>`}</svg>`);
}

function balance(v: Extract<Visual, { kind: "balance" }>): Raw {
  const tilt = v.tilt === "left" ? 8 : v.tilt === "right" ? -8 : 0;
  const pan = (x: number, item: ItemKind, count: number) => `<g transform="translate(${x} 0)"><path d="M-40 0h80" stroke="#475569" stroke-width="4"/><path d="M-40 0L-30 40h60L40 0" fill="none" stroke="#475569" stroke-width="3"/><rect x="-32" y="40" width="64" height="6" fill="#475569"/>${Array.from({ length: count }, (_, i) => `<g transform="translate(${-22 + (i % 3) * 22} ${14 - Math.floor(i / 3) * 18}) scale(0.5)">${itemSvg(item).value.replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`).join("")}</g>`;
  return raw(`<svg viewBox="0 0 320 170" class="balance"><path d="M160 150L140 165h40z" fill="#475569"/><rect x="156" y="70" width="8" height="82" fill="#475569"/><g transform="rotate(${tilt} 160 72)"><rect x="40" y="68" width="240" height="8" rx="4" fill="#64748b"/>${pan(60, v.left.item, v.left.count)}${pan(260, v.right.item, v.right.count)}</g></svg>`);
}

function containers(levels: readonly number[]): Raw {
  return raw(`<div class="containers">${levels.map((l, i) => `<div class="container-wrap"><svg viewBox="0 0 80 110" class="container"><rect x="10" y="10" width="60" height="90" rx="6" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/><rect x="13" y="${100 - 87 * l}" width="54" height="${87 * l}" rx="4" fill="#38bdf8"/></svg><span class="container-label">${"ABC"[i]}</span></div>`).join("")}</div>`);
}

function areaGrid(v: Extract<Visual, { kind: "areagrid" }>): Raw {
  const set = new Set(v.shaded.map(([r, c]) => `${r},${c}`));
  const cells: string[] = [];
  for (let r = 0; r < v.rows; r++) for (let c = 0; c < v.cols; c++) cells.push(`<div class="area-cell ${set.has(`${r},${c}`) ? "shaded" : ""}"></div>`);
  return raw(`<div class="areagrid" style="grid-template-columns: repeat(${v.cols}, 44px)">${cells.join("")}</div>`);
}

function thermometer(v: Extract<Visual, { kind: "thermometer" }>): Raw {
  const max = v.max ?? 40;
  const h = 200;
  const y = (t: number) => 20 + (h - 40) * (1 - t / max);
  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => { const t = i * 5; return `<line x1="40" y1="${y(t)}" x2="52" y2="${y(t)}" stroke="#0f172a" stroke-width="2"/><text x="58" y="${y(t) + 5}" font-size="13" font-weight="700" fill="#0f172a">${t}°C</text>`; }).join("");
  return raw(`<svg viewBox="0 0 120 ${h + 20}" class="thermometer"><rect x="24" y="10" width="16" height="${h}" rx="8" fill="#f1f5f9" stroke="#0f172a" stroke-width="2"/><rect x="28" y="${y(v.value)}" width="8" height="${y(0) - y(v.value) + 10}" fill="#dc2626"/><circle cx="32" cy="${h + 4}" r="12" fill="#dc2626" stroke="#0f172a" stroke-width="2"/>${ticks}</svg>`);
}

function calendar(v: Extract<Visual, { kind: "calendar" }>): Raw {
  const heads = ["M", "T", "W", "T", "F", "S", "S"].map((d) => `<div class="cal-head">${d}</div>`).join("");
  const blanks = Array.from({ length: v.startDay }, () => `<div class="cal-cell blank"></div>`).join("");
  const days = Array.from({ length: v.days }, (_, i) => `<div class="cal-cell ${v.mark === i + 1 ? "mark" : ""}">${i + 1}</div>`).join("");
  return raw(`<div class="calendar"><div class="cal-title">${v.month}</div><div class="cal-grid">${heads}${blanks}${days}</div></div>`);
}

/* ---------- Geometry ---------- */

function shapesRow(shapes: readonly { shape: ShapeName; colour?: string }[]): Raw {
  return raw(`<div class="shapes-row">${shapes.map((s) => shapeSvg(s.shape, s.colour).value).join("")}</div>`);
}

function grid(v: Extract<Visual, { kind: "grid" }>): Raw {
  const cell = 52;
  const w = v.cols * cell + 40;
  const h = v.rows * cell + 40;
  const lines: string[] = [];
  for (let c = 0; c <= v.cols; c++) lines.push(`<line x1="${30 + c * cell}" y1="10" x2="${30 + c * cell}" y2="${10 + v.rows * cell}" stroke="#94a3b8" stroke-width="1.5"/>`);
  for (let r = 0; r <= v.rows; r++) lines.push(`<line x1="30" y1="${10 + r * cell}" x2="${30 + v.cols * cell}" y2="${10 + r * cell}" stroke="#94a3b8" stroke-width="1.5"/>`);
  const xLabels = Array.from({ length: v.cols }, (_, c) => `<text x="${30 + c * cell + (v.labels === "letters" ? cell / 2 : 0)}" y="${h - 6}" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">${v.labels === "letters" ? "ABCDEF"[c] : c}</text>`).join("");
  const yLabels = Array.from({ length: v.rows }, (_, r) => `<text x="14" y="${10 + (v.rows - r) * cell - (v.labels === "letters" ? cell / 2 - 6 : -6)}" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">${v.labels === "letters" ? r + 1 : r}</text>`).join("");
  const marks = v.marks.map((m) => { const cx = 30 + m.col * cell + (v.labels === "letters" ? cell / 2 : 0); const cy = 10 + (v.rows - m.row) * cell - (v.labels === "letters" ? cell / 2 : 0); return `<g transform="translate(${cx - 22} ${cy - 18}) scale(0.36)">${creatureSvg(m.creature).value.replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`; }).join("");
  return raw(`<svg viewBox="0 0 ${w} ${h}" class="grid-map">${lines}${xLabels}${yLabels}${marks}</svg>`);
}

function angle(v: Extract<Visual, { kind: "angle" }>): Raw {
  const a = (v.degrees * Math.PI) / 180;
  const x = 20 + 90 * Math.cos(a);
  const y = 100 - 90 * Math.sin(a);
  const ax = 20 + 30 * Math.cos(a);
  const ay = 100 - 30 * Math.sin(a);
  const large = v.degrees > 180 ? 1 : 0;
  return raw(`<svg viewBox="0 0 140 120" class="angle"><path d="M50 100A30 30 0 ${large} 0 ${ax} ${ay}" fill="#fde68a" stroke="none"/><path d="M50 100A30 30 0 ${large} 0 ${ax} ${ay}" fill="none" stroke="#f59e0b" stroke-width="3"/><line x1="20" y1="100" x2="120" y2="100" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/><line x1="20" y1="100" x2="${x}" y2="${y}" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/></svg>`);
}

function position(v: Extract<Visual, { kind: "position" }>): Raw {
  const c = creatureSvg(v.creature).value.replace(/<svg[^>]*>|<\/svg>/g, "");
  const tree = `<rect x="140" y="110" width="20" height="70" fill="#78350f"/><circle cx="150" cy="96" r="44" fill="#16a34a"/>`;
  const nest = `<ellipse cx="150" cy="150" rx="46" ry="16" fill="#a16207"/><ellipse cx="150" cy="144" rx="34" ry="10" fill="#fde68a"/>`;
  const rock = `<ellipse cx="150" cy="160" rx="50" ry="22" fill="#94a3b8"/>`;
  const scene = v.place === "inside" ? nest : v.place === "on" ? rock : tree;
  const pos: Record<string, [number, number]> = { above: [116, 0], below: [116, 150], left: [20, 110], right: [220, 110], inside: [122, 96], on: [120, 96] };
  const [px, py] = pos[v.place] ?? [116, 150];
  return raw(`<svg viewBox="0 0 300 200" class="position"><rect width="300" height="200" fill="#e0f2fe"/><rect y="180" width="300" height="20" fill="#86efac"/>${scene}<g transform="translate(${px} ${py}) scale(0.55)">${c}</g></svg>`);
}

function turn(v: Extract<Visual, { kind: "turn" }>): Raw {
  const arrow = (deg: number, colour: string) => `<g transform="rotate(${deg} 50 50)"><path d="M50 12l14 20h-8v30h-12V32h-8z" fill="${colour}" stroke="#0f172a" stroke-width="2"/></g>`;
  return raw(`<div class="turn"><svg viewBox="0 0 100 100" class="turn-face"><circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>${arrow(v.from, "#94a3b8")}</svg><div class="turn-arrow">${v.direction === "clockwise" ? "↻" : "↺"}</div><svg viewBox="0 0 100 100" class="turn-face"><circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>${arrow(v.to, "#f97316")}</svg></div>`);
}

function transform(v: Extract<Visual, { kind: "transform" }>): Raw {
  const shapePath = v.shape === "L" ? `<path d="M20 10h20v40h20v20H20z"/>` : v.shape === "arrow" ? `<path d="M10 40h40V20l30 30-30 30V60H10z"/>` : `<path d="M20 10h10v80H20zM30 10h40l-12 16 12 16H30z"/>`;
  const t = v.type === "reflection" ? "scale(-1 1) translate(-100 0)" : v.type === "rotation" ? "rotate(90 50 50)" : "translate(0 10)";
  return raw(`<div class="transform"><svg viewBox="0 0 100 100" class="tf-shape"><g fill="#94a3b8" stroke="#0f172a" stroke-width="2">${shapePath}</g></svg><div class="turn-arrow">→</div><svg viewBox="0 0 100 100" class="tf-shape"><g fill="#f97316" stroke="#0f172a" stroke-width="2" transform="${t}">${shapePath}</g></svg></div>`);
}

function patternToken(t: PatternToken, missing = false): string {
  if (missing) return `<div class="pat-token missing">?</div>`;
  const s = t.shape === "circle" ? `<circle cx="20" cy="20" r="16" fill="${t.colour}"/>` : t.shape === "square" ? `<rect x="5" y="5" width="30" height="30" rx="3" fill="${t.colour}"/>` : t.shape === "triangle" ? `<path d="M20 4l16 30H4z" fill="${t.colour}"/>` : t.shape === "star" ? `<path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="${t.colour}"/>` : `<path d="M20 36C6 26 2 16 8 9c4-4 10-3 12 2 2-5 8-6 12-2 6 7 2 17-12 27z" fill="${t.colour}"/>`;
  return `<div class="pat-token"><svg viewBox="0 0 40 40">${s}</svg></div>`;
}

function pattern(v: Extract<Visual, { kind: "pattern" }>): Raw {
  return raw(`<div class="pattern">${v.tokens.map((t, i) => patternToken(t, v.missing === i)).join("")}</div>`);
}

/* ---------- Statistics & probability ---------- */

function pictograph(v: Extract<Visual, { kind: "pictograph" }>): Raw {
  return raw(`<div class="pictograph">${v.rows.map((r) => `<div class="picto-row"><span class="picto-label">${r.label}</span><span class="picto-icons">${Array.from({ length: r.count }, () => itemSvg(v.item, "item small").value).join("")}</span></div>`).join("")}${v.scale && v.scale > 1 ? `<div class="picto-key">${itemSvg(v.item, "item small").value} = ${v.scale}</div>` : ""}</div>`);
}

function barchart(v: Extract<Visual, { kind: "barchart" }>): Raw {
  const step = v.step ?? 1;
  const max = Math.max(...v.bars.map((b) => b.value));
  const top = Math.ceil(max / step) * step + step;
  const w = 460;
  const h = 240;
  const left = 50;
  const bottom = 200;
  const bw = (w - left - 20) / v.bars.length;
  const y = (val: number) => bottom - (val / top) * (bottom - 20);
  const gridLines: string[] = [];
  for (let t = 0; t <= top; t += step) gridLines.push(`<line x1="${left}" y1="${y(t)}" x2="${w - 10}" y2="${y(t)}" stroke="#e2e8f0"/><text x="${left - 8}" y="${y(t) + 5}" text-anchor="end" font-size="14" font-weight="700" fill="#334155">${t}</text>`);
  const colours = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899"];
  const bars = v.bars.map((b, i) => `<rect x="${left + i * bw + bw * 0.15}" y="${y(b.value)}" width="${bw * 0.7}" height="${bottom - y(b.value)}" rx="4" fill="${b.colour ?? colours[i % colours.length]}"/><text x="${left + i * bw + bw / 2}" y="${bottom + 22}" text-anchor="middle" font-size="15" font-weight="800" fill="#0f172a">${b.label}</text>`).join("");
  return raw(`<svg viewBox="0 0 ${w} ${h}" class="barchart">${gridLines.join("")}<line x1="${left}" y1="20" x2="${left}" y2="${bottom}" stroke="#0f172a" stroke-width="2"/><line x1="${left}" y1="${bottom}" x2="${w - 10}" y2="${bottom}" stroke="#0f172a" stroke-width="2"/>${bars}</svg>`);
}

function tally(v: Extract<Visual, { kind: "tally" }>): Raw {
  const marks = (n: number) => {
    const groups = Math.floor(n / 5);
    const rest = n % 5;
    let out = "";
    for (let g = 0; g < groups; g++) out += `<span class="tally-group"><span class="tally-bars">||||</span><span class="tally-cross"></span></span>`;
    if (rest) out += `<span class="tally-group"><span class="tally-bars">${"|".repeat(rest)}</span></span>`;
    return out;
  };
  return raw(`<table class="tally"><tbody>${v.rows.map((r) => `<tr><td class="tally-label">${r.label}</td><td>${marks(r.count)}</td></tr>`).join("")}</tbody></table>`);
}

function spinner(segments: readonly string[]): Raw {
  const n = segments.length;
  const r = 46;
  const slices = segments.map((colour, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    return `<path d="M50 50L${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)}A${r} ${r} 0 ${1 / n > 0.5 ? 1 : 0} 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)}Z" fill="${colour}" stroke="#fff" stroke-width="2"/>`;
  });
  return raw(`<svg viewBox="0 0 100 100" class="spinner">${slices.join("")}<path d="M50 14l6 36-6 6-6-6z" fill="#0f172a"/><circle cx="50" cy="50" r="5" fill="#fff" stroke="#0f172a" stroke-width="2"/></svg>`);
}

function bag(v: Extract<Visual, { kind: "bag" }>): Raw {
  const berries = v.contents.flatMap((c) => Array.from({ length: c.count }, () => c.colour));
  return raw(`<div class="bag"><div class="bag-body">${berries.map((col) => `<span class="berry" style="background:${colourFor(col)}"></span>`).join("")}</div></div>`);
}

function colourFor(name: string): string {
  return ({ red: "#ef4444", blue: "#3b82f6", green: "#22c55e", yellow: "#facc15", purple: "#a855f7", orange: "#f97316" } as Record<string, string>)[name] ?? name;
}

export function renderVisual(v: Visual | undefined, small = false): Raw {
  if (!v) return raw("");
  switch (v.kind) {
    case "objects": return objectsGrid(v);
    case "groups": return groups(v);
    case "tenframe": return tenFrame(v.count, v.secondColour ?? 0, v.frames ?? Math.max(1, Math.ceil((v.count + (v.secondColour ?? 0)) / 10)));
    case "dots": return dotsSvg(v.count, v.pattern);
    case "numberline": return numberLine(v);
    case "blocks": return blocks(v);
    case "expression": return html`<div class="expression">${v.text}</div>`;
    case "fraction": return fraction(v, small);
    case "array": return arrayGrid(v);
    case "sequence": return sequence(v.values);
    case "hundredchart": return hundredChart(v);
    case "text": return html`<div class="bigtext">${v.text}</div>`;
    case "clock": return clock(v, small);
    case "coins": return coins(v);
    case "lengths": return lengths(v);
    case "ruler": return ruler(v);
    case "balance": return balance(v);
    case "containers": return containers(v.levels);
    case "areagrid": return areaGrid(v);
    case "thermometer": return thermometer(v);
    case "calendar": return calendar(v);
    case "shape": return shapeSvg(v.shape, v.colour ?? "#3b82f6", v.symmetryLine, small ? "shape small" : "shape");
    case "shapes": return shapesRow(v.shapes);
    case "grid": return grid(v);
    case "angle": return angle(v);
    case "position": return position(v);
    case "turn": return turn(v);
    case "transform": return transform(v);
    case "pattern": return pattern(v);
    case "pictograph": return pictograph(v);
    case "barchart": return barchart(v);
    case "tally": return tally(v);
    case "spinner": return spinner(v.segments);
    case "bag": return bag(v);
    case "creature": return creatureSvg(v.creature, "creature big");
    default: return raw("");
  }
}

export { creatureSvg, itemSvg };
export type { CreatureName };
