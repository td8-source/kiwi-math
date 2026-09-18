/**
 * Bug reports: what a parent types, plus the context from diagnostics.ts.
 *
 * A report goes to the project's Supabase table when cloud sync is configured, and a
 * scheduled GitHub Action turns new rows into issues. When Supabase is not set up, or
 * the insert fails, the same report can be opened as a prefilled GitHub issue instead,
 * so the dialog never dead-ends.
 */
import type { AppState } from "./state";
import type { Route } from "./context";
import { collectDiagnostics, type Diagnostics } from "./diagnostics";
import { sendReport } from "./cloud";

export const SUMMARY_MAX = 120;
export const DETAILS_MAX = 2000;
/** One report a minute is plenty, and it keeps a stuck button from flooding the table. */
export const REPORT_GAP_MS = 60_000;

const REPO = ((import.meta.env.VITE_GITHUB_REPO as string | undefined) ?? "td8-source/kiwi-math").trim();
const THROTTLE_KEY = "nature-maths-last-report";

export interface Report {
  summary: string;
  details: string;
  diagnostics: Diagnostics;
}

export function buildReport(state: AppState, route: Route, summary: string, details: string): Report {
  return {
    summary: summary.trim().replace(/\s+/g, " ").slice(0, SUMMARY_MAX),
    details: details.trim().slice(0, DETAILS_MAX),
    diagnostics: collectDiagnostics(state, route),
  };
}

/** The GitHub issue body. Also stored with the row, so both routes read the same. */
export function reportBody(report: Report): string {
  const d = report.diagnostics;
  const lines = [
    "### What happened",
    "",
    report.details || "_(no description given)_",
    "",
    "### Where",
    "",
    `- Screen: \`${d.screen}\``,
    `- Steps before: ${d.recentScreens.length ? d.recentScreens.map((s) => `\`${s}\``).join(" → ") : "_none recorded_"}`,
    `- Explorer: ${d.explorer ? `age ${d.explorer.age}${d.explorer.unlockAll ? ", unlock-all on" : ""}${d.explorer.dailyLimitMin ? `, ${d.explorer.dailyLimitMin} min daily limit` : ""}` : "_none open_"}`,
    `- Explorers on the device: ${d.explorersOnDevice}`,
    "",
    "### App",
    "",
    `- Version: \`${d.app.version}\` (build \`${d.app.build}\`, ${d.app.shell})`,
    `- Cloud sync: ${d.sync.mode}${d.sync.lastSyncMin === null ? ", never synced" : `, last synced ${d.sync.lastSyncMin} min ago`}${d.sync.lastError ? ` — last error: ${d.sync.lastError}` : ""}`,
    `- Screen size: ${d.device.viewport}, ${d.device.online ? "online" : "offline"}, ${d.device.language}, ${d.device.timeZone}`,
    `- Browser: \`${d.device.userAgent}\``,
    `- Reported at: ${d.reportedAt} (about ${d.app.sessionMin} min into the session)`,
  ];
  if (d.errors.length) {
    lines.push("", "### Errors caught in the app", "");
    for (const e of d.errors) {
      lines.push(`- **${e.kind}**: ${e.message}${e.where ? ` _(${e.where})_` : ""}`);
      if (e.stack) lines.push("", "  ```", ...e.stack.split("\n").map((l) => `  ${l}`), "  ```");
    }
  }
  lines.push("", "---", "", "_Sent from the in-app “Report a problem” button. No names, emails, family codes or progress are collected._");
  return lines.join("\n");
}

/** A prefilled "new issue" link, used when the report cannot be sent from the app. */
export function issueUrl(report: Report): string {
  const params = new URLSearchParams({
    title: report.summary || "Problem in Nature Maths",
    body: reportBody(report),
    labels: "bug,from-app",
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

export type ReportOutcome = { ok: true } | { ok: false; error: string };

function tooSoon(now: number): boolean {
  try {
    const last = Number(localStorage.getItem(THROTTLE_KEY) ?? 0);
    return Number.isFinite(last) && now - last < REPORT_GAP_MS;
  } catch {
    return false;
  }
}

function remember(now: number): void {
  try {
    localStorage.setItem(THROTTLE_KEY, String(now));
  } catch {
    /* private browsing; the throttle is a courtesy, not a guarantee */
  }
}

export async function submitReport(report: Report, now = Date.now()): Promise<ReportOutcome> {
  if (!report.summary) return { ok: false, error: "Please say what went wrong in a few words." };
  if (tooSoon(now)) return { ok: false, error: "A report was just sent. Please wait a minute before sending another." };
  const r = await sendReport({
    summary: report.summary,
    details: report.details,
    body: reportBody(report),
    diagnostics: report.diagnostics as unknown as Record<string, unknown>,
    app_version: report.diagnostics.app.version,
  });
  if (!r.ok) return { ok: false, error: r.error };
  remember(now);
  return { ok: true };
}
