/**
 * Turns rows from the Supabase `reports` table into GitHub issues, then marks them
 * filed so they are never opened twice. Run by .github/workflows/bug-reports.yml.
 *
 * Needs: SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY. The project URL
 * comes from the committed .env, the same value the app is built with; SUPABASE_URL
 * overrides it when the two should differ.
 * Reads at most MAX_PER_RUN rows per run, so a flood of reports cannot turn into a
 * flood of issues; the rest wait for the next run.
 */
import { readFileSync } from "node:fs";
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN ?? 10);
const LABELS = (process.env.REPORT_LABELS ?? "bug,from-app").split(",").map((l) => l.trim()).filter(Boolean);

/** The project URL lives in the committed .env, so CI needs no variable for it. */
function urlFromEnvFile() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    return (/^\s*VITE_SUPABASE_URL\s*=\s*(.*)$/m.exec(text)?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

/** Accepts the plain project URL or a pasted REST endpoint, as the app does. */
const projectUrl = (raw) => raw.trim().replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/, "").replace(/\/+$/, "");

const url = projectUrl((process.env.SUPABASE_URL ?? "").trim() || urlFromEnvFile());
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const token = (process.env.GITHUB_TOKEN ?? "").trim();
const repo = (process.env.GITHUB_REPOSITORY ?? "").trim();
const api = (process.env.GITHUB_API_URL ?? "https://api.github.com").replace(/\/+$/, "");

// No key at all means the feature is not switched on here (a fork, say): say so and stop.
if (!key) { console.log("SUPABASE_SERVICE_ROLE_KEY is not set; nothing to do."); process.exit(0); }
// A key with no URL is a misconfiguration, not an idle run, so fail loudly rather than
// reporting success while every report sits unfiled.
if (!url) { console.error("No Supabase project URL. Set VITE_SUPABASE_URL in .env, or a SUPABASE_URL secret."); process.exit(1); }
if (!token || !repo) { console.error("GITHUB_TOKEN and GITHUB_REPOSITORY are required."); process.exit(1); }
console.log(`Reading reports from ${url}`);

const db = async (path, init = {}) => {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
};

const gh = async (path, init = {}) => {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};

/** Reports are written by anyone with the public anon key, so treat every field as text. */
const clean = (value, max) => String(value ?? "").replace(/\r/g, "").slice(0, max);

const title = (row) => {
  const summary = clean(row.summary, 120).replace(/\s+/g, " ").trim() || "Problem reported in the app";
  return `[app] ${summary}`;
};

const body = (row) => {
  const reported = clean(row.body, 60000);
  const footer = `\n\n<sub>Report \`${clean(row.id, 40)}\` · received ${clean(row.created_at, 40)} · app \`${clean(row.app_version, 40) || "unknown"}\`</sub>`;
  if (reported) return reported + footer;
  // Older app versions did not render a body; fall back to the raw fields.
  return `### What happened\n\n${clean(row.details, 4000) || "_(no description given)_"}\n\n### Context\n\n\`\`\`json\n${clean(JSON.stringify(row.diagnostics ?? {}, null, 2), 8000)}\n\`\`\`${footer}`;
};

const rows = await db(`reports?status=eq.new&order=created_at.asc&limit=${MAX_PER_RUN}&select=*`);
if (!rows.length) { console.log("No new reports."); process.exit(0); }
console.log(`${rows.length} new report(s).`);

let filed = 0;
for (const row of rows) {
  try {
    const issue = await gh(`/repos/${repo}/issues`, { method: "POST", body: JSON.stringify({ title: title(row), body: body(row), labels: LABELS }) });
    await db(`reports?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ status: "filed", issue_number: issue.number, filed_at: new Date().toISOString() }),
    });
    filed++;
    console.log(`report ${row.id} -> issue #${issue.number}`);
  } catch (err) {
    console.error(`report ${row.id} failed: ${err.message}`);
    // Park it so a permanently bad row does not block the queue on every run.
    await db(`reports?id=eq.${row.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "failed" }) }).catch(() => {});
  }
}
console.log(`Filed ${filed} of ${rows.length}.`);
