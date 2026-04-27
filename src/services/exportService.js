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

/**
 * Exporta lista de contratos para CSV.
 */
export function exportContractsCsv(contracts = [], options = {}) {
  const {
    filename = "contratos-export.csv",
    nodes = [],
    personMap = new Map(),
    getContractStatus
  } = options;

  const headers = [
    "Número/SEI", "Status", "Objeto", "Empresa", "CNPJ", "Contato", "Unidade",
    "Início", "Término", "Itens", "Aditivos",
    "Gestor Titular", "Gestor Suplente",
    "Fiscal Contrato Titular", "Fiscal Contrato Suplente",
    "Fiscal Serviço Titular", "Fiscal Serviço Suplente"
  ];

  const rows = contracts.map((c) => {
    const node = nodes.find((n) => n.id === c.nodeId);
    const status = getContractStatus ? getContractStatus(c) : "";
    const statusText = status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido";

    const aditivosStr = (c.aditivos || []).map((ad, idx) => `Aditivo ${idx+1}: ${ad.aditivoInício} a ${ad.aditivoTermino}`).join(" | ");

    return [
      c.sei,
      statusText,
      c.objeto,
      c.empresa || "",
      c.cnpj || "",
      c.contato || "",
      node?.name || "",
      c.dataInicio || "",
      c.dataTermino || "",
      c.itens || "",
      aditivosStr,
      personMap.get(c.gestor?.titularId)?.name || "",
      personMap.get(c.gestor?.suplenteId)?.name || "",
      (c.fiscaisContrato || []).map(f => personMap.get(f.titularId)?.name || "").join(", "),
      (c.fiscaisContrato || []).map(f => personMap.get(f.suplenteId)?.name || "").join(", "),
      (c.fiscaisServico || []).map(f => personMap.get(f.titularId)?.name || "").join(", "),
      (c.fiscaisServico || []).map(f => personMap.get(f.suplenteId)?.name || "").join(", ")
    ];
  });

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
 * Exporta um contrato individual para CSV.
 */
export function exportContractDetailCsv(contract, options = {}) {
  if (!contract) return;

  const {
    filename = `contrato-${safeText(contract.sei || contract.id || "export", "export")}.csv`,
    nodes = [],
    personMap = new Map(),
    getContractStatus
  } = options;

  const node = nodes.find((n) => n.id === contract.nodeId);
  const status = getContractStatus ? getContractStatus(contract) : "";
  const statusText = status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido";

  const aditivosStr = (contract.aditivos || []).map((ad, idx) => `Aditivo ${idx+1}: ${ad.aditivoInício} a ${ad.aditivoTermino}`).join(" | ");

  const headers = [
    "Contrato SEI", "Status", "Objeto", "Unidade vinculada", "Empresa", "CNPJ", "Contato",
    "Início", "Término", "Itens", "Aditivos", "Observações",
    "Gestor titular", "Gestor suplente",
    "Fiscal contrato titular", "Fiscal contrato suplente",
    "Fiscal serviço titular", "Fiscal serviço suplente"
  ];

  const row = [
    contract.sei || "—",
    statusText || "—",
    contract.objeto || "—",
    node?.name || "—",
    contract.empresa || "—",
    contract.cnpj || "—",
    contract.contato || "—",
    contract.dataInicio || "—",
    contract.dataTermino || "—",
    contract.itens || "—",
    aditivosStr || "—",
    contract.observacoes || "—",
    personMap.get(contract.gestor?.titularId)?.name || "—",
    personMap.get(contract.gestor?.suplenteId)?.name || "—",
    (contract.fiscaisContrato || []).map(f => personMap.get(f.titularId)?.name || "—").join(", ") || "—",
    (contract.fiscaisContrato || []).map(f => personMap.get(f.suplenteId)?.name || "—").join(", ") || "—",
    (contract.fiscaisServico || []).map(f => personMap.get(f.titularId)?.name || "—").join(", ") || "—",
    (contract.fiscaisServico || []).map(f => personMap.get(f.suplenteId)?.name || "—").join(", ") || "—"
  ];

  const csvContent = [
    headers.map(escapeCsvValue).join(";"),
    row.map(escapeCsvValue).join(";")
  ].join("\n");

  downloadExcelCsvFile(filename, csvContent, {
    includeSeparatorHint: true,
    separator: ";"
  });
}

/**
 * Exporta um contrato individual para PDF (Layout Rich HTML).
 */
export function exportContractDetailPdf(contract, options = {}) {
  if (!contract) return;

  const {
    title = "Relat\u00f3rio do Contrato " + (contract.sei || ""),
    subtitle = "Espelho e Detalhamento da Contrata\u00e7\u00e3o",
    logoUrl = "",
    nodes = [],
    personMap = new Map(),
    getContractStatus
  } = options;

  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Pop-up bloqueado. Permita pop-ups para exportar.");
  }

  const node = nodes.find((n) => n.id === contract.nodeId);
  const status = getContractStatus ? getContractStatus(contract) : "";
  const statusLabel = status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido";
  const statusColor = status === "active" ? "#065f46" : status === "expiring" ? "#9a3412" : "#991b1b";
  const statusBg = status === "active" ? "#d1fae5" : status === "expiring" ? "#ffedd5" : "#fee2e2";

  const vigIni = contract.dataInicio ? new Date(contract.dataInicio + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";
  const vigFim = contract.dataTermino ? new Date(contract.dataTermino + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";

  const aditivosHtml = (contract.aditivos || []).length > 0
    ? (contract.aditivos || []).map(function(ad, idx) {
        const ini = ad.aditivoIn\u00edcio ? new Date(ad.aditivoIn\u00edcio + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";
        const fim = ad.aditivoTermino ? new Date(ad.aditivoTermino + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";
        return "<li><b>Aditivo " + (idx+1) + ":</b> " + ini + " a " + fim + "</li>";
      }).join("")
    : "<li>Nenhum aditivo registrado.</li>";

  function buildPersonCard(label, f, idx) {
    var parts = [];
    parts.push('<div class="person-card">');
    parts.push('<p class="person-title">' + label + " (Equipe " + (idx+1) + ")</p>");
    parts.push("<p><b>Titular:</b> " + safeText(personMap.get(f.titularId)?.name || "\u2014") + "</p>");
    parts.push("<p><b>Suplente:</b> " + safeText(personMap.get(f.suplenteId)?.name || "\u2014") + "</p>");
    parts.push("</div>");
    return parts.join("");
  }

  const fiscaisContratoHtml = (contract.fiscaisContrato || []).map(function(f, idx) {
    return buildPersonCard("Fiscal de Contrato", f, idx);
  }).join("");

  const fiscaisServicoHtml = (contract.fiscaisServico || []).map(function(f, idx) {
    return buildPersonCard("Fiscal de Servi\u00e7o", f, idx);
  }).join("");

  const logoHtml = logoUrl ? '<img src="' + logoUrl + '" alt="Logo">' : "<div></div>";
  const dtNow = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");

  const html = [
    "<!DOCTYPE html><html><head>",
    "<title>" + safeText(title) + "</title>",
    "<style>",
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');",
    "body{font-family:'Inter',sans-serif;padding:40px;color:#1e293b;background:#fff;margin:0;line-height:1.5}",
    ".header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}",
    ".header img{height:55px;object-fit:contain}",
    ".header-titles h2{margin:0;font-size:24px;color:#0f172a;letter-spacing:-0.5px}",
    ".header-titles p{margin:6px 0 0;font-size:14px;color:#64748b}",
    ".meta{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:24px;background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0}",
    ".section{margin-bottom:24px;background:#fafaf9;border:1px solid #e2e8f0;border-radius:8px;padding:16px}",
    ".section-title{font-size:16px;font-weight:700;color:#334155;margin-top:0;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}",
    ".grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
    ".info-group{margin-bottom:12px}",
    ".info-group label{display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px}",
    ".info-group div{font-size:13px;color:#0f172a}",
    ".person-card{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:10px;font-size:13px}",
    ".person-title{font-weight:700;color:#475569;margin-top:0;margin-bottom:6px;border-bottom:1px solid #f1f5f9;padding-bottom:4px;font-size:12px}",
    ".person-card p{margin:4px 0}",
    "ul{margin:0;padding-left:20px;font-size:13px}",
    "li{margin-bottom:4px}",
    "</style></head><body>",
    '<div class="header">' + logoHtml,
    '<div class="header-titles" style="text-align:right">',
    "<h2>" + safeText(title) + "</h2>",
    "<p>" + safeText(subtitle) + "</p>",
    "</div></div>",
    '<div class="meta">',
    "<span>Emiss\u00e3o: <b>" + dtNow + "</b></span>",
    '<span>Status atual: <span style="color:' + statusColor + ";background:" + statusBg + ';padding:2px 6px;border-radius:4px;font-weight:bold">' + statusLabel + "</span></span>",
    "</div>",
    '<div class="section">',
    '<h3 class="section-title">Dados B\u00e1sicos do Contrato</h3>',
    '<div class="info-group"><label>Objeto</label><div>' + safeText(contract.objeto || "\u2014") + "</div></div>",
    '<div class="info-group"><label>Itens (Materiais/Servi\u00e7os)</label><div>' + safeText(contract.itens || "\u2014") + "</div></div>",
    '<div class="grid-2">',
    '<div class="info-group"><label>Unidade Vinculada</label><div>' + safeText(node?.name || "\u2014") + "</div></div>",
    '<div class="info-group"><label>Vig\u00eancia Original</label><div>' + vigIni + " a " + vigFim + "</div></div>",
    "</div></div>",
    '<div class="grid-2">',
    '<div class="section">',
    '<h3 class="section-title">Empresa Contratada</h3>',
    '<div class="info-group"><label>Raz\u00e3o Social</label><div>' + safeText(contract.empresa || "\u2014") + "</div></div>",
    '<div class="info-group"><label>CNPJ</label><div>' + safeText(contract.cnpj || "\u2014") + "</div></div>",
    '<div class="info-group"><label>Contato</label><div>' + safeText(contract.contato || "\u2014") + "</div></div>",
    "</div>",
    '<div class="section">',
    '<h3 class="section-title">Aditivos</h3>',
    "<ul>" + aditivosHtml + "</ul>",
    "</div></div>",
    '<div class="section">',
    '<h3 class="section-title">Gest\u00e3o e Fiscaliza\u00e7\u00e3o</h3>',
    '<div class="grid-2"><div>',
    '<div class="person-card" style="border-left:3px solid #3b82f6">',
    '<p class="person-title" style="color:#1e40af">Gestor do Contrato</p>',
    "<p><b>Titular:</b> " + safeText(personMap.get(contract.gestor?.titularId)?.name || "\u2014") + "</p>",
    "<p><b>Suplente:</b> " + safeText(personMap.get(contract.gestor?.suplenteId)?.name || "\u2014") + "</p>",
    "</div></div>",
    "<div>" + fiscaisContratoHtml + fiscaisServicoHtml + "</div>",
    "</div></div>",
    "<script>setTimeout(function(){window.print()},800)</script>",
    "</body></html>"
  ].join("\n");

  w.document.write(html);
  w.document.close();
}


/**
 * Exporta lista de contratos para PDF (Layout Rich HTML).
 */
export function exportContractsPdf(contracts = [], options = {}) {
  const {
    title = "Relatório de Contratos",
    subtitle = "Lista de Contratos Cadastrados",
    logoUrl = "",
    nodes = [],
    personMap = new Map(),
    getContractStatus
  } = options;

  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Pop-up bloqueado. Permita pop-ups para exportar.");
  }

  function buildContractRow(c) {
    const node = nodes.find((n) => n.id === c.nodeId);
    const status = getContractStatus ? getContractStatus(c) : "";
    const statusLabel = status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido";
    const statusColor = status === "active" ? "#065f46" : status === "expiring" ? "#9a3412" : "#991b1b";
    const statusBg = status === "active" ? "#d1fae5" : status === "expiring" ? "#ffedd5" : "#fee2e2";
    const vigIni = c.dataInicio ? new Date(c.dataInicio + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";
    const vigFim = c.dataTermino ? new Date(c.dataTermino + "T12:00:00").toLocaleDateString("pt-BR") : "\u2014";

    const parts = [];
    parts.push("<tr>");
    parts.push('<td style="white-space:nowrap"><b>' + safeText(c.sei) + "</b>");
    parts.push(' <span style="display:block;font-size:10px;color:' + statusColor + ";background:" + statusBg + ';padding:2px 4px;border-radius:4px;font-weight:bold;margin-top:2px">' + statusLabel + "</span></td>");
    parts.push("<td><b>" + safeText(c.empresa || "\u2014") + "</b>");
    parts.push(' <span style="display:block;color:#64748b;font-size:10px;margin-top:2px">CNPJ: ' + safeText(c.cnpj || "\u2014") + "</span></td>");
    parts.push("<td>" + safeText(c.objeto) + "</td>");
    parts.push("<td>" + safeText(node?.name || "\u2014") + "</td>");
    parts.push('<td style="white-space:nowrap">' + vigIni + " a " + vigFim + "</td>");
    parts.push("<td>" + safeText(personMap.get(c.gestor?.titularId)?.name || "\u2014") + "</td>");
    parts.push("</tr>");
    return parts.join("");
  }

  const rowsHtml = contracts.map(buildContractRow).join("");

  const logoHtml = logoUrl ? '<img src="' + logoUrl + '" alt="Logo">' : "<div></div>";
  const dtNow = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");

  const html = [
    "<!DOCTYPE html><html><head>",
    "<title>" + safeText(title) + "</title>",
    "<style>",
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');",
    "body{font-family:'Inter',sans-serif;padding:40px;color:#1e293b;background:#fff;margin:0}",
    ".header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}",
    ".header img{height:55px;object-fit:contain}",
    ".header-titles h2{margin:0;font-size:24px;color:#0f172a;letter-spacing:-0.5px}",
    ".header-titles p{margin:6px 0 0;font-size:14px;color:#64748b}",
    ".meta{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:20px;background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0}",
    "table{width:100%;border-collapse:collapse;font-size:11px}",
    "th,td{border-bottom:1px solid #e2e8f0;padding:10px;text-align:left;vertical-align:top}",
    "th{background:#f1f5f9;font-weight:700;color:#334155;text-transform:uppercase;font-size:10px;border-top:1px solid #e2e8f0}",
    "tr:nth-child(even){background:#fafaf9}",
    "</style></head><body>",
    '<div class="header">' + logoHtml,
    '<div class="header-titles" style="text-align:right">',
    "<h2>" + safeText(title) + "</h2>",
    "<p>" + safeText(subtitle) + "</p>",
    "</div></div>",
    '<div class="meta">',
    "<span>Emiss\u00e3o: <b>" + dtNow + "</b></span>",
    "<span>Total de Contratos: <b>" + contracts.length + "</b></span>",
    "</div>",
    "<table><thead><tr>",
    "<th>SEI / Status</th><th>Empresa</th><th>Objeto</th><th>Unidade</th><th>Vig\u00eancia</th><th>Gestor Titular</th>",
    "</tr></thead>",
    "<tbody>" + rowsHtml + "</tbody></table>",
    "<script>setTimeout(function(){window.print()},800)</script>",
    "</body></html>"
  ].join("\n");

  w.document.write(html);
  w.document.close();
}

/**
 * Exporta a lista do organograma (subárvore) para CSV.
 */
export function exportOrgListCsv(nodes = [], options = {}) {
  const {
    filename = "organograma-lista.csv",
    isProtected = false,
    printFields = { responsavel: true, funcao: true, matricula: false, lotacao: true }
  } = options;

  const headers = ["Nível", "Sigla/Nome", "Descrição"];
  if (printFields.responsavel) headers.push("Responsável");
  if (printFields.funcao) headers.push("Função/Cargo");
  if (isProtected && printFields.matricula) headers.push("Matrícula");
  headers.push("Tipo", "Subtipo");
  if (printFields.lotacao) headers.push("Lotação");

  const rows = nodes.map(n => {
    const row = [n.depth || 0, n.name, n.description || ""];
    if (printFields.responsavel) row.push(n.responsavel || "");
    if (printFields.funcao) row.push(n.funcao || n.cargo || "");
    if (isProtected && printFields.matricula) row.push(n.matricula || "");
    row.push(n.tipo, n.subtipo || "principal");
    if (printFields.lotacao) row.push(n.lotacao || "");
    return row;
  });

  const csvContent = [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map(row => row.map(escapeCsvValue).join(";"))
  ].join("\n");

  downloadExcelCsvFile(filename, csvContent, {
    includeSeparatorHint: true,
    separator: ";"
  });
}

/**
 * Exporta a lista do organograma (subárvore) para PDF via impressão.
 * Agora utiliza um layout hierárquico idêntico à estrutura em tela.
 */
export function exportOrgListPdf(nodes = [], options = {}) {
  const {
    title = "Lista do Organograma",
    logoUrl = "",
    isProtected = false,
    printFields = { responsavel: true, funcao: true, matricula: false, lotacao: true }
  } = options;

  const w = window.open("", "_blank");
  if (!w) throw new Error("Pop-up bloqueado.");

  const contentHtml = nodes.map(n => {
    const depth = n.depth || 0;
    const indent = depth * 24;
    const isApoio = n.subtipo === "apoio";

    return `
      <div class="node-card" style="margin-left: ${indent}px; border-left: 4px solid ${isApoio ? '#f59e0b' : '#3b82f6'};">
        <div class="node-header">
          <div class="node-title">
            <span class="node-name">${n.name}</span>
            <span class="node-badge ${isApoio ? 'badge-apoio' : 'badge-est'}">${isApoio ? 'apoio' : 'estrutura'}</span>
          </div>
          <div class="node-desc">${n.description || ""}</div>
        </div>
        <div class="node-footer">
          ${printFields.responsavel ? `<div class="node-item"><strong>Responsável:</strong> ${n.responsavel || "—"}</div>` : ""}
          ${printFields.funcao ? `<div class="node-item"><strong>Função/Cargo:</strong> ${n.funcao || n.cargo || "—"}</div>` : ""}
          ${isProtected && printFields.matricula ? `<div class="node-item"><strong>Matrícula:</strong> ${n.matricula || "—"}</div>` : ""}
          ${printFields.lotacao ? `<div class="node-item"><strong>Lotação:</strong> ${n.lotacao || "—"}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  const dtNow = new Date().toLocaleString("pt-BR");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
  .header img { height: 50px; }

  .node-card { background: #fff; border-radius: 12px; padding: 14px 20px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; page-break-inside: avoid; }
  .node-header { margin-bottom: 10px; }
  .node-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .node-name { font-weight: 800; font-size: 13px; color: #0f172a; text-transform: uppercase; letter-spacing: -0.01em; }
  .node-badge { font-size: 8px; font-weight: 800; text-transform: uppercase; padding: 2px 10px; border-radius: 20px; }
  .badge-est { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
  .badge-apoio { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .node-desc { font-size: 11px; color: #64748b; font-weight: 500; }

  .node-footer { display: flex; flex-wrap: wrap; gap: 20px; border-top: 1px solid #f1f5f9; padding-top: 10px; font-size: 10px; color: #475569; }
  .node-item { min-width: 140px; }
  .node-item strong { color: #94a3b8; font-size: 8px; text-transform: uppercase; display: block; margin-bottom: 2px; }

  @media print {
    body { padding: 0; background: #fff; }
    .header { border: none; border-bottom: 2px solid #000; border-radius: 0; padding: 10px 0; }
    .node-card { border: 1px solid #ddd; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : '<div></div>'}
    <div style="text-align:right">
      <h2 style="margin:0; font-size: 18px; color: #0f172a; font-weight: 800;">${title}</h2>
      <p style="margin:4px 0; color:#64748b; font-size: 11px; font-weight: 600;">Relatório de Estrutura Organizográfica</p>
      <p style="margin:0; color:#94a3b8; font-size: 9px;">Data de Emissão: ${dtNow}</p>
    </div>
  </div>
  <div class="nodes-container">
    ${contentHtml}
  </div>
  <script>setTimeout(() => window.print(), 800);</script>
</body>
</html>`);
  w.document.close();
}
