// ═══════════════════════════════════════════════════════════════════════════
// usePDFExport — browser-native PDF generation via print API.
// No external libraries. Opens a styled print window → Save as PDF.
// Also provides downloadAsText for plain text export.
// ═══════════════════════════════════════════════════════════════════════════

const SAGE = "#7a9068";
const PLATFORM = "CreateAI Brain";

function buildPrintHtml(title: string, content: string, engineName: string, dateStr: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title} — ${PLATFORM}</title>
<style>
  @page { margin: 28mm 22mm 24mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11.5pt; line-height: 1.7;
    color: #1a1a1a; background: #fff;
    max-width: 680px; margin: 0 auto;
  }
  .header {
    border-bottom: 2.5px solid ${SAGE};
    padding-bottom: 14px; margin-bottom: 22px;
  }
  .platform-label {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 9pt; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${SAGE}; margin-bottom: 6px;
  }
  h1 {
    font-size: 20pt; font-weight: 700; color: #0f172a;
    margin: 0 0 6px; line-height: 1.2; letter-spacing: -0.02em;
  }
  .meta {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 9pt; color: #64748b; display: flex; gap: 16px;
  }
  .body-text p { margin: 0 0 12px; }
  .body-text { font-size: 11.5pt; }
  .footer {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 10px;
    font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="platform-label">${PLATFORM} · ${engineName}</div>
    <h1>${title}</h1>
    <div class="meta">
      <span>📅 ${dateStr}</span>
      <span>📝 ${content.trim().split(/\s+/).filter(Boolean).length} words</span>
    </div>
  </div>
  <div class="body-text"><p>${escaped}</p></div>
  <div class="footer">
    <span>${PLATFORM} — createai.digital</span>
    <span>Generated ${dateStr}</span>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
</body>
</html>`;
}

/**
 * Opens a print dialog for the given content.
 * User can choose "Save as PDF" in the print dialog.
 */
export function exportToPDF(
  title: string,
  content: string,
  engineName: string,
  date?: Date,
): void {
  const dateStr = (date ?? new Date()).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const html = buildPrintHtml(title || engineName, content, engineName, dateStr);
  const win  = window.open("", "_blank", "width=820,height=700");
  if (!win) {
    // Popup blocked — fall back to blob URL
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/**
 * Downloads content as a plain .txt file.
 */
export function downloadAsText(filename: string, content: string): void {
  const safe = filename.replace(/[^a-z0-9\-_\s]/gi, "").trim() || "createai-output";
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${safe}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Copies text to clipboard. Returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity  = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  }
}

/**
 * React hook that provides PDF export and text download utilities.
 */
export function usePDFExport() {
  return { exportToPDF, downloadAsText, copyToClipboard };
}
