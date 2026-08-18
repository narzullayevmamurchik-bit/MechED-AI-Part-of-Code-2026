import { fetchApplicationEvents, fetchSkillGapProgress, type JobApplication, type SkillGapProgress } from "@/hooks/useCareers";

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const gapStatusLabel = (s: SkillGapProgress["status"]) =>
  s === "done" ? "Done" : s === "in_progress" ? "In progress" : "To do";

export async function exportApplicationPacket(app: JobApplication, candidateName?: string) {
  const [events, gaps] = await Promise.all([
    fetchApplicationEvents(app.id),
    fetchSkillGapProgress(app.job_id),
  ]);

  const totalGaps = gaps.length;
  const doneGaps = gaps.filter((g) => g.status === "done").length;
  const progressPct = totalGaps > 0 ? Math.round((doneGaps / totalGaps) * 100) : 0;

  const generatedAt = new Date().toLocaleString();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Application Packet — ${escapeHtml(app.job?.title ?? "Job")}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 32px;
    line-height: 1.45;
    font-size: 13px;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e5e5; text-transform: uppercase; letter-spacing: 0.04em; color: #333; }
  .muted { color: #666; font-size: 12px; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #f1f1f1; font-size: 11px; margin-right: 4px; text-transform: capitalize; }
  .pill.success { background: #d1fae5; color: #065f46; }
  .pill.warn { background: #fef3c7; color: #92400e; }
  .pill.danger { background: #fee2e2; color: #991b1b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .meta { font-size: 12px; color: #555; }
  .grid-2 { display: grid; grid-template-columns: 160px 1fr; gap: 6px 12px; font-size: 12.5px; }
  .grid-2 dt { color: #666; }
  .grid-2 dd { margin: 0; color: #111; word-break: break-word; }
  .timeline { border-left: 2px solid #e5e5e5; padding-left: 14px; margin-left: 4px; }
  .event { position: relative; padding: 6px 0 10px; }
  .event::before {
    content: ""; position: absolute; left: -19px; top: 11px;
    width: 8px; height: 8px; border-radius: 50%; background: #2563eb;
  }
  .event-head { font-weight: 600; font-size: 12.5px; }
  .event-time { color: #666; font-size: 11px; margin-left: 6px; font-weight: 400; }
  .event-note { margin-top: 2px; font-size: 12.5px; color: #222; white-space: pre-wrap; }
  .progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 6px 0 12px; }
  .progress-fill { height: 100%; background: #2563eb; }
  table.gaps { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  table.gaps th, table.gaps td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  table.gaps th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; background: #fafafa; }
  .cover { white-space: pre-wrap; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #eee; font-size: 12.5px; }
  a { color: #2563eb; text-decoration: none; word-break: break-all; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #888; text-align: center; }
  .actions { margin-bottom: 24px; }
  .actions button { padding: 8px 14px; border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 6px; }
  .actions button.secondary { background: #fff; color: #2563eb; }
  @media print {
    body { padding: 18px; }
    .actions { display: none; }
    h2 { page-break-after: avoid; }
    .event, tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>

  <div class="header">
    <div>
      <h1>${escapeHtml(app.job?.title ?? "Job Application")}</h1>
      <div class="meta">
        ${escapeHtml(app.company?.name ?? "Company")}
        ${app.job?.location ? ` · ${escapeHtml(app.job.location)}` : ""}
        ${app.job?.type ? ` · ${escapeHtml(app.job.type.replace("_", " "))}` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <span class="pill ${app.status === "offer" ? "success" : app.status === "rejected" || app.status === "withdrawn" ? "danger" : "warn"}">
        ${escapeHtml(STATUS_LABEL[app.status] ?? app.status)}
      </span>
      <div class="muted" style="margin-top:6px">Generated ${escapeHtml(generatedAt)}</div>
    </div>
  </div>

  <h2>Application Details</h2>
  <dl class="grid-2">
    ${candidateName ? `<dt>Candidate</dt><dd>${escapeHtml(candidateName)}</dd>` : ""}
    <dt>Applied on</dt><dd>${escapeHtml(new Date(app.created_at).toLocaleDateString())}</dd>
    <dt>Last update</dt><dd>${escapeHtml(new Date(app.updated_at).toLocaleString())}</dd>
    <dt>Resume / Portfolio</dt><dd>${app.resume_url ? `<a href="${escapeHtml(app.resume_url)}">${escapeHtml(app.resume_url)}</a>` : '<span class="muted">Not provided</span>'}</dd>
    ${app.job?.apply_url ? `<dt>Job posting</dt><dd><a href="${escapeHtml(app.job.apply_url)}">${escapeHtml(app.job.apply_url)}</a></dd>` : ""}
    ${app.job?.required_skills?.length ? `<dt>Required skills</dt><dd>${app.job.required_skills.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join("")}</dd>` : ""}
  </dl>

  ${app.cover_letter ? `<h2>Cover Letter</h2><div class="cover">${escapeHtml(app.cover_letter)}</div>` : ""}

  <h2>Stage Notes & Timeline</h2>
  ${events.length === 0 ? '<p class="muted">No events yet.</p>' : `
  <div class="timeline">
    ${events.map((e) => `
      <div class="event">
        <div class="event-head">
          ${escapeHtml(STATUS_LABEL[e.status] ?? e.status)}
          <span class="event-time">${escapeHtml(new Date(e.created_at).toLocaleString())}</span>
        </div>
        ${e.note ? `<div class="event-note">${escapeHtml(e.note)}</div>` : '<div class="muted" style="font-size:11px">— no note —</div>'}
      </div>
    `).join("")}
  </div>`}

  <h2>Skill Gaps Progress</h2>
  ${totalGaps === 0 ? '<p class="muted">No skill gaps tracked for this job yet. Run "Check fit" on the job page to generate one.</p>' : `
    <div class="muted">${doneGaps} of ${totalGaps} skills closed (${progressPct}%)</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
    <table class="gaps">
      <thead><tr><th>Skill</th><th>Status</th><th>Note</th><th>Updated</th></tr></thead>
      <tbody>
        ${gaps.map((g) => `
          <tr>
            <td><strong>${escapeHtml(g.skill)}</strong></td>
            <td><span class="pill ${g.status === "done" ? "success" : g.status === "in_progress" ? "warn" : ""}">${escapeHtml(gapStatusLabel(g.status))}</span></td>
            <td>${escapeHtml(g.note ?? "")}</td>
            <td class="muted">${escapeHtml(new Date(g.updated_at).toLocaleDateString())}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}

  <div class="footer">
    Application packet · MechEd AI · ${escapeHtml(generatedAt)}
  </div>

  <script>
    // Auto-open print dialog after a brief render delay
    window.addEventListener('load', function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 400);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    // Popup blocked — fallback to data URL download
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-${(app.job?.title ?? "job").replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
