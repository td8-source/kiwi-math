/** Minimal safe HTML templating: interpolations are escaped unless wrapped in raw(). */
export class Raw {
  constructor(public readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export function raw(value: string): Raw {
  return new Raw(value);
}

export function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

type Piece = string | number | boolean | null | undefined | Raw | Piece[];

function render(piece: Piece): string {
  if (piece === null || piece === undefined || piece === false) return "";
  if (piece instanceof Raw) return piece.value;
  if (Array.isArray(piece)) return piece.map(render).join("");
  if (piece === true) return "";
  return esc(piece);
}

export function html(strings: TemplateStringsArray, ...values: Piece[]): Raw {
  let out = "";
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += render(values[i]);
  });
  return new Raw(out);
}

/** Attach one delegated click handler; elements declare data-action="name" (and optional data-* args). */
export function delegate(root: HTMLElement, handlers: Record<string, (el: HTMLElement, ev: Event) => void>): void {
  root.addEventListener("click", (ev) => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target || !root.contains(target)) return;
    const action = target.dataset.action ?? "";
    const handler = handlers[action];
    if (handler) {
      ev.preventDefault();
      handler(target, ev);
    }
  });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}
