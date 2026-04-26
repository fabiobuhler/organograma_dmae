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
 * Realiza o download de um arquivo CSV com BOM UTF-8 e dica de separador para o Excel.
 */
export function downloadCsvFile(filename, csvContent, options = {}) {
  const {
    includeBom = true,
    includeSeparatorHint = true,
    separator = ";"
  } = options;

  const separatorHint = includeSeparatorHint ? `sep=${separator}\r\n` : "";

  const normalizedContent = String(csvContent || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");

  const finalContent = `${separatorHint}${normalizedContent}`;

  const parts = [];

  if (includeBom) {
    parts.push(new Uint8Array([0xef, 0xbb, 0xbf]));
  }

  parts.push(finalContent);

  const blob = new Blob(parts, {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function encodeUtf16LeWithBom(text) {
  const normalizedText = String(text || "");
  const buffer = new ArrayBuffer(normalizedText.length * 2 + 2);
  const view = new DataView(buffer);

  // BOM UTF-16LE: FF FE
  view.setUint8(0, 0xff);
  view.setUint8(1, 0xfe);

  for (let i = 0; i < normalizedText.length; i += 1) {
    view.setUint16(2 + i * 2, normalizedText.charCodeAt(i), true);
  }

  return buffer;
}

export function downloadExcelCsvFile(filename, csvContent, options = {}) {
  const {
    separator = ";",
    includeSeparatorHint = true
  } = options;

  const separatorHint = includeSeparatorHint ? `sep=${separator}\r\n` : "";

  const normalizedContent = String(csvContent || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");

  const finalContent = `${separatorHint}${normalizedContent}`;
  const buffer = encodeUtf16LeWithBom(finalContent);

  const blob = new Blob([buffer], {
    type: "text/csv;charset=utf-16le"
  });

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

  downloadCsvFile(filename, csvContent, {
    includeBom: true,
    includeSeparatorHint: true,
    separator: ";"
  });
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

/**
 * Exporta lista de ativos para CSV.
 */
export function exportAssetsCsv(assets = [], options = {}) {
  const { filename = "ativos-export.csv", nodes = [] } = options;

  const headers = [
    "Identificação", "Categoria", "Tipo", "Fabricante", "Modelo", 
    "Ano", "Placa", "Patrimônio", "Vínculo", "Contrato", 
    "Empresa", "Unidade"
  ];

  const rows = assets.map((a) => [
    a.name,
    a.category,
    a.type,
    a.manufacturer,
    a.model,
    a.year,
    a.plate,
    a.patrimonio,
    a.tipoVinculo || "Próprio",
    a.numeroContrato || "",
    a.empresaContratada || "",
    nodes.find((n) => n.id === a.nodeId)?.name || ""
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map((row) => row.map(escapeCsvValue).join(";"))
  ].join("\n");

  downloadExcelCsvFile(filename, csvContent, {
    includeSeparatorHint: true,
    separator: ";"
  });
}

/**
 * Exporta lista de ativos para PDF (Layout Rich HTML).
 */
export function exportAssetsPdf(list = [], options = {}) {
  const {
    label = "Geral",
    nodes = [],
    sort = { key: "name", direction: "asc" },
    logoUrl = ""
  } = options;

  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Pop-up bloqueado. Permita pop-ups para exportar.");
  }

  // Sort helper
  const applySort = (arr) => [...arr].sort((a, b) => {
    let valA = "", valB = "";
    const s = sort || { key: "name", direction: "asc" };
    if (s.key === "name") { valA = a.name; valB = b.name; }
    else if (s.key === "vinculo") { valA = a.tipoVinculo; valB = b.tipoVinculo; }
    else if (s.key === "node") { valA = nodes.find(n => n.id === a.nodeId)?.name || ""; valB = nodes.find(n => n.id === b.nodeId)?.name || ""; }
    else if (s.key === "contato") { valA = a.contatoResponsavel || a.contatoFone || ""; valB = b.contatoResponsavel || b.contatoFone || ""; }
    valA = (valA || "").toLowerCase(); valB = (valB || "").toLowerCase();
    if (valA < valB) return s.direction === "asc" ? -1 : 1;
    if (valA > valB) return s.direction === "asc" ? 1 : -1;
    return 0;
  });

  const sortLabel = { name: "Ativo", vinculo: "Vínculo", node: "Localização", contato: "Contato" }[sort?.key || "name"];
  const sortDir = sort?.direction === "desc" ? "Decrescente" : "Crescente";

  // Row renderer
  const renderRow = (a) => {
    let statusHtml = "";
    if (a.isEmergency) statusHtml += `<span style="display:inline-block;padding:3px 6px;background:#fee2e2;color:#b91c1c;border-radius:4px;font-size:10px;margin-right:4px;font-weight:600;">🚨 Contingência</span>`;
    if (a.isMaintenance) statusHtml += `<span style="display:inline-block;padding:3px 6px;background:#fef3c7;color:#b45309;border-radius:4px;font-size:10px;font-weight:600;">🛠️ Manutenção</span>`;
    return `<tr>
      <td>${safeText(a.category)}</td>
      <td><b>${safeText(a.name)}</b></td>
      <td>${safeText(a.manufacturer, "")}</td>
      <td>${safeText(a.model, "")}</td>
      <td>${safeText(a.year, "")}</td>
      <td>${safeText(a.plate, "")}</td>
      <td>${safeText(a.os, "")}</td>
      <td>${safeText(a.patrimonio, "")}</td>
      <td>${nodes.find(n => n.id === a.nodeId)?.name || "—"}</td>
      <td style="min-width:120px">${statusHtml}</td>
    </tr>`;
  };

  const tableHeader = `<thead>
    <tr>
      <th>Categoria</th><th>Identificação</th><th>Fabricante</th><th>Modelo</th>
      <th>Ano</th><th>Placa</th><th>O.S.</th><th>Patrimônio</th><th>Localização</th><th>Status / Obs</th>
    </tr>
  </thead>`;

  const renderTable = (items) =>
    `<table>${tableHeader}<tbody>${applySort(items).map(renderRow).join("")}</tbody></table>`;

  const proprios = list.filter(a => !a.tipoVinculo || a.tipoVinculo !== "Contratado");
  const contratados = list.filter(a => a.tipoVinculo === "Contratado");

  // Group contratados helper (simplificado para o service)
  const byEmpresa = {};
  contratados.forEach(a => {
    const emp = a.empresaContratada || "Empresa não informada";
    const ctt = a.numeroContrato || "Contrato não informado";
    if (!byEmpresa[emp]) byEmpresa[emp] = {};
    if (!byEmpresa[emp][ctt]) byEmpresa[emp][ctt] = [];
    byEmpresa[emp][ctt].push(a);
  });

  let propriosSection = "";
  if (proprios.length > 0) {
    propriosSection = `
      <div class="section-header section-own">
        <span>🏛️ Ativos Próprios</span>
        <span class="badge">${proprios.length} item(ns)</span>
      </div>
      ${renderTable(proprios)}`;
  }

  let contratadosSection = "";
  if (contratados.length > 0) {
    const empresaBlocks = Object.keys(byEmpresa).sort().map(emp => {
      const contratos = byEmpresa[emp];
      const contratoBlocks = Object.keys(contratos).sort().map(ctt => {
        const items = contratos[ctt];
        return `
          <div class="contract-block">
            <div class="contract-header">
              📄 Contrato: <b>${ctt}</b>
              <span class="badge badge-ctt">${items.length} item(ns)</span>
            </div>
            ${renderTable(items)}
          </div>`;
      }).join("");

      const total = Object.values(contratos).reduce((s, v) => s + v.length, 0);
      return `
        <div class="empresa-block">
          <div class="empresa-header">
            🏢 <b>${emp}</b>
            <span class="badge">${total} item(ns) — ${Object.keys(contratos).length} contrato(s)</span>
          </div>
          ${contratoBlocks}
        </div>`;
    }).join("");

    contratadosSection = `
      <div class="section-header section-ctt">
        <span>🤝 Ativos Contratados</span>
        <span class="badge">${contratados.length} item(ns)</span>
      </div>
      ${empresaBlocks}`;
  }

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Relatório de Ativos - ${label}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; margin: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
  .header img { height: 55px; object-fit: contain; }
  .header-titles h2 { margin: 0; font-size: 24px; color: #0f172a; letter-spacing: -0.5px; }
  .header-titles p  { margin: 6px 0 0; font-size: 14px; color: #64748b; }
  .meta { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 28px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-radius: 8px 8px 0 0; font-size: 15px; font-weight: 700; margin-top: 28px; margin-bottom: 0; }
  .section-own { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .section-ctt { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .empresa-block { margin-top: 24px; }
  .empresa-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px 6px 0 0; font-size: 13px; color: #166534; font-weight: 700; }
  .contract-block { margin-top: 12px; margin-left: 20px; }
  .contract-header { display: flex; align-items: center; gap: 10px; padding: 6px 12px; background: #fafafa; border: 1px solid #e2e8f0; border-bottom: none; border-radius: 6px 6px 0 0; font-size: 12px; color: #475569; }
  .badge { font-size: 11px; font-weight: 600; background: #fff; border-radius: 20px; padding: 2px 10px; border: 1px solid currentColor; opacity: 0.85; }
  .badge-ctt { color: #6d28d9; border-color: #c4b5fd; background: #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 4px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 10px; text-align: left; vertical-align: middle; }
  th { background: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 10px; border-top: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #fafaf9; }
</style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : '<div></div>'}
    <div class="header-titles" style="text-align: right;">
      <h2>Relatório Centralizado de Ativos</h2>
      <p>Filtro/Agrupamento: <b>${label}</b></p>
    </div>
  </div>
  <div class="meta">
    <span>Emissão: <b>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</b></span>
    <span>Ordenado por: <b>${sortLabel}</b> &mdash; ${sortDir} &nbsp;|&nbsp; Total: <b>${list.length}</b> (${proprios.length} próprios / ${contratados.length} contratados)</span>
  </div>
  ${propriosSection}
  ${contratadosSection}
  <script>setTimeout(() => window.print(), 900);</script>
</body>
</html>`);
  w.document.close();
}
