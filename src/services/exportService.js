/**
 * exportService.js
 * Centraliza a lógica de exportação de arquivos PDF e CSV.
 * Este serviço é puro: não usa React, não acessa estado e não altera a UI diretamente.
 */

/**
 * Função utilitária para garantir que um valor seja texto válido.
 */
export function safeText(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

/**
 * Escapa valores para o formato CSV.
 */
export function escapeCsvValue(value) {
  const text = safeText(value, "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Realiza o download de um arquivo de texto/blob no navegador.
 */
export function downloadFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formata data/hora para exibição em exportações.
 */
export function formatExportDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

/**
 * Exporta logs de auditoria para CSV.
 * Recebe logs já normalizados.
 */
export function exportAuditLogsCsv(logs = [], options = {}) {
  const { filename = "auditoria-logs.csv" } = options;

  const headers = ["Data/Hora", "Operador", "Ação", "Detalhes"];
  
  const rows = logs.map((lg) => [
    lg.timestamp || formatExportDateTime(lg.created_at),
    lg.user || lg.user_name || "—",
    lg.action || "—",
    lg.target || "—"
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map((row) => row.map(escapeCsvValue).join(";"))
  ].join("\n");

  downloadFile(filename, csvContent, "text/csv;charset=utf-8;");
}

/**
 * Exporta logs de auditoria para PDF via janela de impressão (Layout Rich HTML).
 */
export function exportAuditLogsPdf(logs = [], options = {}) {
  const { 
    title = "Auditoria de Sistema",
    subtitle = "Log de eventos e operações",
    logoUrl = "" 
  } = options;

  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Pop-up bloqueado. Permita pop-ups para exportar.");
  }

  const rowsHtml = (logs || []).map((lg) =>
    `<tr>
      <td style="white-space: nowrap;">${lg.timestamp}</td>
      <td><b>${lg.user}</b></td>
      <td><span style="padding:4px 8px;background:#e2e8f0;color:#334155;border-radius:4px;font-size:11px;font-weight:600;">${lg.action}</span></td>
      <td>${lg.target || "—"}</td>
    </tr>`
  ).join("");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; margin: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
  .header img { height: 55px; object-fit: contain; }
  .header-titles h2 { margin: 0; font-size: 24px; color: #0f172a; letter-spacing: -0.5px; }
  .header-titles p { margin: 6px 0 0; font-size: 14px; color: #64748b; }
  .meta { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; vertical-align: middle; }
  th { background: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 11px; border-top: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #fafaf9; }
</style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : '<div></div>'}
    <div class="header-titles" style="text-align: right;">
      <h2>${title}</h2>
      <p>${subtitle}</p>
    </div>
  </div>
  <div class="meta">
    <span>Emissão: <b>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</b></span>
    <span>Total de Eventos: <b>${logs.length}</b></span>
  </div>
  <table>
    <thead>
      <tr><th>Data/Hora</th><th>Operador</th><th>Ação do Sistema</th><th>Alvo/Detalhe</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>setTimeout(() => window.print(), 800);</script>
</body>
</html>`);
  w.document.close();
}

/**
 * Exporta logs de auditoria para PDF via html2pdf (Layout Moderno).
 */
export function generateDirectLogsPdf(logs = [], options = {}) {
  const { 
    title = "Registro de Auditoria de Sistema",
    subtitle = "Log de eventos e operações",
    logoUrl = "",
    filename = 'auditoria-logs.pdf'
  } = options;

  if (typeof window.html2pdf === "undefined") {
    // Fallback se html2pdf não estiver carregado
    return exportAuditLogsPdf(logs, options);
  }

  const rowsHtml = (logs || []).map((lg) =>
    `<tr>
      <td style="border-bottom:1px solid #e2e8f0;padding:12px 10px;white-space:nowrap;">${lg.timestamp}</td>
      <td style="border-bottom:1px solid #e2e8f0;padding:12px 10px;"><b>${lg.user}</b></td>
      <td style="border-bottom:1px solid #e2e8f0;padding:12px 10px;"><span style="padding:4px 8px;background:#e2e8f0;color:#334155;border-radius:4px;font-size:11px;font-weight:600;">${lg.action}</span></td>
      <td style="border-bottom:1px solid #e2e8f0;padding:12px 10px;width:100%">${lg.target || "—"}</td>
    </tr>`
  ).join("");

  const content = document.createElement("div");
  content.innerHTML = `<div style="font-family:Inter,sans-serif;padding:30px;color:#1e293b;background:#fff;">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:55px;object-fit:contain;" />` : '<div></div>'}
      <div style="text-align:right;">
        <h2 style="margin:0;font-size:24px;color:#0f172a;letter-spacing:-0.5px;">${title}</h2>
        <p style="margin:6px 0 0;font-size:14px;color:#64748b;">${subtitle}</p>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:20px;background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;">
      <span>Emissão: <b>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</b></span>
      <span>Total de Eventos: <b>${logs.length}</b></span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th style="border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;padding:12px 10px;background:#f1f5f9;text-align:left;font-weight:700;color:#334155;text-transform:uppercase;font-size:11px;">Data/Hora</th>
          <th style="border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;padding:12px 10px;background:#f1f5f9;text-align:left;font-weight:700;color:#334155;text-transform:uppercase;font-size:11px;">Operador</th>
          <th style="border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;padding:12px 10px;background:#f1f5f9;text-align:left;font-weight:700;color:#334155;text-transform:uppercase;font-size:11px;">Ação do Sistema</th>
          <th style="border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;padding:12px 10px;background:#f1f5f9;text-align:left;font-weight:700;color:#334155;text-transform:uppercase;font-size:11px;">Detalhe</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>`;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  window.html2pdf().set(opt).from(content).save();
}
