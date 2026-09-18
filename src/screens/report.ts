/**
 * "Report a problem": a small button in the corner of every screen, and the dialog
 * behind it. It lives outside #app so it survives every screen change, and it reads
 * the live route so a report always says where the problem happened.
 */
import type { Ctx } from "../app/context";
import { cloudConfigured } from "../app/cloud";
import { DETAILS_MAX, SUMMARY_MAX, buildReport, issueUrl, reportBody, submitReport, type Report } from "../app/report";
import { delegate, html } from "../ui/html";

type Stage = "form" | "sending" | "sent" | "failed";

export function mountReportButton(ctx: Ctx): HTMLElement {
  const host = document.createElement("div");
  host.className = "report-host";
  document.body.append(host);

  let open = false;
  let stage: Stage = "form";
  let error = "";
  let showDetail = false;
  let report: Report | null = null;
  let summary = "";
  let details = "";
  let opener: HTMLElement | null = null;
  let focusOnDraw = false;
  let copied = false;

  const preview = (): string => (report ? reportBody(report) : "");

  const draw = (): void => {
    host.innerHTML = html`
      <button class="report-fab" data-action="report-open" aria-haspopup="dialog" title="Report a problem with the app">
        <span aria-hidden="true">🐛</span><span class="report-fab-text">Report a problem</span>
      </button>
      ${open
        ? html`<div class="report-backdrop">
            <div class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
              ${stage === "sent"
                ? html`
                    <h2 id="report-title">Thank you!</h2>
                    <p>The report is on its way to the people who make Nature Maths. There is nothing else to do.</p>
                    <div class="chip-row"><button class="btn primary" data-action="report-close">Close</button></div>`
                : html`
                    <h2 id="report-title">Report a problem</h2>
                    <p class="muted">Tell us what went wrong and we will take a look. This goes to the project's public bug list, so please do not type anybody's name, email or address.</p>
                    ${error ? html`<p class="error report-error">${error}</p>` : ""}
                    <form class="cloud-form" data-submit="report-send">
                      <label class="field">
                        <span>What went wrong?</span>
                        <input name="summary" type="text" maxlength="${SUMMARY_MAX}" autocomplete="off" placeholder="The stars did not save" value="${summary}" ${stage === "sending" ? "disabled" : ""} />
                      </label>
                      <label class="field">
                        <span>Anything else that helps? (optional)</span>
                        <textarea name="details" rows="4" maxlength="${DETAILS_MAX}" placeholder="What were you doing just before it happened?" ${stage === "sending" ? "disabled" : ""}>${details}</textarea>
                      </label>
                      <div class="chip-row">
                        <button class="btn primary" data-action="report-send" ${stage === "sending" ? "disabled" : ""}>${stage === "sending" ? "Sending…" : "Send report"}</button>
                        ${stage === "failed" && report
                          ? html`<a class="btn" href="${issueUrl(report)}" target="_blank" rel="noopener noreferrer">Open it on GitHub instead</a>
                              <button class="btn" type="button" data-action="report-copy">${copied ? "Copied!" : "Copy the report"}</button>`
                          : ""}
                        <button class="btn ghost" type="button" data-action="report-close">Cancel</button>
                      </div>
                    </form>
                    <button class="btn ghost small" type="button" data-action="report-detail">${showDetail ? "Hide" : "Show"} what is sent with this report</button>
                    ${showDetail ? html`<pre class="report-preview">${preview()}</pre>` : ""}
                    <p class="muted small-text">Sent with every report: which screen you were on, the app version, your browser and screen size, and any errors the app caught. Never sent: explorer names, your email, your family code or anybody's progress.</p>`}
            </div>
          </div>`
        : ""}
    `.value;
    if (open && focusOnDraw) {
      focusOnDraw = false;
      host.querySelector<HTMLInputElement>("input[name=summary]")?.focus();
    }
  };

  const rebuild = (): void => {
    summary = host.querySelector<HTMLInputElement>("input[name=summary]")?.value ?? summary;
    details = host.querySelector<HTMLTextAreaElement>("textarea[name=details]")?.value ?? details;
    report = buildReport(ctx.state, ctx.route, summary, details);
  };

  const close = (): void => {
    open = false;
    draw();
    opener?.focus();
    opener = null;
  };

  delegate(host, {
    "report-open"(el) {
      opener = el;
      open = true;
      stage = "form";
      error = "";
      showDetail = false;
      focusOnDraw = true;
      copied = false;
      draw();
      rebuild();
    },
    "report-close": close,
    "report-detail"() { rebuild(); showDetail = !showDetail; draw(); },
    // The packaged desktop app cannot open a browser tab, so the whole report can be
    // copied out and pasted into an issue or an email instead.
    "report-copy"() {
      if (!report) return;
      void copyText(`${report.summary}\n\n${reportBody(report)}`).then((ok) => {
        copied = ok;
        error = ok ? "" : "Could not copy. Select the text below and copy it by hand.";
        showDetail = showDetail || !ok;
        draw();
      });
    },
    "report-send"() {
      rebuild();
      if (!report?.summary) { error = "Please say what went wrong in a few words."; draw(); return; }
      if (!cloudConfigured()) {
        error = "This build cannot send reports by itself. Use the GitHub link instead.";
        stage = "failed";
        draw();
        return;
      }
      stage = "sending";
      error = "";
      draw();
      void submitReport(report).then((r) => {
        if (r.ok) { stage = "sent"; error = ""; } else { stage = "failed"; error = `${r.error} You can still open it on GitHub.`; }
        draw();
      });
    },
  });

  // Clicking the dark area around the dialog closes it. This is a plain listener, not a
  // delegated action, so it never swallows the click on the GitHub fallback link.
  host.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).classList.contains("report-backdrop")) close();
  });
  host.addEventListener("submit", (ev) => {
    ev.preventDefault();
    host.querySelector<HTMLElement>('[data-action="report-send"]')?.click();
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && open) close(); });

  draw();
  return host;
}

/** Clipboard API where it exists, with the old textarea trick where it does not. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* blocked; fall through to the textarea */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
