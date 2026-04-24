import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  FolderTree, Search, KeyRound, ShieldCheck, Download, Upload,
  Pencil, Trash2, Users, Building2, ClipboardList, Briefcase,
  Home, Plus, GitBranchPlus, Save, Mail, Phone, Car, Wrench, X, Menu, LogOut,
  ImagePlus, List, Network, MapPin, ChevronRight, ChevronDown, ChevronUp, ChevronsDown, Undo2, FileText, Printer, PieChart, CloudUpload, MessageCircle, Package, ArrowUp,
  AlertTriangle, Info, Calendar, History, User, ChevronLeft, Eye, EyeOff, AlertCircle, Settings, Siren
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { OrgBranch } from "./components/OrgNode";
import { seedNodes, seedAssets, seedPersons, seedContracts, seedAssetTypes } from "./data/seedData";
import {
  makeId, initials, sortNodes, downloadFile, toCsv,
  getDescendantIds, getParentChain, fileToBase64,
  normalizeHex, DEFAULT_ROOT_COLOR, computeNodeColor
} from "./utils/helpers";
import { supabase } from "./lib/supabase";

const STORAGE_KEY = "dmae-orgchart-v16";
const DEMO_USER = "admin";
const DEMO_PASS = "dmae123";

const emptyNode = {
  id: "", parentId: "", name: "", description: "", funcao: "", responsavel: "", matricula: "",
  unidade: "DMAE", lotacao: "", complemento: "", tipo: "estrutura", subtipo: "subordinada",
  email: "", telefone: "", ramal: "", foto: "", observacoes: "", tags: "", color: "",
  personId: "",
};
const emptyPerson = {
  id: "", name: "", matricula: "", cargo: "", email: "", telefone: "", ramal: "",
  regime: "", vinculo: "", foto: "", contracts: []
};
const emptyAsset = {
  id: "",
  nodeId: "",
  category: "veículo",
  type: "",
  name: "",

  manufacturer: "",
  model: "",
  year: "",
  plate: "",
  patrimonio: "",
  os: "",
  notes: "",

  tipoVinculo: "Próprio",

  isEmergency: false,
  isMaintenance: false,
  maintenanceNotes: "",
  maintenanceSince: "",

  numeroContrato: "",
  empresaContratada: "",
  cnpjContratada: "",
  fiscalContrato: "",
  matriculaFiscal: "",
  contatoFiscal: "",
  linkContrato: "",
  obsContrato: "",

  contatoFone: "",
  contatoAcionamento: "",
  contatoResponsavel: "",

  photos: []
};
const emptyContract = {
  id: "",
  nodeId: "",
  sei: "",
  tipo: "",
  objeto: "",
  itens: "",
  empresa: "",
  cnpj: "",
  contato: "",
  dataInicio: "",
  dataTermino: "",
  valorTotal: "",
  status: "Ativo",
  aditivos: [],
  gestor: { titularId: "", suplenteId: "" },
  fiscaisContrato: [{ titularId: "", suplenteId: "" }],
  fiscaisServico: [{ titularId: "", suplenteId: "" }],
  fiscaisAdministrativos: []
};

function assetIcon(c) {
  if (c === "veículo") return <Car size={12} />;
  if (c === "ferramenta") return <Wrench size={12} />;
  return <Briefcase size={12} />;
}

/* --- Contract Helper --- */
function getContractStatus(c) {
  if (!c.dataTermino) return "active";
  const end = new Date(c.dataTermino + "T00:00:00");
  const diffDays = (end - new Date()) / (1000 * 3600 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "active";
}

function getDashboardStats(contractList) {
  let active = 0, expiring = 0, expired = 0;
  contractList.forEach(c => {
    const status = getContractStatus(c);
    if (status === "expired") expired++;
    else if (status === "expiring") expiring++;
    else active++;
  });
  const total = active + expiring + expired;
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const expiringPct = total > 0 ? (expiring / total) * 100 : 0;
  const pieCss = total > 0 
    ? `conic-gradient(#10b981 0% ${activePct}%, #f97316 ${activePct}% ${activePct + expiringPct}%, #ef4444 ${activePct + expiringPct}% 100%)`
    : `conic-gradient(#e5e7eb 0% 100%)`;
    
  return { active, expiring, expired, total, pieCss };
}

/* --- PDF/Print export --- */
function exportAssetsPdf(list, label, getPath) {
  const w = window.open("", "_blank");
  if (!w) { showSystemAlert("Permita pop-ups para exportar.", { title: "Atenção", type: "warning" }); return; }
  const rows = list.map((a) =>
    `<tr><td>${a.category}</td><td>${a.name}</td><td>${a.manufacturer || ""}</td><td>${a.model || ""}</td><td>${a.year || ""}</td><td>${a.plate || ""}</td><td>${a.patrimonio || ""}</td><td>${getPath(a.nodeId)}</td></tr>`
  ).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>Ativos - ${label}</title>
<style>body{font-family:Inter,sans-serif;padding:20px}h2{margin-bottom:12px}table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f1f5f9;font-weight:700}</style></head>
<body><h2>Ativos — ${label}</h2><p>${list.length} item(ns)</p>
<table><tr><th>Cat.</th><th>Nome</th><th>Fab.</th><th>Modelo</th><th>Ano</th><th>Placa</th><th>Pat.</th><th>Estr.</th></tr>${rows}</table>
<script>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  w.document.close();
}

function exportLogsPdf(logsList) {
  const w = window.open("", "_blank");
  if (!w) { showSystemAlert("Permita pop-ups para exportar.", { title: "Atenção", type: "warning" }); return; }
  const rows = logsList.map((lg) =>
    `<tr><td>${lg.timestamp}</td><td><b>${lg.user}</b></td><td><span style="padding:2px 6px;background:#f1f5f9;border-radius:4px;font-size:10px">${lg.action}</span></td><td>${lg.target}</td></tr>`
  ).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>Logs de Sistema - Auditoria</title>
<style>body{font-family:Inter,sans-serif;padding:20px;color:#0f172a}h2{margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;}
th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left}th{background:#f8fafc;font-weight:700}</style></head>
<body><h2>Registro de Auditoria do Sistema</h2><p style="color:#64748b;font-size:14px;margin:0;">Total de eventos arquivados: ${logsList.length}</p>
<table><tr><th>Data/Hora</th><th>Operador</th><th>Ação do Sistema</th><th>Alvo/Detalhe</th></tr>${rows}</table>
<script>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  w.document.close();
}

function generateDirectPdf(logsList) {
  if (typeof window.html2pdf === "undefined") {
    showSystemAlert("Carregador PDF indisponível no momento. Usando módulo de impressão.", { title: "Atenção", type: "warning" });
    exportLogsPdf(logsList);
    return;
  }
  const rows = logsList.map((lg) =>
    `<tr>
      <td style="border:1px solid #cbd5e1;padding:8px;white-space:nowrap;">${lg.timestamp}</td>
      <td style="border:1px solid #cbd5e1;padding:8px;"><b>${lg.user}</b></td>
      <td style="border:1px solid #cbd5e1;padding:8px;"><span style="font-size:10px">${lg.action}</span></td>
      <td style="border:1px solid #cbd5e1;padding:8px;width:100%">${lg.target}</td>
    </tr>`
  ).join("");
  const content = document.createElement("div");
  content.innerHTML = `<div style="font-family:Inter,sans-serif;padding:20px;">
    <h2 style="margin-bottom:8px;color:#0f172a;">Registro de Auditoria do Sistema</h2>
    <p style="color:#64748b;font-size:14px;margin:0;">Total de eventos apurados: ${logsList.length}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:16px;">
      <thead>
        <tr>
          <th style="border:1px solid #cbd5e1;padding:8px;background:#f8fafc;text-align:left;">Data/Hora</th>
          <th style="border:1px solid #cbd5e1;padding:8px;background:#f8fafc;text-align:left;">Operador</th>
          <th style="border:1px solid #cbd5e1;padding:8px;background:#f8fafc;text-align:left;">Ação</th>
          <th style="border:1px solid #cbd5e1;padding:8px;background:#f8fafc;text-align:left;">Detalhe</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
  const opt = {
    margin: 10,
    filename: 'auditoria-logs.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  window.html2pdf().set(opt).from(content).save();
}

function exportLogsCsv(logsList) {
  const rows = [["Data/Hora", "Operador", "Acao", "Detalhes"], ...logsList.map((lg) => [lg.timestamp, lg.user, lg.action, lg.target])];
  downloadFile(`auditoria-logs.csv`, toCsv(rows), "text/csv;charset=utf-8;");
}

/* --- List View Component --- */
function ListNode({ node, getChildren, onSelect, directEmergencyCount, directMaintenanceCount, depth = 0, isProtected, parentHex, expandedSet, onToggleExpandAll }) {
  const nodeColor = computeNodeColor(node, parentHex);
  const [open, setOpen] = useState(depth < 2);

  useEffect(() => {
    if (expandedSet?.has(node.id)) setOpen(true);
  }, [expandedSet, node.id]);

  const ch = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const hasChildren = ch.length > 0;
  const isApoio = node.subtipo === "apoio";
  const emergencyCount = directEmergencyCount(node.id);

  return (
    <div className={`list-node ${open ? "expanded" : ""}`} style={{ 
      marginLeft: depth > 0 ? 16 : 0,
      borderLeft: `3px solid ${nodeColor.baseHex}`,
      paddingLeft: 8,
      marginBottom: 2
    }}>
      <div className="list-node-header" onClick={() => onSelect(node.id)}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {hasChildren ? (
            <button className="list-collapse-icon" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} title={open ? "Recolher" : "Expandir"}>
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : <div style={{ width: 20 }} />}
          
          {hasChildren && !open && (
             <button className="list-collapse-icon" style={{ opacity: 0.6 }} onClick={(e) => { 
               e.stopPropagation(); 
               const ids = getDescendantIds(node.id, getChildren);
               onToggleExpandAll(ids);
             }} title="Expandir Tudo Abaixo">
               <ChevronsDown size={12} />
             </button>
          )}
        </div>
        <div className="av" style={{ width: 28, height: 28, minWidth: 28, borderRadius: 6, cursor: node.foto ? "zoom-in" : "default" }} onClick={(e) => { if (node.foto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: node.foto })); } }}>
          {node.foto ? <img src={node.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 9 }}>{initials(node.name)}</span>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{node.name}</div>
          <div style={{ fontSize: 10, color: "var(--n500)" }}>
            {node.description && <span style={{ display: "block", marginBottom: 2 }}>{node.description}</span>}
            <span style={{ opacity: 0.8 }}>{node.responsavel || node.cargo}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {isProtected && emergencyCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)", flexShrink: 0 }} title="Possui ativos de Contingência">
              <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
            </div>
          )}
          {isProtected && directMaintenanceCount && directMaintenanceCount(node.id) > 0 && (
            <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", flexShrink: 0, color: "#d97706" }} title="Possui ativos em Manutenção">
              <AlertTriangle size={12} strokeWidth={3} />
            </div>
          )}
          <span className={`badge ${isApoio ? "badge-apoio" : "badge-sec"}`} style={{ flexShrink: 0 }}>
            {isApoio ? "apoio" : node.tipo}
          </span>
        </div>
        {hasChildren && <span className="badge badge-out">{ch.length}</span>}
      </div>
      {open && hasChildren && (
        <div className="list-children">
          {ch.map((c) => <ListNode key={c.id} node={c} getChildren={getChildren} onSelect={onSelect} directEmergencyCount={directEmergencyCount} directMaintenanceCount={directMaintenanceCount} depth={depth + 1} isProtected={isProtected} parentHex={nodeColor.baseHex} expandedSet={expandedSet} onToggleExpandAll={onToggleExpandAll} />)}
        </div>
      )}
    </div>
  );
}

/* --- Node Selector (Typeahead de Unidade Vinculada) --- */
function NodeSelector({ value, nodes, onChange }) {
  const currentNode = nodes.find(n => n.id === value);
  const [search, setSearch] = useState(currentNode?.name || "");
  const [open, setOpen] = useState(false);

  const filtered = nodes
    .filter(n => n.tipo === "estrutura")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .filter(n => !search || n.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 12);

  React.useEffect(() => {
    const node = nodes.find(n => n.id === value);
    if (node && !open) setSearch(node.name);
    if (!value && !open) setSearch("");
  }, [value, nodes]);

  return (
    <div style={{ position: "relative" }}>
      <input
        className="fi"
        value={search}
        placeholder="Buscar unidade..."
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--n200)", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", zIndex: 200, maxHeight: 220, overflowY: "auto" }}>
          <button type="button" onMouseDown={() => { onChange(""); setSearch(""); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "var(--n400)", borderBottom: "1px solid var(--n100)" }}>
            (Nenhuma)
          </button>
          {filtered.map(n => (
            <button key={n.id} type="button"
              onMouseDown={() => { onChange(n.id); setSearch(n.name); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: value === n.id ? "var(--n100)" : "none", cursor: "pointer", fontSize: 12, fontWeight: value === n.id ? 700 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--n50)"}
              onMouseLeave={e => e.currentTarget.style.background = value === n.id ? "var(--n100)" : "none"}
            >{n.name}</button>
          ))}
          {filtered.length === 0 && <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--n400)" }}>Nenhuma unidade encontrada</div>}
        </div>
      )}
    </div>
  );
}

/* --- Person Selector Component --- */
function PersonSelector({
  label,
  valueId,
  persons,
  nodes = [],
  onSelect,
  onClear,
  onAddNew,
  currentNodeId = "",
  enforceNodeOccupation = true
}) {
  const [q, setQ] = useState("");
  const person = persons.find(p => p.id === valueId);

  const getOccupation = (pid) => {
    if (!enforceNodeOccupation) return null;
    return nodes.find((n) => n.personId === pid && n.id !== currentNodeId);
  };

  const isOccupied = (pid) => Boolean(getOccupation(pid));

  return (
    <div className="fg" style={{ position: "relative" }}>
      <label className="fl">{label}</label>
      {person ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--n50)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--n200)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{person.name}</div>
              <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {person.matricula} • {person.cargo}</div>
          </div>
          <button type="button" className="btn btn-outline btn-xs btn-icon" onClick={onClear} title="Remover"><X size={10} /></button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input className="fi" placeholder="Buscar por nome ou matrícula..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--n400)" }}><Search size={12} /></div>
          {q.length > 1 && (
            <div className="search-drop" style={{ top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 100 }}>
              {(() => {
                const filtered = persons.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.matricula.includes(q)).slice(0, 10);
                return (
                  <>
                    {filtered.map(p => {
                      const occupiedNode = getOccupation(p.id);
                      const occupied = Boolean(occupiedNode);
                      return (
                          <button
                            key={p.id}
                            type="button"
                            className="search-item"
                            disabled={occupied}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (occupied) return;
                              onSelect(p.id);
                              setQ("");
                            }}
                            style={{
                              opacity: occupied ? 0.45 : 1,
                              cursor: occupied ? "not-allowed" : "pointer",
                              border: occupied ? "1px solid #fecaca" : "none"
                            }}
                          >
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                              <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {p.matricula} • {p.cargo}</div>
                            </div>
                            {occupied && (
                              <span
                                style={{
                                  fontSize: 8,
                                  fontWeight: 800,
                                  color: "#ef4444",
                                  textTransform: "uppercase"
                                }}
                              >
                                Ocupado em {occupiedNode?.name || "outra caixa"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {filtered.length === 0 && onAddNew && (
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); setQ(""); onAddNew(q); }} className="search-item" style={{ color: "var(--primary)", justifyContent: "center", borderTop: "1px solid var(--n200)" }}>
                        <b>Pessoa não encontrada. Clique aqui para cadastrar "{q}"</b>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fixMojibakeText(value) {
  if (typeof value !== "string") return value;
  // Corrige sequencias UTF-8 lidas incorretamente como Latin-1 (mojibake)
  const replacements = {
    // Minusculas
    "\u00C3\u00A1": "\u00E1", // á
    "\u00C3\u00A0": "\u00E0", // à
    "\u00C3\u00A2": "\u00E2", // â
    "\u00C3\u00A3": "\u00E3", // ã
    "\u00C3\u00A9": "\u00E9", // é
    "\u00C3\u00AA": "\u00EA", // ê
    "\u00C3\u00AD": "\u00ED", // í
    "\u00C3\u00B3": "\u00F3", // ó
    "\u00C3\u00B4": "\u00F4", // ô
    "\u00C3\u00B5": "\u00F5", // õ
    "\u00C3\u00BA": "\u00FA", // ú
    "\u00C3\u00A7": "\u00E7", // ç
    // Maiusculas
    "\u00C3\u0081": "\u00C1", // Á
    "\u00C3\u0080": "\u00C0", // À
    "\u00C3\u0082": "\u00C2", // Â
    "\u00C3\u0083": "\u00C3", // Ã
    "\u00C3\u0089": "\u00C9", // É
    "\u00C3\u008A": "\u00CA", // Ê
    "\u00C3\u008D": "\u00CD", // Í
    "\u00C3\u0093": "\u00D3", // Ó
    "\u00C3\u0094": "\u00D4", // Ô
    "\u00C3\u0095": "\u00D5", // Õ
    "\u00C3\u009A": "\u00DA", // Ú
    "\u00C3\u0087": "\u00C7", // Ç
    // Outros
    "\u00C2\u00BA": "\u00BA", // º
    "\u00C2\u00AA": "\u00AA", // ª
    "\u00C2\u00B0": "\u00B0", // °
    // Tipografia
    "\u00E2\u0080\u0094": "\u2014", // —
    "\u00E2\u0080\u0093": "\u2013", // –
    "\u00E2\u0080\u00A2": "\u2022", // •
    "\u00E2\u0080\u009C": "\u201C", // “
    "\u00E2\u0080\u009D": "\u201D", // ”
    "\u00E2\u0080\u0098": "\u2018", // ‘
    "\u00E2\u0080\u0099": "\u2019", // ’
    "\u00E2\u0080\u00A6": "\u2026", // …
  };
  let out = value;
  Object.entries(replacements).forEach(([bad, good]) => {
    out = out.split(bad).join(good);
  });
  return out;
}

function normalizeDeep(value) {
  if (Array.isArray(value)) return value.map(normalizeDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeDeep(v)])
    );
  }
  return fixMojibakeText(value);
}

function SystemAlertModal({ alert, onClose }) {
  if (!alert) return null;

  const isError = alert.type === "error";
  const isSuccess = alert.type === "success";
  const isWarning = alert.type === "warning";

  return (
    <div className="modal-overlay" style={{ zIndex: 5000 }}>
      <div className="modal-content narrow system-alert-modal">
        <div className="modal-header">
          <h2>
            {isError ? "Erro" : isSuccess ? "Concluído" : alert.title || "Atenção"}
          </h2>
          <p>
            {isError
              ? "Não foi possível concluir a operação."
              : isSuccess
                ? "Operação concluída."
                : "Verifique as informações abaixo antes de continuar."}
          </p>
        </div>

        <div className="modal-body">
          <div className={`system-alert-box ${isError ? "error" : isSuccess ? "success" : "warning"}`}>
            <div className="system-alert-icon">
              {isError ? <AlertTriangle size={22} /> : isSuccess ? <ShieldCheck size={22} /> : <Info size={22} />}
            </div>

            <div className="system-alert-text">
              <div className="system-alert-title">
                {alert.title || (isError ? "Erro" : isSuccess ? "Concluído" : "Atenção")}
              </div>

              <div className="system-alert-message">
                {String(alert.message || "")
                  .split("\n")
                  .map((line, idx) => (
                    <p key={idx} style={{ margin: "0 0 6px" }}>{line}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            autoFocus
          >
            {alert.confirmText || "OK, entendi"}
          </button>
        </div>
      </div>
    </div>
  );
}


function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  if (!dialog) return null;

  const isDanger = dialog.type === "danger";

  return (
    <div className="modal-overlay" style={{ zIndex: 5200 }}>
      <div className="modal-content narrow system-alert-modal">
        <div className="modal-header">
          <h2>{dialog.title || "Confirmar ação"}</h2>
          <p>{dialog.subtitle || "Confirme antes de continuar."}</p>
        </div>

        <div className="modal-body" style={{ marginTop: 0 }}>
          <div className={`system-alert-box ${isDanger ? "error" : "warning"}`} style={{ border: "none", background: "none", padding: 0 }}>
            <div className="system-alert-icon" style={{ background: isDanger ? "#fee2e2" : "#fefce8", color: isDanger ? "#ef4444" : "#eab308" }}>
              {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
            </div>

            <div className="system-alert-text">
              <div className="system-alert-title" style={{ color: "var(--n800)" }}>
                {dialog.title || "Confirmar ação"}
              </div>

              <div className="system-alert-message" style={{ color: "var(--n600)" }}>
                {String(dialog.message || "")
                  .split("\n")
                  .map((line, idx) => (
                    <p key={idx} style={{ marginBottom: 4 }}>{line}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--n100)", paddingTop: 16 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={isDanger ? "btn btn-danger btn-xs" : "btn btn-primary btn-xs"}
            onClick={onConfirm}
            autoFocus
          >
            {dialog.confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─€─€─€─€ APP ─€─€─€─€ */
export default function App() {
  const [nodes, setNodes] = useState(() => supabase ? [] : seedNodes);
  const [assets, setAssets] = useState(() => supabase ? [] : seedAssets);
  const [persons, setPersons] = useState(() => supabase ? [] : seedPersons);
  const [contracts, setContracts] = useState(() => supabase ? [] : seedContracts);
  const [toast, setToast] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);
  const showSystemAlert = useCallback((message, options = {}) => {
    setSystemAlert({
      title: options.title || "Atenção",
      message: normalizeDeep(message),
      type: options.type || "warning",
      confirmText: options.confirmText || "OK, entendi",
      onConfirm: options.onConfirm || null
    });
  }, []);

  const closeSystemAlert = useCallback(() => {
    setSystemAlert((currentAlert) => {
      if (typeof currentAlert?.onConfirm === "function") {
        setTimeout(() => currentAlert.onConfirm(), 0);
      }
      return null;
    });
  }, []);

  const flash = useCallback((msg, options = {}) => {
    showSystemAlert(msg, options);
  }, [showSystemAlert]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(Boolean(supabase));

  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "list"
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [query, setQuery] = useState("");
  const [qFocused, setQFocused] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(null); 
  const [showContractDetail, setShowContractDetail] = useState(null); 
  const [openNodeDlg, setOpenNodeDlg] = useState(false);
  const [assetTypes, setAssetTypes] = useState(seedAssetTypes);
  const [assetTypeForm, setAssetTypeForm] = useState({ id: "", category: "", name: "" });
  const [editAssetTypeId, setEditAssetTypeId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [personFilter, setPersonFilter] = useState("");
  const [openAssetDlg, setOpenAssetDlg] = useState(false);
  const [openPersonDlg, setOpenPersonDlg] = useState(false); 
  const [registryFilter, setRegistryFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [openContractDlg, setOpenContractDlg] = useState(false);
  const [openLoginDlg, setOpenLoginDlg] = useState(false);
  const [editNodeId, setEditNodeId] = useState(null);
  const [editAssetId, setEditAssetId] = useState(null);
  const [editPersonId, setEditPersonId] = useState(null);
  const [editContractId, setEditContractId] = useState(null);
  const [nodeForm, setNodeForm] = useState(emptyNode);
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [personForm, setPersonForm] = useState(emptyPerson);
  const [contractForm, setContractForm] = useState(emptyContract);
  const [dashboardView, setDashboardView] = useState("summary"); // "summary" | "assets" | "people" | "structures"
  const [assetTableFilter, setAssetTableFilter] = useState({ type: "all", category: "all", search: "", emergencyOnly: false });
  const [peopleTableFilter, setPeopleTableFilter] = useState({ search: "", role: "all" });
  const [structureTableFilter, setStructureTableFilter] = useState({ type: "all", search: "" });
  const [showAssetContractModal, setShowAssetContractModal] = useState(null); // id of asset to show contract
  const [deleteRequest, setDeleteRequest] = useState(null); // { type, id, name }

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("checking"); // "online" | "offline" | "checking"

  // --- SUPABASE CLOUD DATA LOAD (PAGINATED) ---
  const fetchAll = async (tableName) => {
    let allData = [];
    let from = 0;
    let to = 999;
    let finished = false;
    while (!finished) {
      const { data, error } = await supabase.from(tableName).select('*').range(from, to);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < 1000) finished = true;
        else { from += 1000; to += 1000; }
      } else { finished = true; }
    }
    return allData;
  };

  const loadCloudData = useCallback(async () => {
    if (!supabase) { setCloudStatus("offline"); setIsLoadingCloud(false); return; }
    try {
      setCloudStatus("checking");
      const [nData, pData, aData, cData, uData, tData] = await Promise.all([
        fetchAll('nodes'), fetchAll('persons'), fetchAll('assets'), fetchAll('contracts'), fetchAll('users'), fetchAll('asset_types')
      ]);
      setCloudStatus("online");
      setNodes(normalizeDeep(nData || []));
      setPersons(normalizeDeep((pData || []).map(p => ({ ...p, email: p.email || "", telefone: p.telefone || "", ramal: p.ramal || "" }))));
       setAssets(normalizeDeep((aData || []).map(a => ({
            ...a,

            nodeId: a.node_id || a.nodeId || "",

            tipoVinculo: a.tipo_vinculo || a.tipoVinculo || "Próprio",
            isEmergency: a.is_emergency ?? a.isEmergency ?? false,

            isMaintenance: a.is_maintenance ?? a.isMaintenance ?? false,
            maintenanceNotes: a.maintenance_notes || a.maintenanceNotes || "",
            maintenanceSince: a.maintenance_since || a.maintenanceSince || "",

            numeroContrato: a.numero_contrato || a.numeroContrato || "",
            empresaContratada: a.empresa_contratada || a.empresaContratada || "",
            cnpjContratada: a.cnpj_contratada || a.cnpjContratada || "",

            contatoFone: a.contato_fone || a.contatoFone || "",
            contatoAcionamento: a.contato_acionamento || a.contatoAcionamento || "",
            contatoResponsavel: a.contato_responsavel || a.contatoResponsavel || "",

            fiscalContrato: a.fiscal_contrato || a.fiscalContrato || "",
            matriculaFiscal: a.matricula_fiscal || a.matriculaFiscal || "",

            photos: a.photos || []
       }))));
      setUsers(normalizeDeep(uData || []));
       setContracts(normalizeDeep((cData || []).map(c => ({
            ...c,
            nodeId: c.node_id || c.nodeId || "",
            dataInicio: c.data_inicio || c.dataInicio || "",
            dataTermino: c.data_fim || c.dataTermino || "",
            valorTotal: c.valor_total ?? c.valorTotal ?? "",
            status: c.status || "Ativo",
            gestor: c.gestor || { titularId: "", suplenteId: "" },
            fiscaisContrato: c.fiscais_contrato || c.fiscaisContrato || [],
            fiscaisServico: c.fiscais_servico || c.fiscaisServico || [],
            fiscaisAdministrativos: c.fiscais_administrativos || c.fiscaisAdministrativos || [],
            aditivos: c.aditivos || [],
            empresa: c.empresa || "",
            cnpj: c.cnpj || "",
            contato: c.contato || "",
            itens: c.itens || "",
            objeto: c.objeto || "",
            sei: c.sei || ""
       }))));
       setAssetTypes((tData && tData.length > 0) ? tData : seedAssetTypes);
      console.log(`✅ Cloud Sync: ${pData.length} pessoas carregadas.`);
    } catch (e) {
      console.error("Cloud load error:", e);
      setCloudStatus("offline");
      setNodes(seedNodes);
      setAssets(seedAssets);
      setPersons(seedPersons);
      setContracts(seedContracts);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCloudData();
  }, [loadCloudData]);

  // --- INITIAL CLOUD SYNC METHOD (ULTRA-RESILIENT) ---
  const syncToCloud = async () => {
    if (!supabase) { showSystemAlert("Configuração do Supabase não encontrada no .env", { title: "Configuração ausente", type: "error" }); return; }
    if (!confirm("EXECUTAR SINCRONIZAÇÃO MESTRE?\n\nIsso enviará todos os dados originais (Pessoas, Estruturas e Contratos) para a nuvem. Use isso para popular o banco de dados pela primeira vez.")) return;
    setIsCloudSyncing(true);
    
    const chunkArray = (arr, size) => {
      const res = [];
      for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
      return res;
    };

    try {
      // Use state data, but fallback to seedData if state is empty
      const dataToSync = {
        p: persons.length > 5 ? persons : seedPersons,
        n: nodes.length > 5 ? nodes : seedNodes,
        a: assets.length > 0 ? assets : seedAssets,
        c: contracts.length > 0 ? contracts : seedContracts
      };

      console.log("🚀 Iniciando Sincronização Mestre...", dataToSync);

      // 1. Persons
      if (dataToSync.p.length > 0) {
        console.log(`- Subindo ${dataToSync.p.length} pessoas...`);
        const chunks = chunkArray(dataToSync.p, 50);
        for (let i = 0; i < chunks.length; i++) {
          const { error } = await supabase.from('persons').upsert(chunks[i]);
          if (error) throw new Error(`Lote ${i+1} Pessoas: ` + error.message);
          console.log(`  [Pessoas] Lote ${i+1}/${chunks.length} ok`);
        }
      }

      // 2. Nodes
      if (dataToSync.n.length > 0) {
        console.log(`- Subindo ${dataToSync.n.length} estruturas...`);
        const chunks = chunkArray(dataToSync.n.map(n => ({...n, atribuicoes: n.atribuicoes || ""})), 50);
        for (let i = 0; i < chunks.length; i++) {
          const { error } = await supabase.from('nodes').upsert(chunks[i]);
          if (error) throw new Error(`Lote ${i+1} Nodes: ` + error.message);
          console.log(`  [Nodes] Lote ${i+1}/${chunks.length} ok`);
        }
      }

      // 3. Assets
      if (dataToSync.a.length > 0) {
        console.log(`- Subindo ${dataToSync.a.length} ativos...`);
        const chunks = chunkArray(dataToSync.a, 50);
        for (let i = 0; i < chunks.length; i++) {
          const { error } = await supabase.from('assets').upsert(chunks[i]);
          if (error) throw new Error(`Lote ${i+1} Assets: ` + error.message);
          console.log(`  [Assets] Lote ${i+1}/${chunks.length} ok`);
        }
      }

      // 4. Contracts
      if (dataToSync.c.length > 0) {
        console.log(`- Subindo ${dataToSync.c.length} contratos...`);
        const dbC = dataToSync.c.map(c => ({
           id: c.id, sei: c.sei, tipo: c.tipo, objeto: c.objeto,
           empresa: c.empresa, cnpj: c.cnpj, contato: c.contato,
           data_inicio: c.dataInicio || c.dataInício || c.vigencia_inicio, 
           data_fim: c.dataTermino || c.vigencia_fim,
           gestor: c.gestor, aditivos: c.aditivos || [],
           fiscais_contrato: c.fiscaisContrato, fiscais_servico: c.fiscaisServico
        }));
        const chunks = chunkArray(dbC, 50);
        for (let i = 0; i < chunks.length; i++) {
          const { error } = await supabase.from('contracts').upsert(chunks[i]);
          if (error) throw new Error(`Lote ${i+1} Contratos: ` + error.message);
          console.log(`  [Contratos] Lote ${i+1}/${chunks.length} ok`);
        }
      }
      
      showSystemAlert("✅ SINCRONIZAÇÃO MESTRE CONCLUÍDA!\n\nTodos os dados foram enviados para a nuvem. Verifique o Table Editor do Supabase.", { title: "Sincronização concluída", type: "success" });
      window.location.reload(); // Hard refresh to see cloud data
    } catch (err) {
      console.error("ERRO CRÍTICO NA SINCRONIZAÇÃO:", err);
      showSystemAlert("ERRO CRÍTICO NA SINCRONIZAÇÃO: " + err.message, { title: 'Erro', type: 'error' });
    }
    setIsCloudSyncing(false);
  };
  const [expandedImage, setExpandedImage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardNodeId, setDashboardNodeId] = useState(null);

  const [canEdit, setCanEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  // Super-Admin Safeguard: recognies role OR the hardcoded username 'admin'
  const [openAssetTypesDlg, setOpenAssetTypesDlg] = useState(false);
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  const isProtected = !!currentUser;
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [openLogsDlg, setOpenLogsDlg] = useState(false);
  const [openStatsDlg, setOpenStatsDlg] = useState(false);
  const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 5) + 4);
  const [openUsersDlg, setOpenUsersDlg] = useState(false);
  const [openPasswordDlg, setOpenPasswordDlg] = useState(false);
  const [forcePassMode, setForcePassMode] = useState(false);
  const [openAssetRegistryDlg, setOpenAssetRegistryDlg] = useState(false);
  const [viewAssetId, setViewAssetId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [resetConfirmUser, setResetConfirmUser] = useState(null);
  const [resetSuccessInfo, setResetSuccessInfo] = useState(null);
  const [assetRegFilter, setAssetRegFilter] = useState({ search: "", vinculo: "all", category: "all", subType: "all", nodeId: "all", emergency: false, contractSearch: "" });
  const openAssetRegistry = useCallback(() => setOpenAssetRegistryDlg(true), []);

  // REAL-TIME PRESENCE (SUPABASE)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('online-presence', {
      config: {
        presence: {
          key: currentUser?.username || 'visitante-' + Math.random().toString(36).substring(2, 7),
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Count unique keys in presence state
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user: currentUser?.username || 'Public'
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, currentUser]);

  const logAction = async (action, type, name, details = {}) => {
    if (!supabase || !currentUser) return;
    try {
      await supabase.from('audit_logs').insert({
        user_name: currentUser.username,
        action,
        entity_type: type,
        entity_name: name,
        details
      });
      // Optionally fetch logs after action for admin
    } catch (e) { console.error("Log error:", e); }
  };

  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");

  const [pendingPersonNodeForm, setPendingPersonNodeForm] = useState(null);
  const [expandedSet, setExpandedSet] = useState(new Set()); // IDs forced to expand-all
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [zoom, setZoom] = useState(1);

  const vpRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const scrollStartPos = useRef({ x: 0, y: 0 });
  const [pendingEditNodeId, setPendingEditNodeId] = useState(null);

  // Persist
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      if (Array.isArray(p?.nodes) && p.nodes.length > 0) {
        setNodes(p.nodes);
        if (Array.isArray(p.assets)) setAssets(p.assets);
        if (Array.isArray(p.persons)) setPersons(p.persons);
        if (Array.isArray(p.contracts) && p.contracts.length > 0) setContracts(p.contracts);
        if (Array.isArray(p?.users) && p.users.length > 0) {
          // Normalize only for initial UI, will be overwritten by loadCloudData
          setUsers(p.users);
        }
        if (Array.isArray(p.logs)) setLogs(p.logs);
      }
    } catch { }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, assets, persons, contracts, users, logs })); }, [nodes, assets, persons, contracts, users, logs]);

  useEffect(() => {
    const handleOpenPhoto = (e) => setExpandedImage(e.detail);
    window.addEventListener('open-photo', handleOpenPhoto);
    return () => window.removeEventListener('open-photo', handleOpenPhoto);
  }, []);

  // Maps
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const personMap = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);
  const childrenMap = useMemo(() => {
    const m = new Map();
    nodes.forEach((n) => { const k = n.parentId || "root-parent"; if (!m.has(k)) m.set(k, []); m.get(k).push(n); });
    m.forEach((arr) => arr.sort(sortNodes));
    return m;
  }, [nodes]);

  const [logFilterStart, setLogFilterStart] = useState("");
  const [logFilterEnd, setLogFilterEnd] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter(lg => {
      if (!logFilterStart && !logFilterEnd) return true;
      let ts = 0;
      if (lg.timestamp.includes("/")) {
        const dmy = lg.timestamp.split(/[\s,]+/)[0].split("/");
        if (dmy.length === 3) ts = new Date(`${dmy[2]}-${dmy[1]}-${dmy[0]}T00:00:00`).getTime();
      } else if (lg.timestamp.includes("T")) {
        ts = new Date(lg.timestamp).getTime();
      }
      if (ts === 0) return true; // keep if parser fails

      if (logFilterStart) {
        const sTs = new Date(`${logFilterStart}T00:00:00`).getTime();
        if (ts < sTs) return false;
      }
      if (logFilterEnd) {
        const eTs = new Date(`${logFilterEnd}T23:59:59`).getTime();
        if (ts > eTs) return false;
      }
      return true;
    });
  }, [logs, logFilterStart, logFilterEnd]);

  const getChildren = useCallback((id) => childrenMap.get(id) || [], [childrenMap]);
  const rootNode = nodes.find((n) => !n.parentId);
  const dmaeNode = nodes.find((n) => n.name === 'DMAE' || n.id === 'node-root');

  const resolveAddress = useCallback((nodeId) => {
    let cur = nodeId ? nodeMap.get(nodeId) : null;
    while (cur) {
      if (cur.lotacao) return { lotacao: cur.lotacao, complemento: cur.complemento || "" };
      cur = cur.parentId ? nodeMap.get(cur.parentId) : null;
    }
    // Default to DMAE root if nothing found
    const root = nodes.find(n => !n.parentId);
    return { lotacao: root?.lotacao || "Rua 24 de Outubro, 200", complemento: root?.complemento || "" };
  }, [nodeMap, nodes]);

  const selected = selectedId ? nodeMap.get(selectedId) : null;
  const focused = focusId ? nodeMap.get(focusId) : rootNode;

  const currentSubtreeIds = useMemo(() => {
    const baseId = selectedId || focusId || rootNode?.id;
    if (!baseId) return new Set();
    const set = new Set([baseId]);
    const dIds = getDescendantIds(baseId, getChildren);
    dIds.forEach(id => set.add(id));
    return set;
  }, [selectedId, focusId, rootNode, getChildren]);

  const treeStats = useMemo(() => {
    let est = 0;
    const pessoasSet = new Set();
    let atv = 0;

    nodes.forEach(n => {
      if (currentSubtreeIds.has(n.id)) {
        if (n.tipo === "estrutura") est++;
        if (n.personId) {
          pessoasSet.add(n.personId);
        } else if (n.tipo === "pessoa" && n.nome !== "Nova Pessoa") {
          pessoasSet.add(`node-${n.id}`);
        }
      }
    });

    assets.forEach(a => {
      if (currentSubtreeIds.has(a.nodeId)) atv++;
    });

    return { totalEstruturas: est, totalPessoas: pessoasSet.size, totalAtivos: atv };
  }, [nodes, assets, currentSubtreeIds]);

  const assetsByNode = useMemo(() => {
    const m = new Map();
    assets.forEach((a) => { if (!m.has(a.nodeId)) m.set(a.nodeId, []); m.get(a.nodeId).push(a); });
    return m;
  }, [assets]);

  const directAssetCount = useCallback((nid) => (assetsByNode.get(nid) || []).length, [assetsByNode]);
  const directEmergencyCount = useCallback((nid) => (assetsByNode.get(nid) || []).filter(a => a.isEmergency).length, [assetsByNode]);
  const directMaintenanceCount = useCallback((nid) => (assetsByNode.get(nid) || []).filter(a => a.isMaintenance).length, [assetsByNode]);
  const directEmergencyMaintenanceCount = useCallback((nid) => (assetsByNode.get(nid) || []).filter(a => a.isEmergency && a.isMaintenance).length, [assetsByNode]);
  const parentChain = useCallback((id) => getParentChain(id, nodeMap), [nodeMap]);
  const descendantIds = useCallback((rid) => getDescendantIds(rid, getChildren), [getChildren]);
  const nodePath = useCallback((nid) => parentChain(nid).map((x) => x.name).join(" / "), [parentChain]);

  const breadcrumb = selected ? parentChain(selected.id) : (focused ? parentChain(focused.id) : []);

  const scopeIds = useMemo(() => (selected ? new Set(descendantIds(selected.id)) : new Set()), [selected, descendantIds]);
  const scopeAssets = useMemo(() => assets.filter((a) => scopeIds.has(a.nodeId)), [assets, scopeIds]);
  const directAssets = useMemo(() => (selected ? (assetsByNode.get(selected.id) || []) : []), [selected, assetsByNode]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    // Nodes search
    const matchedNodes = nodes.filter((n) =>
      [n.name, n.description, n.funcao, n.responsavel, n.matricula, n.unidade, n.lotacao, n.email, n.tags]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );

    // Person search
    const matchedPersons = persons.filter((p) => {
      return [p.name, p.matricula, p.cargo, p.regime, p.vinculo, p.email, p.lotacao].filter(Boolean).join(" ").toLowerCase().includes(q);
    });

    // Global Contract search
    const matchedContracts = contracts.filter((c) => {
      return [c.sei, c.objeto, c.itens].filter(Boolean).join(" ").toLowerCase().includes(q);
    });

    // Create a unified list
    const results = [
      ...matchedNodes.map(n => ({ ...n, resultType: "node" })),
      ...matchedPersons.map(p => ({ ...p, resultType: "person" })),
      ...matchedContracts.map(c => ({ ...c, name: c.sei, resultType: "contract" }))
    ];

    return results.sort((a, b) => (a.name || "").localeCompare(b.name || "")).slice(0, 10);
  }, [nodes, persons, contracts, query]);

  const uniqueContracts = useMemo(() => {
    const seen = new Set();
    const list = [];
    assets.forEach(a => {
      if (a.tipoVinculo === "Contratado" && a.numeroContrato) {
        const key = `${a.numeroContrato}|${a.empresaContratada || ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ sei: a.numeroContrato, empresa: a.empresaContratada || "" });
        }
      }
    });
    return list.sort((a, b) => a.sei.localeCompare(b.sei));
  }, [assets]);


  // Auto-center on select (tree view)
  useEffect(() => {
    if (viewMode !== "tree" || !selectedId) return;
    const timer = setTimeout(() => {
      const vp = vpRef.current;
      if (!vp) return;
      const el = vp.querySelector(`[data-node-id="${selectedId}"] .org-card`);
      if (el) {
        const vpRect = vp.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const dx = elRect.left - vpRect.left + vp.scrollLeft - (vpRect.width / 2) + (elRect.width / 2);
        const dy = elRect.top - vpRect.top + vp.scrollTop - (vpRect.height / 2) + (elRect.height / 2);
        vp.scrollTo({ left: Math.max(0, dx), top: Math.max(0, dy), behavior: "smooth" });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedId, viewMode, isLoadingCloud]);

  // Auto-center on focus change ââ‚¬“ reset scroll first, then center
  useEffect(() => {
    if (viewMode !== "tree") return;
    const vp = vpRef.current;
    if (vp) vp.scrollTo(0, 0);
    const timer = setTimeout(() => {
      if (!vp) return;
      const first = vp.querySelector('.org-card');
      if (first) {
        const vpR = vp.getBoundingClientRect();
        const elR = first.getBoundingClientRect();
        const dx = elR.left - vpR.left + vp.scrollLeft - (vpR.width / 2) + (elR.width / 2);
        vp.scrollTo({ left: Math.max(0, dx), top: 0, behavior: "smooth" });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [focusId, viewMode, isLoadingCloud]);

  // Drag-to-pan on tree viewport
  useEffect(() => {
    if (viewMode !== "tree") return;
    const vp = vpRef.current;
    if (!vp) return;

    const onPointerDown = (e) => {
      // Ignore right clicks or clicks on interactive elements
      if (e.button !== 0 || e.target.closest(".org-card, button, a, input, select, textarea")) return;
      
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      scrollStartPos.current = { x: vp.scrollLeft, y: vp.scrollTop };
      
      vp.style.cursor = "grabbing";
      vp.style.userSelect = "none";
      vp.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      // Adjust scroll by zoom factor to keep content pinned to cursor
      vp.scrollLeft = scrollStartPos.current.x - dx / zoom;
      vp.scrollTop = scrollStartPos.current.y - dy / zoom;
    };

    const onPointerUp = (e) => {
      if (isDragging.current) {
        isDragging.current = false;
        vp.style.cursor = "";
        vp.style.userSelect = "";
        vp.releasePointerCapture(e.pointerId);
      }
    };

    vp.addEventListener("pointerdown", onPointerDown);
    vp.addEventListener("pointermove", onPointerMove);
    vp.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("pointercancel", onPointerUp);

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown);
      vp.removeEventListener("pointermove", onPointerMove);
      vp.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("pointercancel", onPointerUp);
    };
  }, [viewMode, zoom, isLoadingCloud]);


  // Select node ─ ”™ open detail
  const selectNode = useCallback((id) => {
    setSelectedId(id);
    setShowDetail(true);
  }, []);



  // Node CRUD
  const openNewNode = useCallback((parentId) => {
    const p = nodeMap.get(parentId);
    setEditNodeId(null);
    let inheritLotacao = "";
    if (parentId) {
      let cur = nodeMap.get(parentId);
      while (cur) {
        if (cur.lotacao) { inheritLotacao = cur.lotacao; break; }
        cur = cur.parentId ? nodeMap.get(cur.parentId) : null;
      }
    } else {
      const parentRoot = nodes.find(n => !n.parentId);
      inheritLotacao = parentRoot?.lotacao || "";
    }
    setNodeForm({ ...emptyNode, parentId, unidade: p?.unidade || "DMAE", lotacao: inheritLotacao });
    setOpenNodeDlg(true);
  }, [nodeMap, nodes]);

  const openEditNode = useCallback(() => {
    if (!selected || !canEdit) return;
    setEditNodeId(selected.id);
    // Normaliza cor -> color para garantir campo canônico
    const normalizedNode = {
      ...selected,
      color: normalizeHex(selected.color || selected.cor || ""),
      parentId: selected.parentId || "none",
    };
    setNodeForm(normalizedNode);
    setOpenNodeDlg(true);
  }, [selected, canEdit]);

  const saveNode = useCallback(async () => {
    if (nodeForm.tipo === "estrutura" && (!nodeForm.name || !nodeForm.name.trim())) {
      showSystemAlert("Informe a sigla da estrutura.", { title: "Sigla obrigatória", type: "warning" });
      return;
    }

    if (nodeForm.tipo === "estrutura" && (!nodeForm.description || !nodeForm.description.trim())) {
      showSystemAlert("Informe o nome por extenso ou descrição da estrutura.", { title: "Descrição obrigatória", type: "warning" });
      return;
    }

    let finalName = nodeForm.name;
    if (nodeForm.tipo === "pessoa" && nodeForm.responsavel) {
      finalName = nodeForm.responsavel;
    }

    // EXCLUSIVITY CHECK: Verify if the selected person is already in another node
    const currentNodeId = editNodeId || nodeForm.id || "";
    const occupiedNode = nodes.find(
      (n) => n.personId === nodeForm.personId && n.id !== currentNodeId
    );

    if (nodeForm.personId && occupiedNode) {
      showSystemAlert(
        `Esta pessoa já está vinculada à caixa "${occupiedNode.name}".\n\nUma pessoa não pode participar de mais de uma caixa do organograma.`,
        { title: "Pessoa já vinculada", type: "warning" }
      );
      return;
    }

    if (nodeForm.tipo === "pessoa" && !nodeForm.personId) {
      showSystemAlert("Selecione uma pessoa do cadastro para incluir abaixo da estrutura.", { title: "Pessoa obrigatória", type: "warning" });
      return;
    }

    // Monta objeto canônico — usa apenas 'color', sem 'cor'
    const n = {
      ...nodeForm,
      name: finalName,
      id: editNodeId || makeId("node"),
      parentId: nodeForm.parentId === "none" || !nodeForm.parentId ? null : nodeForm.parentId,
      color: normalizeHex(nodeForm.color || nodeForm.cor || ""),
    };
    delete n.cor; // remove campo legado

    try {
      // 1. Persistir no Supabase ANTES de atualizar o estado local
      if (supabase) {
        const { error } = await supabase.from('nodes').upsert(n);
        if (error) throw error;
      }

      // 2. Atualizar estado local após confirmação do banco
      setNodes((c) => {
        let baseList = c;

        if (editNodeId) {
          let newNodes = baseList.map((x) => x.id === editNodeId ? n : x);
          // Propagar lotação para descendentes se mudou
          const oldNode = baseList.find((x) => x.id === editNodeId);
          if (oldNode && oldNode.lotacao !== n.lotacao) {
            const dec = [];
            const q = [editNodeId];
            while (q.length > 0) {
              const cur = q.shift();
              c.filter((x) => x.parentId === cur).forEach((child) => {
                dec.push(child.id);
                q.push(child.id);
              });
            }
            const decSet = new Set(dec);
            newNodes = newNodes.map((x) => {
              if (decSet.has(x.id) && x.lotacao === oldNode.lotacao) {
                return { ...x, lotacao: n.lotacao };
              }
              return x;
            });
          }
          return newNodes;
        } else {
          return [...baseList, n];
        }
      });

      if (editNodeId) {
        setSelectedId(editNodeId);
        logAction("Editar Caixa", n.name);
        showSystemAlert("Caixa atualizada com sucesso!", { title: "Concluído", type: "success" });
      } else {
        setSelectedId(n.id);
        setFocusId(n.parentId || n.id);
        logAction("Criar Caixa", n.name);
        showSystemAlert("Caixa criada com sucesso!", { title: "Concluído", type: "success" });
      }

      setOpenNodeDlg(false);
      setEditNodeId(null);

    } catch (err) {
      console.error("Erro ao salvar caixa:", err);
      flash("\u274c Erro ao salvar a caixa: " + (err?.message || "Verifique o banco de dados."));
    }
  }, [nodeForm, editNodeId, nodes, logAction]);
  const deleteNode = useCallback((idOverride) => {
    const targetId = idOverride || (selected && selected.id);
    if (!targetId || !canEdit) return;
    
    const nodeRecord = nodeMap.get(targetId);
    if (!nodeRecord) return;
    
    if (!nodeRecord.parentId) { showSystemAlert("O nó raiz não pode ser removido.", { title: "Atenção", type: "warning" }); return; }
    if (nodes.some((n) => n.parentId === targetId)) { showSystemAlert("Remova subordinados antes.", { title: "Atenção", type: "warning" }); return; }
    
    const nodeName = nodeRecord.name || nodeRecord.responsavel || "esta caixa";
    if (!confirm(`\u26a0\ufe0f ATENÇÃO: Você tem certeza que deseja excluir "${nodeName}"?\n\nEsta ação é irreversível.`)) return;
    
    if (supabase) supabase.from('nodes').delete().eq('id', targetId).then(() => console.log("Removed from cloud"));
    setNodes((c) => c.filter((x) => x.id !== targetId));
    
    if (selected && selected.id === targetId) {
      setSelectedId(nodeRecord.parentId);
      setShowDetail(false);
    }
    
    logAction("Excluir Caixa", nodeName);
    flash("Excluída");
  }, [selected, canEdit, nodes, nodeMap, logAction]);

  const handlePhoto = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024 * 2) { showSystemAlert("O arquivo deve ter no máximo 2MB.", { title: "Arquivo muito grande", type: "warning" }); return; }
    try { setNodeForm((p) => ({ ...p, foto: "" })); const b = await fileToBase64(f); setNodeForm((p) => ({ ...p, foto: b })); } catch { showSystemAlert("Erro ao carregar a imagem.", { title: "Erro", type: "error" }); }
    e.target.value = "";
  }, []);

    const resetAssetTypeForm = useCallback(() => {
    setAssetTypeForm({ id: "", category: "", name: "" });
    setEditAssetTypeId(null);
  }, []);

  const saveAssetType = useCallback(async () => {
    const category = assetTypeForm.category.trim();
    const name = assetTypeForm.name.trim();
    const missingFields = [];
    if (!category) missingFields.push("Grupo/Categoria");
    if (!name) missingFields.push("Nome do Tipo");
    if (missingFields.length > 0) {
      showSystemAlert(`Preencha os campos obrigatórios antes de salvar o tipo:\n\n${missingFields.map((field) => `- ${field}`).join("\n")}`, { title: "Dados obrigatórios", type: "warning" });
      return;
    }
    const duplicate = assetTypes.find((item) => {
      const sameId = editAssetTypeId && ((item.id && item.id === editAssetTypeId) || item._localId === editAssetTypeId);
      return !sameId && String(item.category || "").trim().toLowerCase() === category.toLowerCase() && String(item.name || "").trim().toLowerCase() === name.toLowerCase();
    });
    if (duplicate) {
      showSystemAlert("Já existe um tipo cadastrado com este grupo/categoria e este nome.", { title: "Tipo duplicado", type: "warning" });
      return;
    }
    const currentId = editAssetTypeId || assetTypeForm.id || "";
    const localId = currentId || makeId("assetType");
    const payload = { category, name };
    try {
      let savedPayload = { ...payload, id: assetTypeForm.id || currentId, _localId: localId };
      if (supabase) {
        if (editAssetTypeId && assetTypeForm.id) {
          const { data, error } = await supabase.from("asset_types").update(payload).eq("id", assetTypeForm.id).select().single();
          if (error) throw error;
          savedPayload = data || savedPayload;
        } else {
          const { data, error } = await supabase.from("asset_types").insert(payload).select().single();
          if (error) throw error;
          savedPayload = data || savedPayload;
        }
      }
      setAssetTypes((current) => {
        if (editAssetTypeId) {
          return current.map((item) => {
            const match = (item.id && item.id === editAssetTypeId) || item._localId === editAssetTypeId || (!item.id && item.category === assetTypeForm.category && item.name === assetTypeForm.name);
            return match ? { ...item, ...savedPayload } : item;
          });
        }
        return [...current, { ...savedPayload }];
      });
      resetAssetTypeForm();
      showSystemAlert(editAssetTypeId ? "Tipo de ativo atualizado com sucesso." : "Tipo de ativo adicionado com sucesso.", { title: editAssetTypeId ? "Tipo atualizado" : "Tipo adicionado", type: "success" });
    } catch (error) {
      console.error("Erro ao salvar tipo de ativo:", error);
      showSystemAlert(`Não foi possível salvar o tipo de ativo.\n\nDetalhe técnico: ${error.message}`, { title: "Erro ao salvar tipo", type: "error" });
    }
  }, [assetTypeForm, assetTypes, editAssetTypeId, resetAssetTypeForm, showSystemAlert, supabase]);

  const startEditAssetType = useCallback((item) => {
    const id = item.id || item._localId || `${item.category}-${item.name}`;
    setEditAssetTypeId(id);
    setAssetTypeForm({ id: item.id || "", category: item.category || "", name: item.name || "" });
  }, []);

  const requestDeleteAssetType = useCallback((item) => {
    const typeId = item.id || item._localId || `${item.category}-${item.name}`;
    const usedAssets = assets.filter((asset) => {
      return String(asset.category || "").trim().toLowerCase() === String(item.category || "").trim().toLowerCase() && String(asset.type || "").trim().toLowerCase() === String(item.name || "").trim().toLowerCase();
    });
    const usageMessage = usedAssets.length > 0 ? `\n\nAtenção: existem ${usedAssets.length} ativo(s) usando este tipo. A exclusão removerá apenas o tipo da lista de opções, não alterará os ativos já cadastrados.` : "";
    setConfirmDialog({
      title: "Excluir tipo de ativo",
      subtitle: "Esta ação precisa de confirmação.",
      type: "danger",
      confirmText: "Excluir",
      message: `Deseja realmente excluir o tipo abaixo?\n\nGrupo: ${item.category}\nTipo: ${item.name}${usageMessage}`,
      onConfirm: async () => {
        try {
          if (supabase && item.id) {
            const { error } = await supabase.from("asset_types").delete().eq("id", item.id);
            if (error) throw error;
          }
          setAssetTypes((current) => current.filter((typeItem) => (typeItem.id || typeItem._localId || `${typeItem.category}-${typeItem.name}`) !== typeId));
          if (editAssetTypeId === typeId) resetAssetTypeForm();
          showSystemAlert("Tipo de ativo excluído com sucesso.", { title: "Tipo excluído", type: "success" });
        } catch (error) {
          console.error("Erro ao excluir tipo de ativo:", error);
          showSystemAlert(`Não foi possível excluir o tipo de ativo.\n\nDetalhe técnico: ${error.message}`, { title: "Erro ao excluir tipo", type: "error" });
        }
      }
    });
  }, [assets, editAssetTypeId, resetAssetTypeForm, showSystemAlert, supabase]);

  // Asset CRUD
  const openNewAsset = useCallback((nid) => { setEditAssetId(null); setAssetForm({ ...emptyAsset, nodeId: nid }); setOpenAssetDlg(true); }, []);
  const openEditAsset = useCallback((a) => { setEditAssetId(a.id); setAssetForm({ ...a }); setOpenAssetDlg(true); }, []);
  const saveAsset = useCallback(async () => {
    const normalizedAsset = {
      ...assetForm,
      id: editAssetId || assetForm.id || makeId("asset"),
      isEmergency: Boolean(assetForm.isEmergency),
      isMaintenance: Boolean(assetForm.isMaintenance),
      maintenanceSince: assetForm.isMaintenance
        ? assetForm.maintenanceSince || new Date().toISOString()
        : ""
    };

    // Validation
    const missingAssetFields = [];
    if (!normalizedAsset.nodeId?.trim()) missingAssetFields.push("Unidade de Alocação / Lotação");
    if (!normalizedAsset.tipoVinculo?.trim()) missingAssetFields.push("Tipo de Vínculo");
    if (!normalizedAsset.category?.trim()) missingAssetFields.push("Grupo");
    if (!normalizedAsset.type?.trim()) missingAssetFields.push("Tipo do Ativo");
    if (!normalizedAsset.name?.trim()) missingAssetFields.push("Identificação / Nome Curto");

    if (normalizedAsset.isEmergency && !normalizedAsset.contatoResponsavel?.trim()) {
      missingAssetFields.push("Responsável pela Contingência");
    }

    if (normalizedAsset.isEmergency && !normalizedAsset.contatoAcionamento?.trim()) {
      missingAssetFields.push("Telefone de Emergência / Acionamento");
    }

    if (normalizedAsset.tipoVinculo === "Contratado") {
      if (!normalizedAsset.numeroContrato?.trim()) missingAssetFields.push("Nº Processo SEI do contrato");
      if (!normalizedAsset.empresaContratada?.trim()) missingAssetFields.push("Nome da Empresa Contratada");
      if (!normalizedAsset.cnpjContratada?.trim()) missingAssetFields.push("CNPJ da Empresa Contratada");
    }

    if (missingAssetFields.length > 0) {
      showSystemAlert(
        `Preencha os campos obrigatórios antes de salvar o ativo:\n\n${missingAssetFields.map((field) => `- ${field}`).join("\n")}`,
        { title: "Dados obrigatórios do ativo", type: "warning" }
      );
      return;
    }
    
    if (supabase) {
      const assetToDb = {
        id: normalizedAsset.id,
        node_id: normalizedAsset.nodeId || null,
        nodeId: normalizedAsset.nodeId || null,
        category: normalizedAsset.category || "",
        type: normalizedAsset.type || "",
        name: normalizedAsset.name || "",
        manufacturer: normalizedAsset.manufacturer || "",
        model: normalizedAsset.model || "",
        year: normalizedAsset.year || "",
        plate: normalizedAsset.plate || "",
        patrimonio: normalizedAsset.patrimonio || "",
        os: normalizedAsset.os || "",
        notes: normalizedAsset.notes || "",
        tipo_vinculo: normalizedAsset.tipoVinculo || "Próprio",
        is_emergency: Boolean(normalizedAsset.isEmergency),
        is_maintenance: Boolean(normalizedAsset.isMaintenance),
        maintenance_notes: normalizedAsset.maintenanceNotes || "",
        maintenance_since: normalizedAsset.isMaintenance
          ? normalizedAsset.maintenanceSince || new Date().toISOString()
          : null,
        numero_contrato: normalizedAsset.numeroContrato || "",
        empresa_contratada: normalizedAsset.empresaContratada || "",
        cnpj_contratada: normalizedAsset.cnpjContratada || "",
        contato_fone: normalizedAsset.contatoFone || "",
        contato_acionamento: normalizedAsset.contatoAcionamento || "",
        contato_responsavel: normalizedAsset.contatoResponsavel || "",
        fiscal_contrato: normalizedAsset.fiscalContrato || "",
        matricula_fiscal: normalizedAsset.matriculaFiscal || "",
        photos: normalizedAsset.photos || []
      };
      
      const { error } = await supabase.from('assets').upsert(assetToDb).select();
      if (error) {
        console.error("Erro ao salvar ativo:", error, assetToDb);
        showSystemAlert(`O ativo não pôde ser salvo.\n\nDetalhe técnico: ${error.message}`, { title: "Erro ao salvar ativo", type: "error" });
        return;
      }
    }
    
    setAssets((current) =>
      editAssetId
        ? current.map((item) => item.id === editAssetId ? normalizedAsset : item)
        : [...current, normalizedAsset]
    );
    logAction(editAssetId ? "Editar Ativo" : "Cadastrar Ativo", "ASSET", normalizedAsset.name);
    setOpenAssetDlg(false); setEditAssetId(null); setAssetForm(emptyAsset);
    showSystemAlert("Ativo salvo com sucesso.", { title: "Ativo salvo", type: "success" });
  }, [assetForm, editAssetId, logAction, supabase]);

  const deleteAsset = useCallback((id, name) => {
    if (!confirm("Excluir ativo?")) return;
    if (supabase) supabase.from('assets').delete().eq('id', id).then(() => console.log("Asset deleted"));
    setAssets((c) => c.filter((a) => a.id !== id));
    logAction("Excluir Ativo", name || id);
    flash("Ativo excluído");
  }, [logAction]);

  // Person CRUD
  const openNewPerson = useCallback(() => { setEditPersonId(null); setPersonForm(emptyPerson); setOpenPersonDlg(true); }, []);
  const openEditPerson = useCallback((p) => { setEditPersonId(p.id); setPersonForm({ ...p, email: p.email || "@dmae.prefpoa.com.br" }); setOpenPersonDlg(true); }, []);
  const savePerson = useCallback(() => {
    const emailVal = personForm.email.trim();
    if (!personForm.name?.trim()) {
      showSystemAlert("Informe o nome da pessoa antes de salvar.", { title: "Nome obrigatório", type: "warning" });
      return;
    }
    if (!personForm.matricula?.trim() || !personForm.cargo?.trim() || !emailVal) {
      showSystemAlert("Matrícula, Cargo e E-mail são obrigatórios.", { title: "Campos obrigatórios", type: "warning" });
      return;
    }
    if (emailVal === "@dmae.prefpoa.com.br") {
      showSystemAlert("Por favor, preencha o e-mail completo, não apenas o domínio.", { title: "E-mail inválido", type: "warning" });
      return;
    }
    const p = { ...personForm, email: emailVal, id: editPersonId || makeId("person") };
    if (supabase) supabase.from('persons').upsert(p).then(() => console.log("Person synced"));
    setPersons(editPersonId ? (c) => c.map((x) => x.id === editPersonId ? p : x) : (c) => [...c, p]);
    logAction(editPersonId ? "Editar Pessoa" : "Cadastrar Pessoa", p.name);
    setOpenPersonDlg(false);
    showSystemAlert(editPersonId ? "Pessoa atualizada!" : "Pessoa cadastrada!", { title: "Pessoa salva", type: "success" });
    // If we were in the middle of assigning this person to a node, restore the node dialog
    if (pendingPersonNodeForm) {
      setNodeForm(prev => ({ ...pendingPersonNodeForm, personId: p.id, responsavel: p.name, matricula: p.matricula, cargo: p.cargo }));
      setPendingPersonNodeForm(null);
      setTimeout(() => setOpenNodeDlg(true), 100);
    }
  }, [personForm, editPersonId, logAction, pendingPersonNodeForm]);
  const requestDeletePerson = useCallback((id) => {
    if (!canEdit) { flash("Entre no modo edição para excluir."); return; }
    const p = personMap.get(id);
    if (!p) return;
    if (nodes.some(n => n.personId === id)) { 
      flash("Esta pessoa está vinculada a uma caixa. Remova o vínculo antes."); 
      return; 
    }
    setDeleteRequest({ type: "person", id, name: p.name });
  }, [canEdit, personMap, nodes, flash]);

  const confirmDelete = useCallback(async () => {
    if (!deleteRequest) return;
    const { type, id, name } = deleteRequest;

    if (type === "node") {
      const nodeRecord = nodeMap.get(id);
      if (!nodeRecord) { flash("Caixa não encontrada."); setDeleteRequest(null); return; }
      if (!nodeRecord.parentId) { flash("O nó raiz não pode ser removido."); setDeleteRequest(null); return; }
      if (nodes.some((n) => n.parentId === id)) { flash("Remova subordinados antes."); setDeleteRequest(null); return; }
      if (assets.some((a) => a.nodeId === id)) { flash("Remova ativos vinculados antes."); setDeleteRequest(null); return; }

      try {
        if (supabase) {
          const { error } = await supabase.from('nodes').delete().eq('id', id);
          if (error) throw error;
        }
        setNodes((c) => c.filter((x) => x.id !== id));
        if (selectedId === id) { setSelectedId(nodeRecord.parentId); setFocusId(nodeRecord.parentId); setShowDetail(false); }
        if (editNodeId === id) { setOpenNodeDlg(false); setEditNodeId(null); }
        logAction("Excluir Caixa", nodeRecord.name || id);
        flash("Excluída");
      } catch (err) {
        console.error("Delete node error:", err);
        flash("Erro ao excluir. Verifique permissões.");
      }
    } else if (type === "person") {
      try {
        if (supabase) {
          const { error } = await supabase.from('persons').delete().eq('id', id);
          if (error) throw error;
        }
        setPersons((c) => c.filter((p) => p.id !== id));
        logAction("Excluir Pessoa", name || id);
        showSystemAlert("Pessoa excluída com sucesso.", { title: "Concluído", type: "success" });
      } catch (err) {
        console.error("Delete person error:", err);
        flash("Erro ao excluir pessoa.");
      }
    }
    setDeleteRequest(null);
  }, [deleteRequest, nodeMap, nodes, assets, supabase, selectedId, editNodeId, logAction, flash]);

  // Contract CRUD
  const openNewContract = useCallback(() => {
    setEditContractId(null);
    setContractForm(emptyContract);
    setOpenContractDlg("registry");
  }, []);

  const openEditContract = useCallback((contract) => {
    setEditContractId(contract.id);
    setContractForm({
      ...emptyContract,
      ...contract,
      nodeId: contract.nodeId || contract.node_id || "",
      dataInicio: contract.dataInicio || contract.data_inicio || "",
      dataTermino: contract.dataTermino || contract.data_fim || "",
      valorTotal: contract.valorTotal ?? contract.valor_total ?? "",
      empresa: contract.empresa || "",
      cnpj: contract.cnpj || "",
      contato: contract.contato || "",
      itens: contract.itens || "",
      gestor: contract.gestor || { titularId: "", suplenteId: "" },
      fiscaisContrato: contract.fiscaisContrato || contract.fiscais_contrato || [{ titularId: "", suplenteId: "" }],
      fiscaisServico: contract.fiscaisServico || contract.fiscais_servico || [{ titularId: "", suplenteId: "" }],
      fiscaisAdministrativos: contract.fiscaisAdministrativos || contract.fiscais_administrativos || [],
      aditivos: contract.aditivos || []
    });
    setOpenContractDlg("edit");
  }, []);

  const saveContract = useCallback(async () => {
    const cleanRole = (role) => ({
      titularId: role?.titularId || "",
      suplenteId: role?.suplenteId || ""
    });

    const cleanRoleArray = (list) =>
      (Array.isArray(list) ? list : [])
        .map(cleanRole)
        .filter((item) => item.titularId || item.suplenteId);

    const normalizedContract = {
      ...contractForm,
      id: editContractId || contractForm.id || makeId("contract"),
      nodeId: contractForm.nodeId || contractForm.node_id || "",
      sei: contractForm.sei || "",
      objeto: contractForm.objeto || "",
      empresa: contractForm.empresa || "",
      cnpj: contractForm.cnpj || "",
      contato: contractForm.contato || "",
      itens: contractForm.itens || "",
      gestor: cleanRole(contractForm.gestor),
      fiscaisContrato: cleanRoleArray(contractForm.fiscaisContrato),
      fiscaisServico: cleanRoleArray(contractForm.fiscaisServico),
      fiscaisAdministrativos: cleanRoleArray(contractForm.fiscaisAdministrativos),
      aditivos: Array.isArray(contractForm.aditivos) ? contractForm.aditivos : []
    };

    // Validations
    const missingFields = [];
    if (!normalizedContract.sei?.trim()) missingFields.push("Número do processo SEI");
    if (!normalizedContract.nodeId?.trim()) missingFields.push("Unidade Vinculada");
    if (!normalizedContract.objeto?.trim()) missingFields.push("Objeto do Contrato");
    if (!normalizedContract.empresa?.trim()) missingFields.push("Nome/Razão Social da empresa contratada");
    if (!normalizedContract.cnpj?.trim()) missingFields.push("CNPJ da empresa contratada");

    if (missingFields.length > 0) {
      showSystemAlert(
        `Preencha os campos obrigatórios antes de salvar o contrato:\n\n${missingFields.map((field) => `- ${field}`).join("\n")}`,
        { title: "Dados obrigatórios do contrato", type: "warning" }
      );
      return;
    }

    if (supabase) {
      const contractToDb = {
        id: normalizedContract.id,
        sei: normalizedContract.sei.trim(),
        tipo: normalizedContract.tipo || "",
        objeto: normalizedContract.objeto || "",
        itens: normalizedContract.itens || "",
        empresa: normalizedContract.empresa || "",
        cnpj: normalizedContract.cnpj || "",
        contato: normalizedContract.contato || "",
        status: normalizedContract.status || "Ativo",
        valor_total: normalizedContract.valorTotal || null,
        data_inicio: normalizedContract.dataInicio || null,
        data_fim: normalizedContract.dataTermino || null,
        node_id: normalizedContract.nodeId || null,
        gestor: normalizedContract.gestor || {},
        fiscais_contrato: normalizedContract.fiscaisContrato || [],
        fiscais_servico: normalizedContract.fiscaisServico || [],
        fiscais_administrativos: normalizedContract.fiscaisAdministrativos || [],
        aditivos: normalizedContract.aditivos || []
      };

      const { error } = await supabase.from('contracts').upsert(contractToDb).select();
      if (error) {
        console.error("Erro ao salvar contrato:", error);
        showSystemAlert(`O contrato não pôde ser salvo.\n\nDetalhe técnico: ${error.message}`, { title: "Erro ao salvar contrato", type: "error" });
        return;
      }
    }

    setContracts((current) =>
      editContractId
        ? current.map((item) => item.id === editContractId ? normalizedContract : item)
        : [...current, normalizedContract]
    );

    logAction(editContractId ? "Editar Contrato" : "Cadastrar Contrato", normalizedContract.sei);
    setOpenContractDlg(false); 
    setEditContractId(null);
    setContractForm(emptyContract);
    showSystemAlert("Contrato salvo com sucesso.", { title: "Contrato salvo", type: "success" });
  }, [contractForm, editContractId, logAction]);

  const deleteContract = useCallback((id, sei) => {
    if (!confirm(`Excluir contrato ${sei}?`)) return;
    if (supabase) supabase.from('contracts').delete().eq('id', id).then(() => console.log("Contract removed from cloud"));
    setContracts((prev) => prev.filter((c) => c.id !== id));
    logAction("Excluir Contrato", sei || id);
    showSystemAlert("Contrato excluído com sucesso.", { title: "Concluído", type: "success" });
  }, [logAction]);

  const requestDeleteNode = useCallback((nodeId) => {
    if (!canEdit) { flash("Entre no modo edição para excluir."); return; }
    const node = nodeMap.get(nodeId);
    if (!node) { flash("Caixa não encontrada."); return; }
    setDeleteRequest({ type: "node", id: nodeId, name: node.name || node.responsavel || "esta caixa" });
  }, [canEdit, nodeMap, flash]);

  const confirmDeleteNode = useCallback(async () => {
    if (!deleteRequest || deleteRequest.type !== "node") return;
    const targetId = deleteRequest.id;
    const nodeRecord = nodeMap.get(targetId);
    if (!nodeRecord) { flash("Caixa não encontrada."); setDeleteRequest(null); return; }
    if (!nodeRecord.parentId) { flash("O nó raiz não pode ser removido."); setDeleteRequest(null); return; }
    if (nodes.some((n) => n.parentId === targetId)) { flash("Remova subordinados antes."); setDeleteRequest(null); return; }
    if (assets.some((a) => a.nodeId === targetId)) { flash("Remova ativos vinculados antes."); setDeleteRequest(null); return; }

    try {
      if (supabase) {
        const { error } = await supabase.from('nodes').delete().eq('id', targetId);
        if (error) throw error;
      }
      setNodes((c) => c.filter((x) => x.id !== targetId));
      if (selectedId === targetId) { setSelectedId(nodeRecord.parentId); setFocusId(nodeRecord.parentId); setShowDetail(false); }
      if (editNodeId === targetId) { setOpenNodeDlg(false); setEditNodeId(null); }
      logAction("Excluir Caixa", nodeRecord.name || targetId);
      flash("Excluída");
    } catch (err) {
      console.error("Delete error:", err);
      flash("Erro ao excluir. Verifique permissões.");
    } finally {
      setDeleteRequest(null);
    }
  }, [deleteRequest, nodeMap, nodes, assets, supabase, selectedId, editNodeId, logAction, flash]);

  const handleImportPersons = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      if (!content) return;
      const lines = content.split("\n");
      const newP = [];
      lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(/[,\t;]/).map(s => s.trim());
        if (parts.length >= 2) {
          if (parts[0].toLowerCase().includes("matricula") || parts[0].toLowerCase().includes("numfu")) return;
          newP.push({
            id: makeId("p"),
            matricula: parts[0],
            name: parts[1],
            regime: parts[2] || "",
            vinculo: parts[3] || "",
            cargo: parts[4] || "",
            email: "", telefone: "", ramal: "", lotacao: "", contracts: []
          });
        }
      });
      if (newP.length > 0) {
        setPersons(prev => {
          const existingMats = new Set(prev.map(p => p.matricula));
          const filtered = newP.filter(n => !n.matricula || !existingMats.has(n.matricula));
          return [...prev, ...filtered];
        });
        flash(`${newP.length} pessoas processadas.`);
        logAction("Importar Pessoas", `${newP.length} servidores importados.`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [flash, logAction]);

  // Export / Import
  const exportContractPdf = useCallback((c) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const node = nodes.find(n => n.id === c.nodeId);
    
    pdf.setFontSize(18);
    pdf.text(`Contrato SEI: ${c.sei}`, 20, 20);
    
    pdf.setFontSize(10);
    pdf.text(`Objeto: ${c.objeto}`, 20, 30);
    pdf.text(`Empresa: ${c.empresa || "N/A"}`, 20, 35);
    pdf.text(`Unidade: ${node ? node.name : "N/A"}`, 20, 40);
    pdf.text(`Vigência: ${c.dataInício || "N/A"} a ${c.dataTermino || "N/A"}`, 20, 45);
    
    pdf.line(20, 50, 190, 50);
    
    pdf.text("GESTÃO E FISCALIZAÇÃO", 20, 60);
    pdf.text(`Gestor Titular: ${personMap.get(c.gestor.titularId)?.name || "N/A"}`, 20, 65);
    pdf.text(`Gestor Suplente: ${personMap.get(c.gestor.suplenteId)?.name || "N/A"}`, 20, 70);
    
    pdf.save(`contrato-${c.sei}.pdf`);
    flash("PDF Gerado!");
  }, [nodes, personMap]);

  const expJson = useCallback(() => { downloadFile("organograma-dmae.json", JSON.stringify({ nodes, assets }, null, 2)); flash("JSON exportado!"); }, [nodes, assets]);
  const expCsv = useCallback((nid) => {
    const sc = new Set(descendantIds(nid));
    const rows = [["Categoria", "Nome", "Fabricante", "Modelo", "Ano", "Placa", "Patrim\u00f4nio", "OS", "Estrutura", "Obs"],
    ...assets.filter((a) => sc.has(a.nodeId)).map((a) => [a.category, a.name, a.manufacturer, a.model, a.year, a.plate, a.patrimonio, a.os, nodePath(a.nodeId), a.notes])];
    downloadFile(`ativos-${(nodeMap.get(nid)?.name || "").toLowerCase()}.csv`, toCsv(rows), "text/csv;charset=utf-8;");
    flash("CSV exportado!");
  }, [assets, descendantIds, nodePath, nodeMap]);
  const expPdf = useCallback((nid) => {
    const sc = new Set(descendantIds(nid));
    const list = assets.filter((a) => sc.has(a.nodeId));
    exportAssetsPdf(list, nodeMap.get(nid)?.name || "", nodePath);
  }, [assets, descendantIds, nodeMap, nodePath]);
  const handleImport = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const p = JSON.parse(String(r.result)); if (!Array.isArray(p?.nodes) || !p.nodes.length) throw 0; setNodes(p.nodes); setAssets(Array.isArray(p.assets) ? p.assets : []); setSelectedId(null); setFocusId(null); logAction("Importar Base JSON", "Substituição completa"); showSystemAlert("Importado com sucesso!", { title: "Concluído", type: "success" }); } catch { showSystemAlert("Arquivo inválido.", { title: "Erro na importação", type: "error" }); } };
    r.readAsText(f); e.target.value = "";
  }, [logAction]);

  // Login & Admin
  const doLogin = useCallback(async () => {
    setLoginErr("");
    
    // 1. Try regular admin/editor users from Supabase first
    try {
      const { data: latestUsers, error: fErr } = await supabase.from('users').select('*');
      if (!fErr && latestUsers) {
        const u = latestUsers.find(x => x.username.toLowerCase() === loginUser.toLowerCase() && x.password === loginPass);
        if (u) {
          const sessionUser = { 
            ...u, 
            username: u.username || loginUser,
            role: u.role || (u.username.toLowerCase() === 'admin' ? 'admin' : 'editor')
          };
          setCurrentUser(sessionUser);
          setCanEdit(true);
          setOpenLoginDlg(false);
          setLoginUser(""); setLoginPass(""); setLoginErr("");
          logAction('LOGIN_SUCCESS', 'USER', sessionUser.username);
          
          if (pendingEditNodeId) { 
            const nodeRecord = nodes.find(n => n.id === pendingEditNodeId);
            if (nodeRecord) { setEditNodeId(pendingEditNodeId); setNodeForm(nodeRecord); setOpenNodeDlg(true); }
            setPendingEditNodeId(null); 
          }
          return;
        }
      }
    } catch (e) { console.error("Login fetch error:", e); }

    // 2. Try Person login (Matrícula as login and password)
    const p = persons.find(x => x.matricula === loginUser && x.matricula === loginPass);
    if (p) {
        setCurrentUser({ 
          username: p.matricula, 
          name: p.name, 
          role: 'viewer' 
        });
        setCanEdit(false);
        setOpenLoginDlg(false);
        setLoginUser(""); setLoginPass(""); setLoginErr("");
        flash(`Bem-vindo, ${p.name}! Acesso de visualização liberado.`);
        logAction("Login Visualizador", "PERSON", p.name);
        return;
    }

    setLoginErr("Credenciais inválidas.");
  }, [loginUser, loginPass, users, persons, pendingEditNodeId, nodes, logAction, flash]);

  const handleChangePassword = useCallback(async () => {
    if (pwdNew.length < 3) { showSystemAlert("A nova senha deve ter no mínimo 3 caracteres.", { title: "Senha curta", type: "warning" }); return; }
    if (pwdNew !== pwdConfirm) { showSystemAlert("A nova senha e a confirmação não coincidem.", { title: "Senhas não conferem", type: "warning" }); return; }

    const u = users.find(x => x.username === currentUser);
    if (!u) return;
    if (u.password !== pwdCurrent && !forcePassMode) {
      showSystemAlert("Senha atual incorreta.", { title: "Erro de autenticação", type: "error" });
      return;
    }

    setUsers(prev => prev.map(x => x.username === currentUser ? { ...x, password: pwdNew, firstLogin: false } : x));
    setOpenPasswordDlg(false);
    setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    showSystemAlert("Senha alterada com sucesso!", { title: "Senha alterada", type: "success" });
    logAction("Trocar Senha", `A conta ${currentUser} realizou alteração de senha.`);

    if (forcePassMode) {
      if (!pwdNew || pwdNew.length < 4) return showSystemAlert("Sua senha deve ter no mínimo 4 caracteres.", { title: "Senha curta", type: "warning" });
      if (pwdNew !== pwdConfirm) return showSystemAlert("As senhas não conferem.", { title: "Senhas não conferem", type: "warning" });
      
      const uname = currentUser?.username || "usuario_desconhecido";
      const uid = currentUser?.id;

      // 1. OPTIMISTIC UNLOCK: Libera o usuário IMEDIATAMENTE na tela
      setForcePassMode(false);
      setOpenPasswordDlg(false);
      setCanEdit(true);
      setCurrentUser(prev => ({ ...prev, must_change_password: false, password: pwdNew }));
      flash("Bem-vindo! Acesso liberado.");

      // 2. BACKGROUND SYNC: Salva no banco de dados sem travar a tela
      try {
        if (supabase) {
          const query = uid ? 
            supabase.from('users').update({ password: pwdNew, must_change_password: false }).eq('id', uid) :
            supabase.from('users').update({ password: pwdNew, must_change_password: false }).eq('username', uname);
          
          await query;
          logAction("PASSWORD_RESET_CLOUD", "USER", uname);
          loadCloudData(); // Refresh list in background
        }
      } catch (err) {
        console.error("Erro silencioso ao salvar senha no cloud:", err);
      }
    }
  }, [pwdCurrent, pwdNew, pwdConfirm, currentUser, forcePassMode, supabase, loadCloudData, logAction]);

  const handleAddUser = async () => {
    if (!newUser.trim() || newPass.length < 3) { showSystemAlert("Login/Senha muito curtos.", { title: "Dados insuficientes", type: "warning" }); return; }
    if (!supabase) return showSystemAlert("Modo offline. Cadastros bloqueados.", { title: "Offline", type: "warning" });
    if (users.some(u => u.username.toLowerCase() === newUser.toLowerCase())) { showSystemAlert("Usuário já existe!", { title: "Conflito", type: "warning" }); return; }

    try {
      const { data, error } = await supabase.from('users').insert({ 
        username: newUser, 
        password: newPass, 
        role: newIsAdmin ? 'admin' : 'editor',
        must_change_password: true
      }).select();

      if (error) throw error;

      setUsers(prev => [...prev, data[0]]);
      logAction('CREATE_USER', 'USER', newUser);
      setNewUser(""); setNewPass(""); setNewIsAdmin(false);
      flash("Usuário cadastrado com sucesso!");
    } catch (err) {
      showSystemAlert("Erro ao cadastrar no banco: " + err.message, { title: "Erro no banco", type: "error" });
    }
  };

  const handleDelUser = useCallback(async (username, userId) => {
    if (!username) return;
    if (username === currentUser?.username) { showSystemAlert("Não pode excluir a si mesmo!", { title: "Ação bloqueada", type: "warning" }); return; }
    if (username.toLowerCase() === "admin") { showSystemAlert("A conta admin padrão não pode ser excluída.", { title: "Ação bloqueada", type: "warning" }); return; }
    
    try {
      // 1. Remove from local UI immediately
      setUsers(prev => prev.filter(x => x.username.toLowerCase().trim() !== username.toLowerCase().trim()));

      // 2. Remove from Cloud
      if (supabase) {
        // Use ID if available, fallback to username
        const query = userId ? supabase.from('users').delete().eq('id', userId) : supabase.from('users').delete().eq('username', username);
        const { error } = await query;
        
        if (error) {
          console.error("Delete error:", error);
          // Re-fetch users if cloud delete fails to restore UI state
          const { data: latest } = await supabase.from('users').select('*');
          if (latest) setUsers(latest);
          throw error;
        }
      }
      
      logAction("Excluir Usuário", `Apagado: ${username}`);
      showSystemAlert("Usuário removido com sucesso.", { title: "Concluído", type: "success" });
    } catch (err) {
      showSystemAlert("Erro crítico ao excluir usuário: " + err.message, { title: "Erro crítico", type: "error" });
    }
  }, [currentUser, logAction, supabase]);

  const handleResetPass = async (username) => {
    const newRaw = "dmae123";
    try {
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .update({ 
            password: newRaw,
            must_change_password: true 
          })
          .eq('username', username);
        if (error) throw error;
      }
      
      setUsers(prev => prev.map(u => u.username === username ? { ...u, password: newRaw, must_change_password: true } : u));
      logAction("RESET_PASSWORD", "USER", username);
      setResetSuccessInfo({ username, password: newRaw });
    } catch (err) {
      showSystemAlert("Erro ao resetar: " + err.message, { title: "Erro ao resetar", type: "error" });
    }
  };

  const parentOpts = useMemo(() => {
    const opts = [];
    const traverse = (nodeId, depth) => {
      if (nodeId === editNodeId) return; // Prevent cycles
      const n = nodeMap.get(nodeId);
      if (n) opts.push({ ...n, depth });
      const children = childrenMap.get(nodeId) || [];
      children.forEach(c => traverse(c.id, depth + 1));
    };
    const roots = childrenMap.get("root-parent") || [];
    roots.forEach(r => traverse(r.id, 0));
    return opts;
  }, [editNodeId, childrenMap, nodeMap]);
  const handleEditFromCard = useCallback((nodeId) => {
    if (canEdit) {
      const n = nodeMap.get(nodeId);
      if (!n) return;
      setEditNodeId(nodeId);
      setNodeForm({ ...n, parentId: n.parentId || "none" });
      setOpenNodeDlg(true);
    } else {
      setPendingEditNodeId(nodeId);
      setOpenLoginDlg(true);
    }
  }, [canEdit, nodeMap]);

  const handleAddFromCard = useCallback((parentId) => {
    if (canEdit) {
      openNewNode(parentId);
    } else {
      setOpenLoginDlg(true);
    }
  }, [canEdit, openNewNode]);

  const handleExpand = useCallback((nodeId) => {
    // data-node-id is ON the .org-card div itself, not a parent wrapper
    // Wait for React to render expanded children before measuring positions
    setTimeout(() => {
      const vp = vpRef.current;
      if (!vp) return;
      const el = vp.querySelector(`.org-card[data-node-id="${nodeId}"]`);
      if (el) {
        const vpRect = vp.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const dx = elRect.left - vpRect.left + vp.scrollLeft - (vpRect.width / 2) + (elRect.width / 2);
        const dy = elRect.top - vpRect.top + vp.scrollTop - (vpRect.height / 2) + (elRect.height / 2);
        vp.scrollTo({ left: Math.max(0, dx), top: Math.max(0, dy), behavior: "smooth" });
      }
    }, 400);
  }, []);

  const handleReturnFromFocus = useCallback(() => {
    setFocusId(null);
  }, []);

  const handleExpandAllBelow = useCallback((nodeId) => {
    const ids = new Set(getDescendantIds(nodeId, getChildren));
    setExpandedSet(ids);
    // center on the triggering node after render
    setTimeout(() => {
      const vp = vpRef.current;
      if (!vp) return;
      const el = vp.querySelector(`.org-card[data-node-id="${nodeId}"]`);
      if (el) {
        const vpRect = vp.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const dx = elRect.left - vpRect.left + vp.scrollLeft - vpRect.width / 2 + elRect.width / 2;
        const dy = elRect.top - vpRect.top + vp.scrollTop - vpRect.height / 2 + elRect.height / 2;
        vp.scrollTo({ left: Math.max(0, dx), top: Math.max(0, dy), behavior: "smooth" });
      }
    }, 600);
  }, [getChildren]);

  const handleExportPdf = useCallback(async () => {
    const el = document.querySelector(".tree-viewport-inner");
    if (!el) return;
    flash("Gerando PDF...");
    try {
      const padding = 48; // px of white space around content
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafd",
        scrollX: 0, scrollY: 0,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      // Create padded canvas
      const padded = document.createElement("canvas");
      padded.width  = canvas.width  + padding * 2 * 2; // scale=2 so double padding
      padded.height = canvas.height + padding * 2 * 2;
      const ctx = padded.getContext("2d");
      ctx.fillStyle = "#f8fafd";
      ctx.fillRect(0, 0, padded.width, padded.height);
      
      ctx.drawImage(canvas, padding * 2, padding * 2);

      const imgData = padded.toDataURL("image/png");
      const pdfW = padded.width  / 2;
      const pdfH = padded.height / 2;
      const pdf = new jsPDF({
        orientation: pdfW > pdfH ? "landscape" : "portrait",
        unit: "px",
        format: [pdfW, pdfH],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      const label = rootNode?.name || focused?.name || "organograma";
      pdf.save(`${label.replace(/[^a-z0-9]/gi, "_")}_organograma.pdf`);
            flash("PDF exportado!");
    } catch (e) {
      console.error(e);
      flash("Erro ao gerar PDF.");
    }
  }, [rootNode, focused, flash]);

  if (isLoadingCloud) {
    return (
      <div className="loading-screen" style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "#f8fafc" }}>
        <div className="spinner" style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTopColor: "var(--p600)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--n700)" }}>Carregando dados do organograma...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* \u2500\u2500\u2500\u2500 FIXED HEADER \u2500\u2500\u2500\u2500 */}
      <header className="app-header">
        <div className="header-row-1">
          <div className="header-brand">
            <div className="header-icon" style={{ padding: 0, overflow: "hidden", background: "transparent", width: 44, height: 44 }}>
              <img src={dmaeNode?.foto || "/logo-dmae.png"} alt="DMAE" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div className="header-title">Organograma DMAE</div>
              <div className="header-sub">Prefeitura de Porto Alegre</div>
            </div>
            {/* Cloud Status Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 16, padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: cloudStatus === "online" ? "#4ade80" : cloudStatus === "offline" ? "#f87171" : "#fbbf24" }}></div>
               <span style={{ color: "white" }}>{cloudStatus === "online" ? "DATABASE CLOUD" : cloudStatus === "offline" ? "MODO LOCAL" : "CONECTANDO..."}</span>
            </div>
          </div>
          <div className="header-controls">
            <div className="hdr-search">
              <Search size={12} />
              <input placeholder="Buscar estrutura ou pessoa..." value={query} onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setQFocused(true)} onBlur={() => setTimeout(() => setQFocused(false), 200)} />
              {qFocused && searchResults.length > 0 && (
                <div className="search-drop">
                  {searchResults.map((it) => (
                    <button key={it.id + it.resultType} className="search-item" onMouseDown={() => {
                      if (it.resultType === "person") {
                        setShowPersonDetail(it.id);
                      } else if (it.resultType === "contract") {
                        setContractFilter(it.sei); setOpenContractDlg("registry");
                      } else {
                        selectNode(it.id); setFocusId(it.id);
                      }
                      setQuery("");
                    }}>
                      <div className="av" style={{ width: 28, height: 28, minWidth: 28, borderRadius: 6 }}>
                        {it.resultType === "contract" ? <ClipboardList size={14} /> : (it.foto ? <img src={it.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 8 }}>{initials(it.name)}</span>)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="search-item-name">
                          {it.name} {it.resultType === "person" && <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>(Pessoa)</span>}
                          {it.resultType === "contract" && (
                            <span style={{ marginLeft: 4, fontSize: 9, padding: "2px 4px", borderRadius: 4, background: getContractStatus(it) === "active" ? "#d1fae5" : getContractStatus(it) === "expiring" ? "#ffedd5" : "#fee2e2", color: getContractStatus(it) === "active" ? "#065f46" : getContractStatus(it) === "expiring" ? "#9a3412" : "#991b1b" }}>
                              {getContractStatus(it) === "active" ? "Ativo" : getContractStatus(it) === "expiring" ? "A Vencer" : "Vencido"}
                            </span>
                          )}
                        </div>
                        <div className="search-item-sub">{it.resultType === "person" ? it.cargo : it.resultType === "contract" ? (it.objeto?.substring(0, 60) + "...") : (it.description || it.funcao || it.cargo)}</div>
                        {it.resultType === "contract" && it.itens && <div style={{ fontSize: 8, color: "var(--n400)" }}>Itens: {it.itens.substring(0, 50)}...</div>}
                        {it.resultType === "person" && it.contracts?.length > 0 && it.contracts.map((c, idx) => (
                          <div key={c?.sei || idx} style={{ fontSize: 8, color: "var(--n400)" }}>Contrato: {c?.sei || "N/A"} - {c?.tipo || ""}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="view-toggle">
              <button className={viewMode === "tree" ? "active" : ""} onClick={() => setViewMode("tree")}><Network size={12} /> <span className="hide-mobile">Árvore</span></button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List size={12} /> <span className="hide-mobile">Lista</span></button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { setFocusId(null); setSelectedId(null); setShowDetail(false); }}>
              <Home size={12} /> <span className="hide-mobile">Início</span>
            </button>
            
            {currentUser && (
              <div className="dropdown-container">
                <button className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  <Menu size={12} /> <span className="hide-mobile">Opções</span>
                </button>
                {mobileMenuOpen && (
                  <div className="dropdown-menu" onClick={() => setMobileMenuOpen(false)}>
                    <div className="dropdown-header">Pessoas</div>
                    {canEdit && <button className="dropdown-item" onClick={() => setOpenPersonDlg("registry")}><Users size={12} /> Cadastro de pessoas</button>}
                    {canEdit && isAdmin && (
                      <button className="dropdown-item" onClick={() => setOpenUsersDlg(true)}>
                        <ShieldCheck size={12} /> Cadastro de Usuarios
                      </button>
                    )}

                    <div className="dropdown-header">Contratos</div>
                    <button className="dropdown-item" onClick={() => { setContractFilter(""); setOpenContractDlg("registry"); }}><ClipboardList size={12} /> Contratos cadastrados</button>

                    <div className="dropdown-header">Ativos</div>
                    {isProtected && <button className="dropdown-item" onClick={openAssetRegistry}><Package size={12} /> Ativos cadastrados</button>}
                    {isProtected && <button className="dropdown-item" onClick={openAssetRegistry}><Settings size={12} /> Gestão de ativos</button>}
                    {canEdit && <button className="dropdown-item" onClick={() => setOpenAssetTypesDlg(true)}><Settings size={12} /> Gestão de Tipos de ativos</button>}

                    <div className="dropdown-header">Arquivos</div>
                    <label className="dropdown-item" style={{ cursor: "pointer" }}><Upload size={12} /> Importar JSON<input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} /></label>
                    <button className="dropdown-item" onClick={expJson}><Download size={12} /> Exportar JSON</button>

                    <div className="dropdown-header">Conta</div>
                    {canEdit && <button className="dropdown-item" onClick={() => setOpenPasswordDlg(true)}><KeyRound size={12} /> Trocar senha</button>}
                    {isAdmin && (
                      <button className="dropdown-item" onClick={() => setOpenStatsDlg(true)}>
                        <PieChart size={12} /> Estatísticas de Acesso
                      </button>
                    )}
                    {isAdmin && (
                      <button className="dropdown-item" onClick={async () => {
                        if (supabase) {
                          const { data, error } = await supabase
                            .from('audit_logs')
                            .select('*')
                            .order('created_at', { ascending: false })
                            .limit(500);
                          if (data) {
                            setLogs(data.map(l => ({
                              id: l.id,
                              timestamp: new Date(l.created_at).toLocaleString('pt-BR'),
                              user: l.user_name,
                              action: l.action,
                              target: `${l.target_type}: ${l.target_name}`
                            })));
                          }
                        }
                        setOpenLogsDlg(true);
                      }}>
                        <History size={12} /> Histórico de Logs (BD)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentUser ? (
              <button className="btn btn-primary btn-sm" onClick={() => { logAction("Logout", "USER", currentUser?.username); setCanEdit(false); setCurrentUser(null); }}>
                <LogOut size={12} /> <span className="hide-mobile">Sair ({currentUser?.name || currentUser?.username || "Usuário"})</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setOpenLoginDlg(true)}>
                <KeyRound size={12} /> <span className="hide-mobile">Entrar</span>
              </button>
            )}
          </div>
        </div>

        <div className="header-row-2">
          {(isProtected || canEdit) && (<><span className="stat-pill" title="Pessoas alocadas nesta ramificação"><Users size={11} /> {treeStats.totalPessoas} Pessoas (Ref.)</span>
          <span className="stat-pill" title="Estruturas nesta ramificação"><Building2 size={11} /> {treeStats.totalEstruturas} Estruturas</span>
          <span className="stat-pill" title="Ativos nesta ramificação"><ClipboardList size={11} /> {treeStats.totalAtivos} Ativos</span></>)}

          {breadcrumb.length > 0 && <>
            <span style={{ width: 1, height: 18, background: "var(--n200)", margin: "0 4px" }} />
            {breadcrumb.map((it, i) => (
              <React.Fragment key={it.id}>
                <button className={`bc-item ${selectedId === it.id ? "active" : ""}`}
                  onClick={() => { selectNode(it.id); setFocusId(it.id); }}>{it.name}</button>
                {i < breadcrumb.length - 1 && <span className="bc-sep">/</span>}
              </React.Fragment>
            ))}
          </>}
        </div>
      </header>

      {/* \u2500\u2500\u2500 MAIN \u2500\u2500\u2500 */}
      <div className="main-content">
        {viewMode === "tree" ? (
          <div className="tree-viewport" ref={vpRef} style={{ position: "relative", touchAction: "none" }}>
            {/* Focus mode chip \u2014 floating, elegant */}
            {focusId && focusId !== rootNode?.id && (
              <div style={{
                position: "fixed", top: 135, left: "50%",
                transform: "translateX(-50%)",
                zIndex: 150, pointerEvents: "auto",
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(30,64,175,0.92)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "#fff", borderRadius: 999,
                padding: "6px 8px 6px 14px",
                fontSize: 11, fontWeight: 600,
                boxShadow: "0 8px 24px rgba(30,64,175,.4), 0 1px 4px rgba(0,0,0,.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                whiteSpace: "nowrap",
              }}>
                <Network size={12} />
                <span>Foco: <strong>{focused?.name}</strong></span>
                
                {focused?.parentId && (
                  <button className="btn btn-outline btn-xs" 
                    onClick={() => { setFocusId(focused.parentId); setSelectedId(focused.parentId); }}
                    style={{ marginLeft: 8, padding: "3px 10px", fontSize: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    <ArrowUp size={10} /> {"Subir Nível"}
                  </button>
                )}

                <button className="btn btn-outline btn-xs" onClick={handleReturnFromFocus}
                  style={{ marginLeft: 4, padding: "3px 10px", fontSize: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Undo2 size={10} /> Sair do Foco
                </button>
              </div>
            )}
            <div className="zoom-ctrls" style={{ position: "fixed", bottom: 80, left: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 50 }}>
              <button className="btn btn-outline" title="Aumentar zoom" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(z => Math.min(2, z + 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>+</span></button>
              <button className="btn btn-outline" title="Zoom 100%" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(1)}><span style={{ fontSize: 12, fontWeight: "bold" }}>{Math.round(zoom * 100)}%</span></button>
              <button className="btn btn-outline" title="Diminuir zoom" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>-</span></button>
              <div style={{ height: 1, background: "var(--n200)", margin: "0 4px" }} />
              <button
                className="btn btn-outline"
                title="Exportar organograma visível como PDF de alta qualidade"
                style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }}
                onClick={handleExportPdf}
              >
                <Printer size={15} />
              </button>
            </div>
            <div className="tree-viewport-inner" style={{ paddingTop: focusId ? 60 : 0,  transform: `scale(${zoom})`, transition: isDragging.current ? "none" : "transform 0.15s ease-out" }}>
              {focused && (
                <div className="tree">
                  <ul>
                    <OrgBranch
                      node={focused} getChildren={getChildren} personMap={personMap}
                      selectedId={selectedId} onSelect={selectNode}
                      onAddChild={handleAddFromCard} onEditNode={handleEditFromCard}
                      onExpand={handleExpand} onShowPerson={setShowPersonDetail}
                      onExpandAll={handleExpandAllBelow}
                      directAssetCount={directAssetCount}
                      directEmergencyCount={directEmergencyCount}
                      directMaintenanceCount={directMaintenanceCount}
                      directEmergencyMaintenanceCount={directEmergencyMaintenanceCount}
                      canEdit={canEdit} isProtected={isProtected} parentHex={null}
                      expandedSet={expandedSet}
                      isFocusRoot={!!focusId && focusId !== rootNode?.id}
                      onReturnFromFocus={handleReturnFromFocus}
                      onOpenDashboard={setDashboardNodeId}
                    />
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="list-view">
            <div className="list-toolbar">
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  const currentId = focusId || selectedId;
                  const currentNode = nodeMap.get(currentId);
                  if (currentNode?.parentId) {
                    setFocusId(currentNode.parentId);
                    setSelectedId(currentNode.parentId);
                  }
                }}
                disabled={!nodeMap.get(focusId || selectedId)?.parentId}
                title="Subir para a estrutura superior"
              >
                <ArrowUp size={12} />
                Subir nível
              </button>

              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  const dmaeNode = nodes.find((n) => n.id === "dmae" || n.name === "DMAE");
                  const rootNode = dmaeNode || nodes.find((n) => !n.parentId) || nodes[0];
                  if (!rootNode) return;
                  setFocusId(rootNode.id);
                  setSelectedId(rootNode.id);
                }}
                title="Fechar foco e voltar ao DMAE"
              >
                <X size={12} />
                Fechar foco
              </button>
            </div>
            <div className="list-view-controls" style={{ padding: "12px 24px", background: "var(--n50)", borderBottom: "1px solid var(--n200)", display: "flex", justifyContent: "flex-end" }}>
              {currentUser && (
                <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, cursor: "pointer", color: onlyEmergency ? "#ef4444" : "var(--n600)" }}>
                  <input type="checkbox" checked={onlyEmergency} onChange={(e) => setOnlyEmergency(e.target.checked)} />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Siren size={16} color="#ef4444" strokeWidth={2.5} fill="#ef4444" fillOpacity={0.1} />
                      <span style={{ fontWeight: "bold" }}>Somente Unidades com Equipamentos</span>
                    </div>
                    <span style={{ fontSize: 10, paddingLeft: 20, opacity: 0.8 }}>alocados para o plano de Contingência</span>
                  </div>
                </label>
              )}
            </div>
            <div className="list-view-content" style={{ padding: 20 }}>
              {focused && (
                onlyEmergency ? (
                  nodes
                    .filter(n => directEmergencyCount(n.id) > 0)
                    .map(n => <ListNode key={n.id} node={n} getChildren={() => []} onSelect={selectNode} directEmergencyCount={directEmergencyCount} directMaintenanceCount={directMaintenanceCount} depth={0} isProtected={isProtected} parentHex={DEFAULT_ROOT_COLOR} expandedSet={expandedSet} onToggleExpandAll={(ids) => setExpandedSet(prev => new Set([...prev, ...ids]))} />)
                ) : (
                  <ListNode node={focused} getChildren={getChildren} onSelect={selectNode} directEmergencyCount={directEmergencyCount} directMaintenanceCount={directMaintenanceCount} isProtected={isProtected} parentHex={DEFAULT_ROOT_COLOR} expandedSet={expandedSet} onToggleExpandAll={(ids) => setExpandedSet(prev => new Set([...prev, ...ids]))} />
                )
              )}
              {onlyEmergency && nodes.filter(n => directEmergencyCount(n.id) > 0).length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--n400)" }}>
                  <ShieldCheck size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p>Nenhuma unidade com ativos de contingência no momento.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* \u2500\u2500\u2500 FLOATING EDIT BUTTON \u2500\u2500\u2500 */}
      <button className={`fab-edit ${canEdit ? "active" : ""}`}
        onClick={() => canEdit ? setCanEdit(false) : setOpenLoginDlg(true)}
        title={canEdit ? "Sair da edição e salvar" : "Entrar na edição"}>
        {canEdit ? <Save size={22} /> : <KeyRound size={22} />}
      </button>

      {/* \u2500\u2500\u2500 DETAIL MODAL (shows when clicking a card) \u2500\u2500\u2500 */}
      {showDetail && selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDetail(false); }}>
          <div className="modal-content wide" style={{ position: "relative" }}>
            <button className="detail-close" onClick={() => setShowDetail(false)}><X size={14} /></button>
            <div className="detail-head">
              {(() => {
                const pObj = selected.personId ? personMap.get(selected.personId) : null;
                const dPhoto = pObj?.foto || selected.foto;
                return (
                  <div className="av av-lg" style={{ cursor: dPhoto ? "zoom-in" : "default" }} onClick={(e) => { if (dPhoto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: dPhoto })); } }}>
                    {dPhoto ? <img src={dPhoto} alt="" /> : <span className="av-fb">{initials(selected?.name || "??")}</span>}
                  </div>
                );
              })()}
              <div className="detail-head-info">
                <div className="detail-name">{selected.name}</div>
                <div className="detail-cargo">{selected.description || selected.cargo}</div>
                <div className="detail-resp" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {selected.responsavel || "---"}
                  {(isProtected || canEdit) && selected.personId && (
                    <button className="btn btn-outline btn-xs btn-icon" style={{ width: 22, height: 22 }} onClick={() => setShowPersonDetail(selected.personId)} title="Ver cadastro completo">
                      <Users size={12} />
                    </button>
                  )}
                </div>
                {(isProtected || canEdit) && <div className="detail-mat">{selected.funcao || "---"} Mat: {selected.matricula || "---"}</div>}
                {(isProtected || canEdit) && (
                  <div className="detail-badges">
                    <span className="badge badge-sec">{selected.tipo}</span>
                    {selected.subtipo === "apoio" && <span className="badge badge-apoio">apoio</span>}
                    {selected.lotacao && <span className="badge badge-out">{selected.lotacao}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="detail-actions" style={{ marginTop: 16, borderTop: "1px solid var(--n100)", paddingTop: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-outline btn-xs" onClick={() => { setFocusId(selected.id); setShowDetail(false); }} title="Centralizar visualização nesta caixa"><Network size={12} /> Foco</button>
                <button className="btn btn-outline btn-xs" onClick={() => { handleExpandAllBelow(selected.id); setShowDetail(false); }} title="Expandir todos os níveis abaixo desta caixa">
                  <ChevronsDown size={12} /> Expandir Tudo
                </button>
                
                {(isProtected || canEdit) && (
                  <>
                    {canEdit && (
                      <button className="btn btn-primary btn-xs" onClick={() => { setShowDetail(false); handleEditFromCard(selected.id); }} title="Editar esta caixa">
                        <Pencil size={12} /> Editar
                      </button>
                    )}
                    <button className="btn btn-outline btn-xs" onClick={() => { setDashboardNodeId(selected.id); setShowDetail(false); }} title="Painel de Contratos">
                      <PieChart size={12} /> Dashboard
                    </button>
                    {canEdit && selected.parentId && (
                      <button className="btn btn-danger btn-xs" onClick={() => requestDeleteNode(selected.id)} title="Excluir esta caixa permanentemente">
                        <Trash2 size={12} /> Excluir Caixa
                      </button>
                    )}
                    {selected.tipo === "estrutura" && (
                      <>
                        <button className="btn btn-outline btn-xs" onClick={() => expCsv(selected.id)} title="Baixar lista em CSV"><Download size={12} /> CSV</button>
                        {(directAssets.length > 0 || scopeAssets.length > 0) && (
                          <button className="btn btn-outline btn-xs" onClick={() => exportAssetsPdf(scopeAssets, selected.name, (id) => nodeMap.get(id)?.name || "N/A")} title="Gerar relatório de ativos em PDF"><Printer size={12} /> PDF</button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {(isProtected || canEdit) && (
              <div className="detail-grid">
                <div className="dg-item"><div className="dg-label">Subordinado a</div><div className="dg-val">{selected.parentId ? nodeMap.get(selected.parentId)?.name : "---"}</div></div>
                <div className="dg-item"><div className="dg-label">Responsável</div><div className="dg-val">{selected.responsavel || "---"}</div></div>
                <div className="dg-item"><div className="dg-label">Matrícula</div><div className="dg-val">{selected.matricula || "---"}</div></div>
                <div className="dg-item"><div className="dg-label">Caixas abaixo</div><div className="dg-val">{getChildren(selected.id).length}</div></div>
                <div className="dg-item">
                  <div className="dg-label">Localização</div>
                  <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(() => {
                      const addr = resolveAddress(selected.id);
                      const full = `${addr.lotacao}${addr.complemento ? `, ${addr.complemento}` : ""}`;
                      return (
                        <>
                          <span style={{ fontSize: 11 }}>${full}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.lotacao)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Ver no Google Maps"
                            style={{ display: "inline-flex", color: "#ef4444" }}
                          >
                            <MapPin size={12} />
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {(() => {
                  const respObj = persons.find(p => p.id === selected.personId);
                  const showEmail = selected.email || respObj?.email || "";
                  const showPhone = selected.telefone || respObj?.telefone || "";
                  return (
                    <>
                      <div className="dg-item">
                        <div className="dg-label"><Mail size={10} /> E-mail</div>
                        <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{showEmail}</span>
                          {showEmail !== "" && <a href={`mailto:${showEmail}`} className="btn-icon-xs" title="Enviar E-mail"><Mail size={12} /></a>}
                        </div>
                      </div>
                      <div className="dg-item">
                        <div className="dg-label"><Phone size={10} /> Telefone</div>
                        <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {showPhone}
                          {showPhone !== "" && (
                            <a href={`https://wa.me/55${showPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-icon-xs" title="WhatsApp">
                              <MessageCircle size={12} color="#25D366" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {selected.observacoes && <div className="detail-obs">{selected.observacoes}</div>}

            {/* Assets in this node - HIDDEN IF NOT LOGGED IN */}
            {(isProtected || canEdit) && (directAssets.length > 0 || canEdit) && (
              <div className="asset-section">
                <div className="asset-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ClipboardList size={13} /> Ativos diretos ({directAssets.length})</div>
                  {canEdit && (
                    <button className="btn btn-primary btn-xs" onClick={() => { setShowDetail(false); openNewAsset(selected.id); }} title="Adicionar novo ativo a esta unidade" style={{ height: 24, fontSize: 10, padding: "0 8px" }}>
                      <Plus size={10} /> Incluir Ativo
                    </button>
                  )}
                </div>
                {directAssets.map((a) => (
                  <div key={a.id} className="asset-mini">
                    <div className="asset-mini-name">{assetIcon(a.category)} {a.name}</div>
                    <div className="asset-mini-meta">{[a.manufacturer, a.model, a.year].filter(Boolean).join(" \u2022 ")}</div>
                    <div className="asset-mini-badges">
                      {a.plate && <span className="badge badge-out">Placa {a.plate}</span>}
                      {a.patrimonio && <span className="badge badge-out">Pat. {a.patrimonio}</span>}
                      <span className={`badge ${a.tipoVinculo === "Contratado" ? "badge-sec" : "badge-out"}`}>{a.tipoVinculo || "Próprio"}</span>
                      {a.isEmergency && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)", flexShrink: 0 }} title="Ativo de Contingência">
                          <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
                        </div>
                      )}
                      {a.isMaintenance && (
                        <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", flexShrink: 0, color: "#d97706" }} title="Ativo em Manutenção/Inoperante">
                          <AlertTriangle size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    {a.tipoVinculo === "Contratado" && (
                      <button className="btn btn-outline btn-xs" style={{ marginTop: 6, width: "100%", justifyContent: "center" }} onClick={() => setShowAssetContractModal(a.id)}>
                        <FileText size={10} /> Ver Contrato
                      </button>
                    )}
                    {canEdit && (
                      <div className="asset-mini-actions">
                        <button className="btn btn-outline btn-xs" onClick={() => { setShowDetail(false); openEditAsset(a); }}><Pencil size={10} /></button>
                        <button className="btn btn-outline btn-xs" onClick={() => deleteAsset(a.id, a.name)}><Trash2 size={10} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Contracts where the responsible person is involved - HIDDEN IF NOT LOGGED IN */}
            {(isProtected || canEdit) && selected.personId && (
              <div className="asset-section">
                <div className="asset-section-title"><ShieldCheck size={13} /> Contratos vinculados ao Responsável</div>
                {(() => {
                  const pContracts = contracts.filter(c =>
                    c.gestor.titularId === selected.personId || c.gestor.suplenteId === selected.personId ||
                    c.fiscaisContrato.some(f => f.titularId === selected.personId || f.suplenteId === selected.personId) ||
                    c.fiscaisServico.some(f => f.titularId === selected.personId || f.suplenteId === selected.personId)
                  );
                  return pContracts.length > 0 ? pContracts.map((c) => (
                    <div key={c.id} className="asset-mini" style={{ background: "var(--n50)" }}>
                      <div className="asset-mini-name">{c.sei}</div>
                      <div className="asset-mini-meta" style={{ fontSize: 10 }}><b>Objeto:</b> {c.objeto}</div>
                      <div className="asset-mini-badges">
                        <span className="badge badge-sec" style={{ fontSize: 8 }}>
                          {c.gestor.titularId === selected.personId || c.gestor.suplenteId === selected.personId ? "Gestor" :
                            c.fiscaisContrato.some(f => f.titularId === selected.personId || f.suplenteId === selected.personId) ? "Fiscal Contrato" : "Fiscal Serviço"}
                        </span>
                      </div>
                    </div>
                  )) : <p style={{ fontSize: 11, color: "var(--n400)" }}>Nenhum contrato direto encontrado para o responsável.</p>;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* \u2500\u2500\u2500 BI DASHBOARD DIALOG \u2500\u2500\u2500 */}
      {(() => {
        if (!dashboardNodeId) return null;
        const dNode = nodes.find(n => n.id === dashboardNodeId);
        if (!dNode) return null;

        const descIds = getDescendantIds(dashboardNodeId, getChildren).filter(x => x !== dashboardNodeId);
        
        // Data Collections
        const dContracts = contracts.filter(c => c.nodeId === dashboardNodeId);
        const sContracts = contracts.filter(c => descIds.includes(c.nodeId));
        
        const dPersons = nodes.filter(n => n.id === dashboardNodeId && n.personId).map(n => persons.find(p => p.id === n.personId)).filter(Boolean);
        const sPersons = nodes.filter(n => descIds.includes(n.id) && n.personId).map(n => persons.find(p => p.id === n.personId)).filter(Boolean);
        
        const dAssets = assets.filter(a => a.nodeId === dashboardNodeId);
        const sAssets = assets.filter(a => descIds.includes(a.nodeId));
        
        const dStructures = getChildren(dashboardNodeId);
        const sStructures = nodes.filter(n => descIds.includes(n.id));

        const dStats = getDashboardStats(dContracts);
        const cStats = getDashboardStats(sContracts);

        const dEmergency = dAssets.filter(a => a.isEmergency).length;
        const sEmergency = sAssets.filter(a => a.isEmergency).length;
        const dEmergencyMaintenance = dAssets.filter(a => a.isEmergency && a.isMaintenance).length;
        const sEmergencyMaintenance = sAssets.filter(a => a.isEmergency && a.isMaintenance).length;

        const exportPDF = async () => {
          const el = document.getElementById("bi-dashboard-content");
          if(!el) return;
          const canvas = await html2canvas(el, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Relatorio_BI_${dNode.name.replace(/\s/g,'_')}.pdf`);
        };

        const DonutChart = ({ stats, title }) => (
          <div className="bi-chart-box">
             <div className="bi-chart-container">
                <div className="bi-donut" style={{ background: stats.pieCss }}>
                   <div className="bi-donut-hole" />
                </div>
                <div className="bi-total-abs">{stats.total}</div>
             </div>
             <div className="bi-chart-info">
                <h4>{title}</h4>
                <div className="bi-legend-item"><span className="dot" style={{background:"#10b981"}} /> Ativos: <b>{stats.active}</b></div>
                <div className="bi-legend-item"><span className="dot" style={{background:"#f97316"}} /> A Vencer: <b>{stats.expiring}</b></div>
                <div className="bi-legend-item"><span className="dot" style={{background:"#ef4444"}} /> Vencidos: <b>{stats.expired}</b></div>
             </div>
          </div>
        );

        return (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDashboardNodeId(null); }}>
            <div className="modal-content wide bi-dash" id="bi-dashboard-content" style={{ maxWidth: 1000 }}>
              <button className="modal-close no-print" onClick={() => setDashboardNodeId(null)}><X size={12} /></button>
              
              <div className="modal-header bi-header">
                <div style={{display:"flex", alignItems:"center", gap: 12}}>
                   {dashboardView !== "summary" ? (
                     <button className="btn btn-outline btn-icon btn-sm no-print" onClick={() => setDashboardView("summary")} title="Voltar para Resumo">
                        <ChevronLeft size={18} />
                     </button>
                   ) : (
                     <PieChart size={28} color="var(--p600)" />
                   )}
                   <div>
                      <h2 style={{margin:0, fontSize: 22}}>
                        {dashboardView === "emergencyMaintenanceAssets" ? "Ativos de Contingência Inoperantes" : "Dashboard de Governança e BI"}
                      </h2>
                      <p style={{margin:0, opacity:0.8, fontSize: 13}}>Unidade: <b>{dNode.name}</b> {descIds.length > 0 && `(+ ${descIds.length} subunidades)`}</p>
                   </div>
                </div>
                <div className="bi-header-actions no-print">
                   <button className="btn btn-primary btn-xs" onClick={exportPDF}><Download size={14} /> Exportar PDF</button>
                </div>
              </div>

              <div className="modal-body bi-body">
                {dashboardView === "summary" && (
                  <>
                    {/* TOP METRIC CARDS */}
                     <div className="bi-grid-cards" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                        <div className="bi-card">
                           <div className="bi-card-icon" style={{background:"#dbeafe", color:"#2563eb"}}><Users size={18} /></div>
                           <div className="bi-card-data">
                              <div className="bi-card-label">Força de Trabalho</div>
                              <div className="bi-card-main">{dPersons.length + sPersons.length}</div>
                              <div className="bi-card-sub">Direto: {dPersons.length} | Indireto: {sPersons.length}</div>
                           </div>
                        </div>
                        <div className="bi-card">
                           <div className="bi-card-icon" style={{background:"#fef3c7", color:"#d97706"}}><Package size={18} /></div>
                           <div className="bi-card-data">
                              <div className="bi-card-label">Patrimônio / Ativos</div>
                              <div className="bi-card-main">{dAssets.length + sAssets.length}</div>
                              <div className="bi-card-sub">Direto: {dAssets.length} | Indireto: {sAssets.length}</div>
                           </div>
                        </div>
                        <div className="bi-card" style={{ border: dEmergency + sEmergency > 0 ? "1px solid #fee2e2" : "1px solid var(--n200)" }}>
                           <div className="bi-card-icon" style={{background:"#fee2e2", color:"#ef4444"}}><Siren size={18} /></div>
                           <div className="bi-card-data">
                              <div className="bi-card-label">Ativos de Contingência</div>
                              <div className="bi-card-main" style={{ color: dEmergency + sEmergency > 0 ? "#ef4444" : "inherit" }}>{dEmergency + sEmergency}</div>
                              <div className="bi-card-sub">Direto: {dEmergency} | Indireto: {sEmergency}</div>
                           </div>
                        </div>
                        <div className="bi-card warning" 
                             style={{ border: (dEmergencyMaintenance + sEmergencyMaintenance) > 0 ? "1px solid #f59e0b" : "1px solid var(--n200)", cursor: "pointer" }}
                             onClick={() => setDashboardView("emergencyMaintenanceAssets")}
                        >
                           <div className="bi-card-icon"><AlertTriangle size={18} /></div>
                           <div className="bi-card-data">
                              <div className="bi-card-label">Contingência em Manutenção</div>
                              <div className="bi-card-main">{(dEmergencyMaintenance + sEmergencyMaintenance)}</div>
                              <div className="bi-card-sub">Críticos Inoperantes: {(dEmergencyMaintenance + sEmergencyMaintenance)}</div>
                           </div>
                        </div>
                        <div className="bi-card">
                           <div className="bi-card-icon" style={{background:"#dcfce7", color:"#16a34a"}}><Building2 size={18} /></div>
                           <div className="bi-card-data">
                              <div className="bi-card-label">Subunidades</div>
                              <div className="bi-card-main">{dStructures.length + sStructures.length}</div>
                              <div className="bi-card-sub">Nível 1: {dStructures.length} | Profundas: {sStructures.length}</div>
                           </div>
                        </div>
                     </div>

                    <div className="bi-row" style={{marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                       <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid var(--n200)" }}>
                          <h3 className="bi-section-title" style={{ marginBottom: 15, fontSize: 14 }}>Status dos Contratos (Diretos)</h3>
                          <DonutChart stats={dStats} title="Foco: Unidade Atual" />
                       </div>
                       <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid var(--n200)" }}>
                          <h3 className="bi-section-title" style={{ marginBottom: 15, fontSize: 14 }}>Status dos Contratos (Subordinados)</h3>
                          <DonutChart stats={cStats} title="Foco: Hierarquia Abaixo" />
                       </div>
                    </div>

                    <div style={{ marginTop: 25, padding: 15, background: "var(--n50)", borderRadius: 10, fontSize: 12, color: "var(--n600)", border: "1px dashed var(--n300)" }}>
                       <b>Nota de BI:</b> Os dados acima representam uma consolidação em tempo real da estrutura selecionada. Ativos marcados como <i>Contingência</i> recebem prioridade de manutenção e reposição conforme política do DMAE.
                    </div>
                  </>
                )}

                {dashboardView === "emergencyMaintenanceAssets" && (
                  <div className="bi-list-view">
                    <div className="bi-alert-critical" style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: 12, borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#b91c1c" }}>
                      <Siren size={20} />
                      <div style={{ fontSize: 13, fontWeight: 700 }}>ATENÇÃO: Existem ativos estratégicos fora de operação nesta ramificação.</div>
                    </div>
                    
                    <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead style={{ background: "var(--n50)" }}>
                          <tr>
                            <th style={{ padding: 12, textAlign: "left" }}>Ativo</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Tipo</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Unidade</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Responsável pela Contingência</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Telefone de Emergência</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Observação da Manutenção</th>
                            <th style={{ padding: 12, textAlign: "center" }}>Desde</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...dAssets, ...sAssets].filter(a => a.isEmergency && a.isMaintenance).length > 0 ? (
                            [...dAssets, ...sAssets].filter(a => a.isEmergency && a.isMaintenance).map(a => (
                              <tr key={a.id} style={{ borderTop: "1px solid var(--n100)" }}>
                                <td style={{ padding: 12 }}>
                                  <div style={{ fontWeight: 700, color: "#b91c1c" }}>{a.name}</div>
                                </td>
                                <td style={{ padding: 12 }}>{a.type || "—"}</td>
                                <td style={{ padding: 12 }}>{nodes.find(n => n.id === a.nodeId)?.name || "—"}</td>
                                <td style={{ padding: 12, fontWeight: 600 }}>{a.contatoResponsavel || "—"}</td>
                                <td style={{ padding: 12 }}>
                                  {a.contatoAcionamento || "—"}
                                  {a.contatoAcionamento && (
                                    <a href={`https://wa.me/55${a.contatoAcionamento.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6, color: "#25D366", display: "inline-flex", verticalAlign: "middle" }} title="WhatsApp">
                                      <MessageCircle size={14} />
                                    </a>
                                  )}
                                </td>
                                <td style={{ padding: 12, fontSize: 10 }}>{a.maintenanceNotes || "—"}</td>
                                <td style={{ padding: 12, textAlign: "center" }}>
                                  {a.maintenanceSince ? new Date(a.maintenanceSince).toLocaleDateString('pt-BR') : "—"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "var(--n400)" }}>Nenhum ativo de contingência em manutenção.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer no-print">
                <button className="btn btn-outline btn-xs" onClick={() => setDashboardNodeId(null)}>Fechar Dashboard</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* \u2500 \u2500 \u2500 LOGIN MODAL \u2500 \u2500 \u2500 */}
      {openLoginDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setOpenLoginDlg(false); setPendingEditNodeId(null); } }}>
          <div className="modal-content narrow">
            <button className="modal-close" onClick={() => { setOpenLoginDlg(false); setPendingEditNodeId(null); }}><X size={12} /></button>
            <div className="modal-header">
              <h2>Acesso ao Sistema</h2>
              <p style={{ fontSize: 11, color: "var(--n600)", marginTop: 4 }}>
                Insira suas credenciais de Editor/Admin ou sua <b>Matrícula</b> (como login e senha) para visualização interna completa.
              </p>
            </div>
            <div className="modal-body">
              <div className="fg"><label className="fl">Usuário (Login)</label><input className="fi" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} /></div>
              <div className="fg"><label className="fl">Senha</label><input className="fi" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && document.getElementById('do-login-btn')?.click()} /></div>
              {loginErr && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{loginErr}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => { setOpenLoginDlg(false); setPendingEditNodeId(null); }}>Cancelar</button>
              <button id="do-login-btn" className="btn btn-primary btn-xs" onClick={async () => {
                setLoginErr("");
                const p = persons.find(x => x.matricula === loginUser && x.matricula === loginPass);
                if (loginUser && p) {
                  const sessionUser = { username: p.matricula, name: p.name, role: 'viewer' };
                  setCurrentUser(sessionUser); setCanEdit(false); setOpenLoginDlg(false);
                  flash(`Bem-vindo, ${p.name}! Acesso de visualização interna liberado.`);
                  logAction("Login Visualizador", "PERSON", p.name); return;
                }
                try {
                  const { data: latestUsers, error: fErr } = await supabase.from('users').select('*');
                  if (fErr || !latestUsers) return setLoginErr("Erro de conexão. Tente novamente.");
                  const u = latestUsers.find(x => x.username.toLowerCase() === loginUser.toLowerCase() && x.password === loginPass);
                  if (u) {
                    const sessionUser = { ...u, username: u.username || loginUser, role: u.role || (u.username.toLowerCase() === 'admin' ? 'admin' : 'editor') };
                    setCurrentUser(sessionUser); setCanEdit(true); setOpenLoginDlg(false); logAction('LOGIN_SUCCESS', 'USER', sessionUser.username);
                    if (pendingEditNodeId) { 
                      const nodeRecord = nodes.find(n => n.id === pendingEditNodeId);
                      if (nodeRecord) { setEditNodeId(pendingEditNodeId); setNodeForm(nodeRecord); setOpenNodeDlg(true); }
                      setPendingEditNodeId(null); 
                    }
                  } else { setLoginErr("Usuário ou senha inválidos."); }
                } catch (e) { setLoginErr("Erro ao validar credenciais."); }
              }}>Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* \u2500 \u2500 \u2500 NODE DIALOG (Create/Edit) \u2500 \u2500 \u2500 */}
      {openNodeDlg && (
        <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenNodeDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenNodeDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>{editNodeId ? "Editar Caixa" : "Nova Caixa"}</h2>
              <p>Defina as propriedades da estrutura ou pessoa no organograma.</p>
            </div>
            <div className="modal-body">
              <div className="fr">
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Tipo de Caixa</label>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button type="button" className={`btn btn-xs ${nodeForm.tipo === "estrutura" ? "btn-primary" : "btn-outline"}`} onClick={() => setNodeForm((current) => ({ ...current, tipo: "estrutura", subtipo: current.subtipo }))}>Estrutura</button>
                    <button type="button" className={`btn btn-xs ${nodeForm.tipo === "pessoa" ? "btn-primary" : "btn-outline"}`} onClick={() => setNodeForm((current) => ({ ...current, tipo: "pessoa", subtipo: "subordinada" }))}>Pessoa</button>
                  </div>
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Posicionamento</label>
                  <select className="fi" value={nodeForm.subtipo} onChange={(e) => setNodeForm({ ...nodeForm, subtipo: e.target.value })}>
                    <option value="subordinada">Subordinada (Abaixo)</option>
                    <option value="apoio">Apoio (Lateral)</option>
                  </select>
                </div>
              </div>

              {nodeForm.tipo === "estrutura" ? (
                <>
                  <div className="fg">
                    <label className="fl">Sigla da Estrutura</label>
                    <input
                      className="fi"
                      value={nodeForm.name || ""}
                      onChange={(e) =>
                        setNodeForm({
                          ...nodeForm,
                          name: e.target.value.toUpperCase()
                        })
                      }
                      placeholder="Ex.: CGOMIP, D-PCCDU, EQ-MECP"
                    />
                  </div>
                  <div className="fg">
                    <label className="fl">Nome por extenso / descrição da estrutura</label>
                    <input
                      className="fi"
                      value={nodeForm.description || ""}
                      onChange={(e) =>
                        setNodeForm({
                          ...nodeForm,
                          description: e.target.value
                        })
                      }
                      placeholder="Ex.: Coordenação-Geral de Operação e Manutenção Industrial"
                    />
                  </div>
                  <PersonSelector
                    label="Responsável pela estrutura"
                    valueId={nodeForm.personId}
                    persons={persons}
                    nodes={nodes}
                    currentNodeId={editNodeId || nodeForm.id || ""}
                    enforceNodeOccupation={true}
                    onSelect={(personId) => {
                      const selectedPerson = persons.find((p) => p.id === personId);
                      setNodeForm((current) => ({
                        ...current,
                        tipo: "estrutura",
                        personId,
                        responsavel: selectedPerson?.name || current.responsavel,
                        matricula: selectedPerson?.matricula || current.matricula,
                        funcao: selectedPerson?.cargo || current.funcao,
                        email: selectedPerson?.email || current.email,
                        telefone: selectedPerson?.telefone || current.telefone,
                        ramal: selectedPerson?.ramal || current.ramal,
                        foto: selectedPerson?.foto || current.foto
                      }));
                    }}
                    onClear={() =>
                      setNodeForm((current) => ({
                        ...current,
                        personId: "",
                        responsavel: "",
                        matricula: "",
                        funcao: "",
                        email: "",
                        telefone: "",
                        ramal: "",
                        foto: ""
                      }))
                    }
                  />
                </>
              ) : (
                <PersonSelector
                  label="Pessoa vinculada à caixa"
                  valueId={nodeForm.personId}
                  persons={persons}
                  nodes={nodes}
                  currentNodeId={editNodeId || nodeForm.id || ""}
                  enforceNodeOccupation={true}
                  onSelect={(personId) => {
                    const selectedPerson = persons.find((p) => p.id === personId);
                    setNodeForm((current) => ({
                      ...current,
                      tipo: "pessoa",
                      personId,
                      name: selectedPerson?.name || current.name,
                      responsavel: selectedPerson?.name || current.responsavel,
                      matricula: selectedPerson?.matricula || current.matricula,
                      funcao: selectedPerson?.cargo || current.funcao,
                      description: selectedPerson?.cargo || current.description,
                      email: selectedPerson?.email || current.email,
                      telefone: selectedPerson?.telefone || current.telefone,
                      ramal: selectedPerson?.ramal || current.ramal,
                      foto: selectedPerson?.foto || current.foto
                    }));
                  }}
                  onClear={() =>
                    setNodeForm((current) => ({
                      ...current,
                      personId: "",
                      name: "",
                      responsavel: "",
                      matricula: "",
                      funcao: "",
                      description: "",
                      email: "",
                      telefone: "",
                      ramal: "",
                      foto: ""
                    }))
                  }
                />
              )}

              <div className="fr">
                <div className="fg"><label className="fl">Função/Cargo na Caixa</label><input className="fi" value={nodeForm.funcao || ""} onChange={(e) => setNodeForm({ ...nodeForm, funcao: e.target.value.toUpperCase() })} placeholder="Ex.: Coordenador-Geral, Diretor, Gerente, Chefe de Equipe" /></div>
                <div className="fg"><label className="fl">Cor de Destaque (Hex)</label>
                  <div className="color-row">
                    <input type="color" className="color-sw" value={nodeForm.color || DEFAULT_ROOT_COLOR} onChange={(e) => setNodeForm({ ...nodeForm, color: e.target.value })} />
                    <input className="color-hex" value={nodeForm.color || ""} placeholder={DEFAULT_ROOT_COLOR} onChange={(e) => setNodeForm({ ...nodeForm, color: e.target.value })} />
                    {nodeForm.color && (
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        style={{ padding: "0 8px", height: 28, fontSize: 10, flexShrink: 0 }}
                        title="Remover cor personalizada e usar herança do pai"
                        onClick={() => setNodeForm({ ...nodeForm, color: "" })}
                      >
                        ✕ Herdar
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--n400)", marginTop: 4 }}>
                    {nodeForm.color ? "Cor personalizada definida. Subordinadas herdam esta cor com degradação." : "Sem cor própria — herda do nó superior com clareamento automático."}
                  </div>
                </div>
              </div>

              <div className="fr">
                <div className="fg"><label className="fl">Endereço de Lotação</label><input className="fi" value={nodeForm.lotacao} onChange={(e) => setNodeForm({ ...nodeForm, lotacao: e.target.value })} placeholder="Ex: Rua 24 de Outubro, 200" /></div>
                <div className="fg"><label className="fl">Complemento</label><input className="fi" value={nodeForm.complemento} onChange={(e) => setNodeForm({ ...nodeForm, complemento: e.target.value })} placeholder="Ex: 3º Andar, Sala 10" /></div>
              </div>

              <div className="fg"><label className="fl">Atribuições e Competências (Tags/Texto)</label><textarea className="ft" value={nodeForm.atribuicoes} onChange={(e) => setNodeForm({ ...nodeForm, atribuicoes: e.target.value })} placeholder="Descreva as competências desta unidade..." /></div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <div>
                {editNodeId && nodeForm.parentId && (
                  <button className="btn btn-danger btn-xs" onClick={() => requestDeleteNode(editNodeId)}>
                    <Trash2 size={12} /> Excluir permanentemente
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-outline btn-xs" onClick={() => setOpenNodeDlg(false)}>Cancelar</button>
                <button className="btn btn-primary btn-xs" onClick={saveNode}><Save size={12} /> Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ ASSET DIALOG ═─ ═─ ═─ */}
      {openAssetDlg && (
        <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenAssetDlg(false); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setOpenAssetDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>{editAssetId ? "Editar Ativo" : "Cadastrar Ativo"}</h2>
              <p>Gerencie informações de veículos, equipamentos e ferramentas.</p>
            </div>
            <div className="modal-body">
              <div className="fg" style={{ marginBottom: 16 }}>
                <label className="fl">Unidade de Alocação / Lotação *</label>
                <NodeSelector 
                  value={assetForm.nodeId} 
                  nodes={nodes} 
                  onChange={(val) => setAssetForm({ ...assetForm, nodeId: val })} 
                />
                {!assetForm.nodeId && <span style={{ fontSize: 10, color: "#ef4444" }}>Obrigatório selecionar o local no organograma para salvar.</span>}
              </div>
              <div className="fr">
                <div className="fg" style={{ flex: 1 }}><label className="fl">Tipo de Vínculo *</label>
                  <select className="fi" value={assetForm.tipoVinculo} onChange={(e) => setAssetForm({ ...assetForm, tipoVinculo: e.target.value })}>
                    <option value="Próprio">Próprio</option>
                    <option value="Contratado">Contratado</option>
                  </select>
                </div>
                <div className="fg" style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", color: "#ef4444", fontWeight: "bold" }}>
                    <input type="checkbox" checked={assetForm.isEmergency} onChange={(e) => setAssetForm({ ...assetForm, isEmergency: e.target.checked })} /> Contingência?
                  </label>
                </div>
              </div>

              {assetForm.isEmergency && (
                <div className="asset-emergency-box">
                  <div className="section-title">
                    <Siren size={16} />
                    Dados de Acionamento de Contingência
                  </div>

                  <div className="form-grid two">
                    <div className="fg">
                      <label className="fl">Responsável pela Contingência *</label>
                      <input
                        className="fi"
                        value={assetForm.contatoResponsavel || ""}
                        onChange={(e) =>
                          setAssetForm((current) => ({
                            ...current,
                            contatoResponsavel: e.target.value
                          }))
                        }
                        placeholder="Ex.: Nome do responsável, equipe ou fiscal"
                      />
                    </div>

                    <div className="fg">
                      <label className="fl">Telefone de Emergência / Acionamento *</label>
                      <input
                        className="fi"
                        value={assetForm.contatoAcionamento || ""}
                        onChange={(e) =>
                          setAssetForm((current) => ({
                            ...current,
                            contatoAcionamento: e.target.value
                          }))
                        }
                        placeholder="Ex.: (51) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="hint-text">
                    Informe o responsável e o telefone que deve ser acionado em caso de emergência, catástrofe ou operação de contingência.
                  </div>
                </div>
              )}

              <div className="fr">
                <div className="fg" style={{ flex: 1 }}><label className="fl">Grupo *</label>
                  <div style={{ display: "flex", gap: 4, width: "100%" }}>
                    <select className="fi" value={assetForm.category} style={{ textTransform: "capitalize" }} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}>
                      {Array.from(new Set(assetTypes.map(t => t.category))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {isAdmin && <button className="btn btn-outline btn-xs" type="button" style={{ padding: "0 8px" }} onClick={() => setOpenAssetTypesDlg(true)} title="Gerenciar Grupos/Tipos"><Plus size={12} /></button>}
                  </div>
                </div>
                <div className="fg" style={{ flex: 1 }}><label className="fl">Tipo do Ativo *</label>
                  <div style={{ display: "flex", gap: 4, width: "100%" }}>
                    <select className="fi" value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}>
                      <option value="">Selecione...</option>
                      {assetTypes
                        .filter(t => t.category === assetForm.category)
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    {isAdmin && <button className="btn btn-outline btn-xs" type="button" style={{ padding: "0 8px" }} onClick={() => setOpenAssetTypesDlg(true)} title="Gerenciar Grupos/Tipos"><Plus size={12} /></button>}
                  </div>
                </div>
              </div>
              <div className="fg" style={{ marginTop: 8 }}><label className="fl">Identificação / Nome Curto *</label><input className="fi" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="Ex: Retro 01, Viatura 102..." /></div>

              <div className="fr" style={{ marginTop: 12 }}>
                <div className="fg" style={{ flex: 1 }}>
                  <label className="fl">Telefone / Contato do Ativo (Geral)</label>
                  <input className="fi" value={assetForm.contatoFone || ""} onChange={(e) => setAssetForm({ ...assetForm, contatoFone: e.target.value })} placeholder="Ex: (51) 99999-9999" />
                </div>
              </div>

              {/* Seção de Manutenção */}
              <div style={{ background: assetForm.isMaintenance ? "#fffbeb" : "var(--n50)", padding: 12, borderRadius: 8, border: `1px solid ${assetForm.isMaintenance ? "#fcd34d" : "var(--n200)"}`, marginBottom: 16, marginTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", color: assetForm.isMaintenance ? "#d97706" : "var(--n600)", fontWeight: "bold" }}>
                  <input type="checkbox" checked={assetForm.isMaintenance} onChange={(e) => setAssetForm({ ...assetForm, isMaintenance: e.target.checked })} /> Ativo em Manutenção / Inoperante?
                </label>
                
                {assetForm.isMaintenance && (
                  <div className="fr" style={{ marginTop: 12, alignItems: "flex-start" }}>
                    <div className="fg" style={{ flex: 1 }}>
                      <label className="fl">Em manutenção desde:</label>
                      <input type="date" className="fi" value={assetForm.maintenanceSince ? assetForm.maintenanceSince.substring(0, 10) : ""} onChange={(e) => setAssetForm({ ...assetForm, maintenanceSince: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
                    </div>
                    <div className="fg" style={{ flex: 2 }}>
                      <label className="fl">Notas da Manutenção (Defeito / Local)</label>
                      <input className="fi" value={assetForm.maintenanceNotes || ""} onChange={(e) => setAssetForm({ ...assetForm, maintenanceNotes: e.target.value })} placeholder="Ex: Oficina central, aguardando peça..." />
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional Contract Section */}
              {assetForm.tipoVinculo === "Contratado" && (
                 <div style={{ background: "#fefce8", padding: 12, borderRadius: 8, border: "1px solid #fde047", marginBottom: 16 }}>
                   <div style={{ fontSize: 11, fontWeight: "bold", color: "#854d0e", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                     <ClipboardList size={14} /> DADOS DO CONTRATO (TERCEIRIZADO)
                   </div>

                   {/* SEI com auto-fill */}
                   <div className="fg" style={{ position: "relative" }}>
                     <label className="fl">Nº Processo SEI *</label>
                     <input
                       className="fi"
                       value={assetForm.numeroContrato}
                       placeholder="Digite o SEI ou parte do número..."
                       onChange={(e) => {
                         const val = e.target.value;
                         const match = contracts.find(x => x.sei === val || x.sei.toLowerCase() === val.toLowerCase());
                         if (match) {
                           const fiscalTitular = personMap.get(match.fiscaisContrato?.[0]?.titularId)?.name || "";
                           const fiscalMat = personMap.get(match.fiscaisContrato?.[0]?.titularId)?.matricula || "";
                           setAssetForm({
                             ...assetForm,
                             numeroContrato: match.sei,
                             empresaContratada: match.empresa || "",
                             cnpjContratada: match.cnpj || "",
                             contatoAcionamento: match.contato || "",
                             fiscalContrato: fiscalTitular,
                             matriculaFiscal: fiscalMat,
                           });
                         } else {
                           setAssetForm({ ...assetForm, numeroContrato: val });
                         }
                       }}
                     />
                     {/* Sugestões de SEI */}
                     {assetForm.numeroContrato && assetForm.numeroContrato.length > 2 && (
                       (() => {
                         const sugs = contracts.filter(c =>
                           c.sei.toLowerCase().includes(assetForm.numeroContrato.toLowerCase()) && c.sei !== assetForm.numeroContrato
                         ).slice(0, 5);
                         return sugs.length > 0 ? (
                           <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--n200)", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
                             {sugs.map(c => (
                               <button
                                 key={c.id}
                                 type="button"
                                 onClick={() => {
                                   const fiscal = personMap.get(c.fiscaisContrato?.[0]?.titularId)?.name || "";
                                   const fiscalMat = personMap.get(c.fiscaisContrato?.[0]?.titularId)?.matricula || "";
                                   setAssetForm({ 
                                     ...assetForm, 
                                     numeroContrato: c.sei, 
                                     empresaContratada: c.empresa || "", 
                                     cnpjContratada: c.cnpj || "", 
                                     contatoAcionamento: c.contato || "",
                                     fiscalContrato: fiscal, 
                                     matriculaFiscal: fiscalMat 
                                   });
                                 }}
                                 style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 12, borderBottom: "1px solid var(--n100)" }}
                                 onMouseEnter={e => e.currentTarget.style.background = "var(--n50)"}
                                 onMouseLeave={e => e.currentTarget.style.background = "none"}
                               >
                                 <div style={{ fontWeight: 700 }}>{c.sei}</div>
                                 <div style={{ color: "var(--n500)", fontSize: 11 }}>{c.empresa || c.objeto?.slice(0, 50)}</div>
                               </button>
                             ))}
                           </div>
                         ) : null;
                       })()
                     )}
                   </div>

                   {/* Empresa + CNPJ editáveis */}
                   <div className="fr" style={{ marginTop: 12 }}>
                     <div className="fg" style={{ flex: 1 }}>
                       <label className="fl">Nome da Empresa Contratada *</label>
                       <input className="fi" value={assetForm.empresaContratada || ""} placeholder="Razão social..." onChange={(e) => setAssetForm({ ...assetForm, empresaContratada: e.target.value })} />
                     </div>
                     <div className="fg" style={{ flex: 1 }}>
                       <label className="fl">CNPJ *</label>
                       <input className="fi" value={assetForm.cnpjContratada || ""} placeholder="00.000.000/0000-00" onChange={(e) => setAssetForm({ ...assetForm, cnpjContratada: e.target.value })} />
                     </div>
                   </div>

                   <div className="fr" style={{ marginTop: 12 }}>
                     <div className="fg" style={{ flex: 1 }}>
                       <label className="fl">Contato Empresa (Geral)</label>
                       <input className="fi" value={assetForm.contatoAcionamento || ""} placeholder="Telefone, e-mail ou nome do contato" onChange={(e) => setAssetForm({ ...assetForm, contatoAcionamento: e.target.value })} />
                     </div>
                     <div className="fg" style={{ flex: 1 }}>
                       <label className="fl">Responsável Direto (Condutor/Equipe)</label>
                       <input className="fi" value={assetForm.contatoResponsavel || ""} placeholder="Nome e Telefone direto..." onChange={(e) => setAssetForm({ ...assetForm, contatoResponsavel: e.target.value })} />
                     </div>
                   </div>

                   <div className="fg" style={{ marginTop: 12 }}>
                     <label className="fl">Fiscal Principal (auto)</label>
                     <input className="fi" value={assetForm.fiscalContrato || ""} disabled style={{ background: "var(--n50)" }} />
                   </div>
                 </div>
              )}
              {/* Foto upload section */}
              <div className="fg" style={{ marginTop: 12, marginBottom: 12 }}>
                <label className="fl">Fotos do Ativo (Máx 3)</label>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                   {[0,1,2].map(idx => {
                     const f = assetForm.photos?.[idx];
                     return (
                       <div key={idx} style={{ flex: 1 }}>
                          <label className={`photo-area ${!f ? "empty" : ""}`} style={{ 
                            display: "flex", 
                            height: 100, 
                            flexDirection: "column", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: 4, 
                            border: "2px dashed var(--n200)", 
                            borderRadius: 12, 
                            cursor: "pointer", 
                            background: "var(--n50)", 
                            position: "relative", 
                            overflow: "hidden" 
                          }}>
                            {f ? (
                              <>
                                <img src={f} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <button 
                                  className="btn-icon-xs" 
                                  type="button"
                                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(255,255,255,0.8)", border: "1px solid var(--n200)" }}
                                  onClick={(e) => { 
                                    e.preventDefault(); 
                                    const p = [...(assetForm.photos || [])]; 
                                    p.splice(idx, 1); 
                                    setAssetForm({...assetForm, photos: p}); 
                                  }}
                                >
                                  <X size={10} />
                                </button>
                              </>
                            ) : (
                              <>
                                <ImagePlus size={20} color="var(--n400)" />
                                <span style={{ fontSize: 9, color: "var(--n500)", fontWeight: 600 }}>Adicionar</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: "none" }} 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 1024 * 500) { showSystemAlert("Imagem muito grande. Limite 500KB.", { title: "Arquivo grande", type: "warning" }); return; }
                                      const b64 = await fileToBase64(file);
                                      const p = [...(assetForm.photos || [])];
                                      p[idx] = b64;
                                      setAssetForm({...assetForm, photos: p});
                                    }
                                  }} 
                                />
                              </>
                            )}
                          </label>
                       </div>
                     );
                   })}
                </div>
              </div>

              <div className="fr">
                <div className="fg"><label className="fl">Fabricante</label><input className="fi" value={assetForm.manufacturer} onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })} /></div>
                <div className="fg"><label className="fl">Modelo</label><input className="fi" value={assetForm.model} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Ano</label><input className="fi" value={assetForm.year} onChange={(e) => setAssetForm({ ...assetForm, year: e.target.value })} /></div>
                <div className="fg"><label className="fl">Placa</label><input className="fi" value={assetForm.plate} onChange={(e) => setAssetForm({ ...assetForm, plate: e.target.value })} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Patrimônio</label><input className="fi" value={assetForm.patrimonio} onChange={(e) => setAssetForm({ ...assetForm, patrimonio: e.target.value })} /></div>
                <div className="fg"><label className="fl">OS</label><input className="fi" value={assetForm.os} onChange={(e) => setAssetForm({ ...assetForm, os: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Observações</label><textarea className="ft" value={assetForm.notes || ""} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenAssetDlg(false)}>Cancelar</button>
              <button className="btn btn-primary btn-xs" onClick={saveAsset}><Save size={12} /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ LOGS MODAL ═─ ═─ ═─ */}
      {openLogsDlg && (
        <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenLogsDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenLogsDlg(false)}><X size={12} /></button>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div><h2 style={{ lineHeight: 1.2 }}>Histórico de Modificações</h2><p>Registro de auditoria.</p></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--n50)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--n200)" }}>
                  <label className="fl" style={{ margin: 0 }}>De:</label><input className="fi" type="date" value={logFilterStart} onChange={(e) => setLogFilterStart(e.target.value)} style={{ padding: "4px 8px", height: 28, width: 110 }} />
                  <label className="fl" style={{ margin: 0, marginLeft: 4 }}>Até:</label><input className="fi" type="date" value={logFilterEnd} onChange={(e) => setLogFilterEnd(e.target.value)} style={{ padding: "4px 8px", height: 28, width: 110 }} />
                </div>
                {filteredLogs.length > 0 && (
                  <>
                    <button className="btn btn-outline btn-xs" onClick={() => exportLogsCsv(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }} /> CSV</button>
                    <button className="btn btn-outline btn-xs" onClick={() => generateDirectPdf(filteredLogs)} style={{ height: 32 }}><Download size={12} style={{ marginRight: 4 }} /> Baixar PDF</button>
                    <button className="btn btn-outline btn-xs" onClick={() => exportLogsPdf(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }} /> Imprimir</button>
                  </>
                )}
              </div>
            </div>
            <div className="modal-body">
              {filteredLogs.length === 0 ? <p style={{ color: "var(--n500)" }}>Nenhuma modificação registrada neste período.</p> : (
                <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--n200)", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                    <thead style={{ position: "sticky", top: 0, background: "var(--n100)" }}>
                      <tr><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Data</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Usuário</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Ação</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Detalhes</th></tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(lg => (
                        <tr key={lg.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                          <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{lg.timestamp}</td>
                          <td style={{ padding: "8px 12px" }}><b>{lg.user}</b></td>
                          <td style={{ padding: "8px 12px" }}><span className="badge badge-sec" style={{ fontSize: 10, fontWeight: 700 }}>{lg.action}</span></td>
                          <td style={{ padding: "8px 12px", width: "100%" }}>{lg.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-xs" onClick={() => setOpenLogsDlg(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ USUARIOS MODAL ═─ ═─ ═─ */}
      {openUsersDlg && isAdmin && (
        <div className="modal-overlay" style={{ zIndex: 1500 }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenUsersDlg(false)}><X size={12} /></button>
            <div className="modal-header"><h2>Gerenciamento de Usuários</h2><p>Controle de administradores e editores.</p></div>
            <div className="modal-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "flex-end", background: "var(--n50)", padding: 12, borderRadius: 8, border: "1px solid var(--n200)" }}>
                <div className="fg" style={{ flex: 1, minWidth: 120, margin: 0 }}><label className="fl">Novo Login</label><input className="fi" value={newUser} onChange={(e) => setNewUser(e.target.value)} /></div>
                <div className="fg" style={{ flex: 1, minWidth: 120, margin: 0 }}><label className="fl">Senha</label><input className="fi" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 4, fontSize: 12 }}>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                     <input type="checkbox" checked={!newIsAdmin} onChange={() => setNewIsAdmin(false)} /> Editor (Acesso Limitado)
                   </label>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                     <input type="checkbox" checked={newIsAdmin} onChange={() => setNewIsAdmin(true)} /> Administrador (Acesso Total)
                   </label>
                 </div>
                <button className="btn btn-primary btn-sm" style={{ height: 32 }} onClick={handleAddUser}>Cadastrar</button>
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--n200)", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead style={{ position: "sticky", top: 0, background: "var(--n100)" }}>
                    <tr><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Usuário</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Permissão</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)", textAlign: "right" }}>Ações</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.username} style={{ borderBottom: "1px solid var(--n100)" }}>
                        <td style={{ padding: "8px 12px" }}><b>{u.username}</b> {u.username === currentUser?.username && "(Você)"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span className={u.role === "admin" ? "badge badge-out" : "badge badge-sec"} style={{ fontSize: 10 }}>{u.role === "admin" ? "Administrador" : "Editor"}</span>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); setResetConfirmUser(u); }} style={{ cursor: "pointer" }} title="Resetar Senha para padrão">
                              <KeyRound size={10} style={{ pointerEvents: "none" }} /> Resetar
                            </button>
                            {u.username !== "admin" && u.username !== currentUser?.username && (
                              <button className="btn btn-outline btn-xs" style={{ color: "#ef4444", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setUserToDelete(u); }} title="Excluir conta">
                                <Trash2 size={10} style={{ pointerEvents: "none" }} /> Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Custom Confirmation Overlay inside the modal */}
              {userToDelete && (
                <div style={{ 
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                  background: "rgba(255,255,255,0.95)", zIndex: 2000, 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  flexDirection: "column", gap: 20, borderRadius: 12
                }}>
                  <div style={{ textAlign: "center" }}>
                    <Trash2 size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                    <h3 style={{ margin: 0 }}>Excluir Usuário?</h3>
                    <p style={{ color: "var(--n600)" }}>Tem certeza que deseja remover <b>{userToDelete.username}</b>?</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setUserToDelete(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ background: "#ef4444", borderColor: "#ef4444" }} onClick={() => { handleDelUser(userToDelete.username, userToDelete.id); setUserToDelete(null); }}>Sim, Excluir</button>
                  </div>
                </div>
              )}

              {/* Custom Reset Success Overlay */}
              {resetSuccessInfo && (
                <div style={{ 
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                  background: "rgba(255,255,255,1)", zIndex: 3000, 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  flexDirection: "column", gap: 20, borderRadius: 12
                }}>
                  <div style={{ textAlign: "center" }}>
                    <ShieldCheck size={50} color="#22c55e" style={{ marginBottom: 16 }} />
                    <h2 style={{ margin: 0, color: "#166534" }}>Senha Resetada!</h2>
                    <p style={{ fontSize: 16, marginTop: 12 }}>A nova senha de <b>{resetSuccessInfo.username}</b> é:</p>
                    <div style={{ 
                      background: "var(--n100)", padding: "12px 24px", borderRadius: 8, 
                      fontSize: 24, fontWeight: 800, letterSpacing: 2, margin: "16px 0",
                      border: "1px dashed var(--n400)"
                    }}>
                      {resetSuccessInfo.password}
                    </div>
                    <p style={{ color: "var(--n500)", fontSize: 12 }}>O usuário deverá trocá-la no próximo acesso.</p>
                  </div>
                  <button className="btn btn-primary" style={{ minWidth: 120 }} onClick={() => setResetSuccessInfo(null)}>OK</button>
                </div>
              )}

              {/* Custom Reset Confirmation Overlay */}
              {resetConfirmUser && (
                <div style={{ 
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                  background: "rgba(255,255,255,0.95)", zIndex: 2500, 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  flexDirection: "column", gap: 20, borderRadius: 12
                }}>
                  <div style={{ textAlign: "center" }}>
                    <KeyRound size={40} color="var(--p500)" style={{ marginBottom: 12 }} />
                    <h3 style={{ margin: 0 }}>Resetar Senha?</h3>
                    <p style={{ color: "var(--n600)" }}>Deseja resetar a senha de <b>{resetConfirmUser.username}</b> para o padrão?</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setResetConfirmUser(null)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => { handleResetPass(resetConfirmUser.username); setResetConfirmUser(null); }}>Sim, Resetar</button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-xs" onClick={() => setOpenUsersDlg(false)}>Fechar painel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ═─ ═─ ═─ ESTATÍSTICAS DE ACESSO (ADM) ═─ ═─ ═─ */}
      {openStatsDlg && isAdmin && (
        <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenStatsDlg(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <button className="modal-close" onClick={() => setOpenStatsDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}><PieChart color="var(--p500)" /> Estatísticas de Acesso</h2>
              <p>Resumo de tráfego e atividade administrativa.</p>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--n100)", padding: 16, borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--n600)", textTransform: "uppercase", fontWeight: 700 }}>Acessos Hoje</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--p600)" }}>{Math.floor(logs.length * 1.5) + 12}</div>
                </div>
                <div style={{ background: "var(--n100)", padding: 16, borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--n600)", textTransform: "uppercase", fontWeight: 700 }}>Ações no BD</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--p600)" }}>{logs.length}</div>
                </div>
              </div>
              
              <h4 style={{ fontSize: 12, marginBottom: 8 }}>Atividade Recente (por tipo)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {['CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(type => {
                  const count = logs.filter(l => l.action.includes(type)).length;
                  const pct = logs.length > 0 ? (count / logs.length) * 100 : 0;
                  return (
                    <div key={type} style={{ fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span>{type}</span>
                        <b>{count}</b>
                      </div>
                      <div style={{ height: 4, background: "var(--n200)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--p500)", borderRadius: 2 }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-xs" onClick={() => setOpenStatsDlg(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      
      {/* ═─ ═─ ═─ GESTÃO DE TIPOS DE ATIVOS ═─ ═─ ═─ */}
      {openAssetTypesDlg && isAdmin && (
        <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenAssetTypesDlg(false); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setOpenAssetTypesDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>Gerenciar Tipos de Ativos</h2>
              <p>Adicione ou remova grupos e tipos para o inventário.</p>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--n50)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <h3 style={{ fontSize: 12, marginBottom: 8 }}>
                  {editAssetTypeId ? "Editar Tipo" : "Novo Tipo"}
                </h3>
                <div className="fr" style={{ gap: 8 }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label className="fl">Grupo/Categoria</label>
                    <input 
                      className="fi" 
                      list="cat-list" 
                      placeholder="Ex: Veículo, Ferramenta..." 
                      value={assetTypeForm.category}
                      onChange={(e) => setAssetTypeForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                    <datalist id="cat-list">
                      <option value="Veículo" />
                      <option value="Equipamento" />
                      <option value="Ferramenta" />
                      <option value="Equipamento Leve" />
                      <option value="Equipamento Pesado" />
                    </datalist>
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label className="fl">Nome do Tipo</label>
                    <input 
                      className="fi" 
                      placeholder="Ex: Caminhão Pipa..." 
                      value={assetTypeForm.name}
                      onChange={(e) => setAssetTypeForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <button 
                      type="button"
                      className="btn btn-primary" 
                      style={{ height: 36 }} 
                      onClick={saveAssetType}
                      title={editAssetTypeId ? "Salvar alterações" : "Adicionar"}
                    >
                      {editAssetTypeId ? <Save size={14} /> : <Plus size={14} />}
                      <span style={{ marginLeft: 4 }}>{editAssetTypeId ? "Salvar" : "Add"}</span>
                    </button>
                    
                    {editAssetTypeId && (
                      <button 
                        type="button"
                        className="btn btn-outline" 
                        style={{ height: 36 }} 
                        onClick={resetAssetTypeForm}
                        title="Cancelar edição"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Grupo</th>
                      <th style={{ padding: 8 }}>Tipo</th>
                      <th style={{ padding: 8 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTypes.sort((a,b) => String(a.category || "").localeCompare(String(b.category || "")) || String(a.name || "").localeCompare(String(b.name || ""))).map((t) => {
                      const tId = t.id || t._localId || `${t.category}-${t.name}`;
                      return (
                        <tr key={tId} style={{ borderBottom: "1px solid var(--n100)" }}>
                          <td style={{ padding: 8, textTransform: "capitalize" }}>{t.category}</td>
                          <td style={{ padding: 8 }}>{t.name}</td>
                          <td style={{ padding: 8 }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button 
                                className="btn btn-outline btn-xs" 
                                title="Editar"
                                onClick={() => startEditAssetType(t)}
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                className="btn btn-outline btn-xs" 
                                style={{ color: "#ef4444" }} 
                                title="Excluir"
                                onClick={() => requestDeleteAssetType(t)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-xs" onClick={() => setOpenAssetTypesDlg(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ PERSON REGISTRY / EDIT MODAL ═─ ═─ ═─ */}
      {openPersonDlg && (
        <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenPersonDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenPersonDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>{openPersonDlg === "registry" ? "Cadastro de Pessoas" : (editPersonId ? "Editar Pessoa" : "Cadastrar Pessoa")}</h2>
              <p>{openPersonDlg === "registry" ? "Base de dados centralizada de servidores e colaboradores." : "Preencha as informações obrigatórias."}</p>
            </div>

            {openPersonDlg === "registry" ? (
              <div className="modal-body" style={{ minHeight: 400 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { 
                      setEditPersonId(null); 
                      setPersonForm({ ...emptyPerson, email: "@dmae.prefpoa.com.br" }); 
                      setOpenPersonDlg("edit"); 
                      setTimeout(() => {
                        const el = document.getElementById("person-email-input");
                        if (el) {
                          el.focus();
                          el.setSelectionRange(0, 0);
                        }
                      }, 100);
                    }}>+ Nova Pessoa</button>
                    <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                      <Upload size={14} /> Importar
                      <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleImportPersons} />
                    </label>
                  </div>
                  <div className="hdr-search" style={{ width: 220 }}>
                    <Search size={12} />
                    <input
                      placeholder="Filtrar pessoas..."
                      value={registryFilter}
                      onChange={(e) => setRegistryFilter(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ background: "var(--n50)" }}>
                      <tr><th style={{ padding: 10, textAlign: "left" }}>Nome / Matrícula</th><th style={{ padding: 10, textAlign: "left" }}>Cargo Oficial</th><th style={{ padding: 10, textAlign: "right" }}>Ações</th></tr>
                    </thead>
                    <tbody>
                      {persons
                        .filter(p => !registryFilter || p.name.includes(registryFilter.toUpperCase()) || p.matricula.includes(registryFilter))
                        .slice(0, 50)
                        .map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                            <td style={{ padding: 10 }}><b>{p.name}</b><br /><span style={{ fontSize: 10, color: "var(--n400)" }}>{p.matricula} • {p.regime || "—"} / {p.vinculo || "—"}</span></td>
                            <td style={{ padding: 10 }}>{p.cargo}</td>
                            <td style={{ padding: 10, textAlign: "right" }}>
                              <button className="btn btn-outline btn-xs" title="Visualizar Detalhes" onClick={() => setShowPersonDetail(p.id)} style={{ marginRight: 4 }}><Users size={12} /></button>
                              <button className="btn btn-outline btn-xs" title="Editar Cadastro" onClick={() => { setEditPersonId(p.id); setPersonForm(p); setOpenPersonDlg("edit"); }} style={{ marginRight: 4 }}><Pencil size={12} /></button>
                              <button className="btn btn-outline btn-xs" title="Excluir Registro" onClick={() => requestDeletePerson(p.id)}><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <div className="fr">
                  <div className="fg"><label className="fl">Nome Completo <span style={{ color: "red" }}>*</span></label><input className="fi" value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value.toUpperCase() })} /></div>
                  <div className="fg"><label className="fl">Matrícula <span style={{ color: "red" }}>*</span></label><input className="fi" value={personForm.matricula} onChange={(e) => setPersonForm({ ...personForm, matricula: e.target.value })} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Cargo Oficial <span style={{ color: "red" }}>*</span></label><input className="fi" value={personForm.cargo} onChange={(e) => setPersonForm({ ...personForm, cargo: e.target.value.toUpperCase() })} /></div>
                  <div className="fg"><label className="fl">E-mail <span style={{ color: "red" }}>*</span></label><input id="person-email-input" className="fi" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} /></div>
                </div>
                <div className="fr">
              <div className="fg"><label className="fl">Regime Jurídico</label>
                    {editPersonId ? (
                      <input className="fi" value={personForm.regime} onChange={(e) => setPersonForm({ ...personForm, regime: e.target.value })} placeholder="Estatutário, CLT..." />
                    ) : (
                      <select className="fi" value={personForm.regime} onChange={(e) => setPersonForm({ ...personForm, regime: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option value="estatutário">Estatutário</option>
                        <option value="clt">CLT</option>
                        <option value="cc">Cargo em Comissão (CC)</option>
                        <option value="estagiário">Estagiário</option>
                        <option value="terceirizado">Terceirizado</option>
                        <option value="outro">Outro (Empregado Público, etc)</option>
                      </select>
                    )}
                  </div>
              <div className="fg"><label className="fl">Vínculo</label>
                    {editPersonId ? (
                      <input className="fi" value={personForm.vinculo} onChange={(e) => setPersonForm({ ...personForm, vinculo: e.target.value })} placeholder="Efetivo, Adido, Temporário..." />
                    ) : (
                      <select className="fi" value={personForm.vinculo} onChange={(e) => setPersonForm({ ...personForm, vinculo: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option value="efetivo">Efetivo</option>
                        <option value="adido">Adido</option>
                        <option value="cedido">Cedido</option>
                        <option value="comissionado">Comissionado</option>
                        <option value="contratação">Contratado</option>
                        <option value="temporario">Temporário</option>
                        <option value="outro">Outro</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="fr">
                  <div className="fg"><label className="fl">Telefone (Fixo ou Whats)</label><input className="fi" value={personForm.telefone} onChange={(e) => setPersonForm({ ...personForm, telefone: e.target.value })} placeholder="(51) 99999-9999" /></div>
                  <div className="fg"><label className="fl">Ramal</label><input className="fi" value={personForm.ramal} onChange={(e) => setPersonForm({ ...personForm, ramal: e.target.value })} placeholder="Ex: 8001" /></div>
                </div>
                
                <div className="fg">
                  <label className="fl">Foto do Colaborador</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--n100)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--n200)" }}>
                      {personForm.foto ? <img src={personForm.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Users size={20} color="var(--n400)" />}
                    </div>
                    <label className="btn btn-outline btn-xs" style={{ cursor: "pointer" }}>
                      Selecionar Foto
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const b64 = await fileToBase64(file);
                          setPersonForm({ ...personForm, foto: b64 });
                        }
                      }} />
                    </label>
                    {personForm.foto && <button className="btn btn-outline btn-xs" style={{ color: "red" }} onClick={() => setPersonForm({ ...personForm, foto: "" })}>Remover</button>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--n500)", marginTop: 12, padding: 10, background: "var(--n50)", borderRadius: 8, border: "1px dashed var(--n300)" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "bold", marginBottom: 4 }}>
                     <MapPin size={12} color="#ef4444" /> Localização Inteligente
                   </div>
                   O endereço deste colaborador é herdado automaticamente da caixa onde ele está lotado. Para alterar a localização, edite os dados da caixa no organograma.
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenPersonDlg(openPersonDlg === "registry" ? false : "registry")}>{openPersonDlg === "registry" ? "Fechar" : "Voltar"}</button>
              {openPersonDlg === "edit" && <button className="btn btn-primary btn-xs" onClick={savePerson}>Salvar Alterações</button>}
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ PERSON DETAIL VIEW ═─ ═─ ═─ */}
      {showPersonDetail && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPersonDetail(null); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setShowPersonDetail(null)}><X size={12} /></button>
            {personMap.has(showPersonDetail) ? (
              (() => {
                const p = personMap.get(showPersonDetail);
                if (!p) return <p>Pessoa não encontrada.</p>;
                return (
                  <>
                    <div className="modal-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div className="av av-lg" style={{ width: 64, height: 64, minWidth: 64 }}>
                          {p.foto ? <img src={p.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 20 }}>{initials(p.name)}</span>}
                        </div>
                        <div>
                          <h2 style={{ margin: 0, lineHeight: 1.2 }}>{p.name}</h2>
                          <p style={{ margin: 0, color: "var(--n500)" }}>{p.cargo} • Matrícula {p.matricula}</p>
                        </div>
                      </div>
                    </div>
                    <div className="modal-body">
                      <div className="detail-grid" style={{ padding: 0, gridTemplateColumns: "1fr 1fr 1fr" }}>
                        {(isProtected || canEdit) ? (
                          <>
                            <div className="dg-item">
                              <div className="dg-label">E-mail</div>
                              <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email || "—"}</span>
                                {p.email && <a href={`mailto:${p.email}`} className="btn-icon-xs" title="Enviar E-mail"><Mail size={12} /></a>}
                              </div>
                            </div>
                            <div className="dg-item">
                              <div className="dg-label">Telefone</div>
                              <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {p.telefone || "—"}
                                {p.telefone && (
                                  <a href={`https://wa.me/55${p.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-icon-xs" title="WhatsApp">
                                    <MessageCircle size={12} color="#25D366" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="dg-item"><div className="dg-label">Ramal</div><div className="dg-val">{p.ramal || "—"}</div></div>
                            <div className="dg-item"><div className="dg-label">Regime</div><div className="dg-val">{p.regime || "—"}</div></div>
                            <div className="dg-item"><div className="dg-label">Vínculo</div><div className="dg-val">{p.vinculo || "—"}</div></div>
                            <div className="dg-item" style={{ gridColumn: "span 3" }}>
                              <div className="dg-label">Endereço de Lotação (Herdado da Caixa)</div>
                              <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {(() => {
                                  const pNode = nodes.find(n => n.personId === showPersonDetail);
                                  const addr = resolveAddress(pNode?.id);
                                  const full = `${addr.lotacao}${addr.complemento ? `, ${addr.complemento}` : ""}`;
                                  return (
                                    <>
                                      <span style={{ fontSize: 11 }}>{full}</span>
                                      <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.lotacao)}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline btn-xs"
                                        title="Ver no Google Maps"
                                        style={{ padding: "1px 4px", minHeight: "auto", height: 18, display: "inline-flex", alignItems: "center" }}
                                      >
                                        <MapPin size={10} color="#ef4444" />
                                      </a>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="dg-item" style={{ gridColumn: "span 3", background: "var(--n50)", padding: 12, borderRadius: 8, textAlign: "center" }}>
                            <div style={{ fontSize: 13, color: "var(--n600)" }}>
                              🔒 <b>Dados Privados</b>. Para visualizar e-mail, telefone e localização, faça login com sua matrícula.
                            </div>
                          </div>
                        )}
                      </div>

                      {(isProtected || canEdit) && (
                        <div className="asset-section" style={{ padding: 0, marginTop: 12 }}>
                          <div className="asset-section-title"><ShieldCheck size={14} /> Contratos Vincuados (Gestor/Fiscal)</div>
                          {(() => {
                            const pContracts = contracts.filter(c =>
                              c.gestor.titularId === showPersonDetail || c.gestor.suplenteId === showPersonDetail ||
                              (c.fiscaisContrato || []).some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail) ||
                              (c.fiscaisServico || []).some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail)
                            );
                            return pContracts.length > 0 ? pContracts.map((c) => (
                              <div key={c.id} className="asset-mini" style={{ background: "var(--n50)" }}>
                                <div className="asset-mini-name">{c.sei} <span className="badge badge-sec" style={{ marginLeft: "auto", fontSize: 9 }}>
                                  {c.gestor.titularId === showPersonDetail || c.gestor.suplenteId === showPersonDetail ? "Gestor" :
                                    (c.fiscaisContrato || []).some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail) ? "Fiscal Contrato" : "Fiscal Serviço"}
                                </span></div>
                                <div className="asset-mini-meta"><b>Objeto:</b> {c.objeto}</div>
                                <div className="asset-mini-meta"><b>Papel:</b> {
                                  c.gestor.titularId === showPersonDetail ? "Titular (Gestor)" :
                                    c.gestor.suplenteId === showPersonDetail ? "Suplente (Gestor)" :
                                      (c.fiscaisContrato || []).some(f => f.titularId === showPersonDetail) ? "Titular (Fiscal Contrato)" :
                                        (c.fiscaisContrato || []).some(f => f.suplenteId === showPersonDetail) ? "Suplente (Fiscal Contrato)" :
                                          (c.fiscaisServico || []).some(f => f.titularId === showPersonDetail) ? "Titular (Fiscal Serviço)" :
                                            "Suplente (Fiscal Serviço)"
                                }</div>
                              </div>
                            )) : <p style={{ fontSize: 12, color: "var(--n400)" }}>Nenhum contrato vinculado.</p>;
                          })()}
                        </div>
                      )}

                      <div className="asset-section" style={{ padding: 0, marginTop: 12 }}>
                        <div className="asset-section-title"><Network size={14} /> Atuação no Organograma</div>
                        {nodes.filter(n => n.personId === p.id).map(n => (
                          <div key={n.id} className="asset-mini" style={{ cursor: "pointer" }} onClick={() => { selectNode(n.id); setFocusId(n.id); setShowPersonDetail(null); setShowDetail(true); }}>
                            <div className="asset-mini-name">{n.name} - {n.description || n.cargo}</div>
                            <div className="asset-mini-meta">Função: {n.funcao || "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()
            ) : <p>Pessoa não encontrada.</p>}
            <div className="modal-footer"><button className="btn btn-primary btn-xs" onClick={() => setShowPersonDetail(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ CONTRACT DETAIL VIEW ═─ ═─ ═─ */}
      {showContractDetail && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowContractDetail(null); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowContractDetail(null)}><X size={12} /></button>
            {(() => {
              const c = contracts.find(x => x.id === showContractDetail);
              if (!c) return <p>Contrato não encontrado.</p>;
              const status = getContractStatus(c);
              const node = nodes.find(n => n.id === c.nodeId);
              return (
                <>
                  <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                     <div>
                       <h2 style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 18 }}>
                         Contrato SEI: {c.sei}
                         <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: "bold", background: status === "active" ? "#d1fae5" : status === "expiring" ? "#ffedd5" : "#fee2e2", color: status === "active" ? "#065f46" : status === "expiring" ? "#9a3412" : "#991b1b" }}>
                           {status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido"}
                         </span>
                       </h2>
                       <p style={{ marginTop: 4 }}>Visualização das informações da contratação</p>
                     </div>
                     <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-outline btn-xs" onClick={() => window.print()}><Printer size={12} /> Imprimir</button>
                        <button className="btn btn-outline btn-xs" onClick={() => exportContractPdf(c)}><FileText size={12} /> Exportar PDF</button>
                     </div>
                   </div>
                  <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "var(--n50)", padding: 12, borderRadius: 12, border: "1px solid var(--n200)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                         <div>
                           <p style={{ fontSize: 13, marginBottom: 4 }}><b>Objeto:</b> {c.objeto || "---"}</p>
                           <p style={{ fontSize: 13, marginBottom: 4 }}><b>Itens:</b> {c.itens || "---"}</p>
                           <p style={{ fontSize: 13, marginBottom: 4 }}><b>Unidade Vinculada:</b> {node ? `${node.name} — ${node.description || ""}` : "(Nenhuma)"}</p>
                         </div>
                         {assets.some(a => a.numeroContrato === c.sei && a.isEmergency) && (
                           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.05)", border: "2px solid #fbbf24" }} title="Este contrato possui ativos de CONTINGÊNCIA">
                              <Siren size={20} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} style={{ transform: "scale(1.8)" }} />
                           </div>
                         )}
                      </div>

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--n200)" }}>
                         <p style={{ fontSize: 11, fontWeight: 700, color: "var(--n500)", marginBottom: 4 }}>DADOS DA EMPRESA</p>
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                               <p style={{ fontSize: 13, fontWeight: 700, color: "var(--p700)" }}>{c.empresa || "(Razão Social não informada)"}</p>
                               <p style={{ fontSize: 11, color: "var(--n500)" }}>CNPJ: {c.cnpj || "---"}</p>
                            </div>
                            <div>
                               <p style={{ fontSize: 12 }}><b>Contato:</b> {c.contato || "---"}</p>
                            </div>
                         </div>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, borderTop: "1px solid var(--n200)", paddingTop: 12 }}>
                        <div><b>Início:</b> {c.dataInício ? new Date(`${c.dataInício}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}</div>
                        <div><b>Término:</b> {c.dataTermino ? new Date(`${c.dataTermino}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}</div>
                      </div>
                    </div>

                    {(() => {
                       const contractAssets = assets.filter(a => a.numeroContrato === c.sei);
                       if (contractAssets.length === 0) return null;
                       return (
                         <div>
                           <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Package size={14} /> Ativos Vinculados ({contractAssets.length})</h3>
                           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                             {contractAssets.map(a => (
                               <div key={a.id} style={{ fontSize: 11, padding: "8px", background: "var(--n50)", borderRadius: 8, border: "1px solid var(--n200)" }}>
                                 <div style={{ fontWeight: "bold" }}>{a.name}</div>
                                 <div style={{ opacity: 0.7 }}>{a.category} | {a.plate || a.patrimonio || "S/N"}</div>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                     })()}

                    {(c.aditivos && c.aditivos.length > 0) && (
                      <div>
                        <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> Aditivos</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {c.aditivos.map((ad, idx) => (
                            <div key={idx} style={{ fontSize: 12, background: "var(--n50)", padding: "6px 10px", borderRadius: 8, border: "1px solid var(--n200)" }}>
                              <b>Aditivo {idx + 1}:</b> {ad.aditivoInício ? new Date(`${ad.aditivoInício}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"} a {ad.aditivoTermino ? new Date(`${ad.aditivoTermino}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} /> Gestão do Contrato</h3>
                        {c.gestor?.titularId ? (
                          <div style={{ fontSize: 13, padding: "8px", background: "var(--n50)", borderRadius: 8, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                            <span><b>Titular:</b> {personMap.get(c.gestor.titularId)?.name || "Desconhecido"}</span>
                            <span style={{ fontSize: 11, color: "var(--n500)" }}>Mat: {personMap.get(c.gestor.titularId)?.matricula || "—"}</span>
                          </div>
                        ) : <div style={{ fontSize: 12, color: "var(--n400)" }}>Sem Gestor Titular</div>}
                        {c.gestor?.suplenteId ? (
                          <div style={{ fontSize: 13, padding: "8px", background: "var(--n50)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                            <span><b>Suplente:</b> {personMap.get(c.gestor.suplenteId)?.name || "Desconhecido"}</span>
                            <span style={{ fontSize: 11, color: "var(--n500)" }}>Mat: {personMap.get(c.gestor.suplenteId)?.matricula || "—"}</span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Equipes de Fiscalização</h3>
                        {(() => {
                          const allFiscais = [...(c.fiscaisContrato || []), ...(c.fiscaisServico || [])].filter(f => f.titularId || f.suplenteId);
                          if (allFiscais.length === 0) return <div style={{ fontSize: 12, color: "var(--n400)" }}>Nenhum fiscal vinculado.</div>;
                          return (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              {allFiscais.map((f, idx) => (
                                <div key={idx} style={{ fontSize: 12, padding: "10px", background: "var(--n50)", borderRadius: 8, border: "1px solid var(--n200)" }}>
                                  <div style={{ fontWeight: "bold", marginBottom: 6, color: "var(--n600)" }}>Fiscal Equipe {idx + 1}</div>
                                  {f.titularId && <div style={{ marginBottom: 4 }}><b>Titular:</b> {personMap.get(f.titularId)?.name || "Desconhecido"} <span style={{ color: "var(--n500)", fontSize: 10 }}>(Mat: {personMap.get(f.titularId)?.matricula || "—"})</span></div>}
                                  {f.suplenteId && <div><b>Suplente:</b> {personMap.get(f.suplenteId)?.name || "Desconhecido"} <span style={{ color: "var(--n500)", fontSize: 10 }}>(Mat: {personMap.get(f.suplenteId)?.matricula || "—"})</span></div>}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            <div className="modal-footer"><button className="btn btn-primary btn-xs" onClick={() => setShowContractDetail(null)}>Fechar Visualização</button></div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ CONTRACT REGISTRY / EDIT MODAL ═─ ═─ ═─ */}
      {openContractDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenContractDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenContractDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>{openContractDlg === "registry" ? "Cadastro de Contratos" : (editContractId ? "Editar Contrato" : "Cadastrar Contrato")}</h2>
              <p>{openContractDlg === "registry" ? "Base de dados centralizada de contratos e seus respectivos fiscais." : "Preencha as informações do processo SEI e responsabilidades."}</p>
            </div>

            {openContractDlg === "registry" ? (
              <div className="modal-body" style={{ minHeight: 400 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                  {canEdit ? <button className="btn btn-primary btn-sm" onClick={() => { setEditContractId(null); setContractForm(emptyContract); setOpenContractDlg("edit"); }}>+ Novo Contrato</button> : <div/>}
                  <div className="hdr-search" style={{ width: 220 }}><Search size={12} /><input placeholder="Filtrar contratos..." value={contractFilter} onChange={(e) => setContractFilter(e.target.value)} /></div>
                </div>
                <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ background: "var(--n50)" }}>
                      <tr><th style={{ padding: 10, textAlign: "left" }}>Nº SEI</th><th style={{ padding: 10, textAlign: "left" }}>Status</th><th style={{ padding: 10, textAlign: "left" }}>Objeto / Itens</th><th style={{ padding: 10, textAlign: "right" }}>Ações</th></tr>
                    </thead>
                    <tbody>
                      {contracts.filter(c => !contractFilter || c.sei.toLowerCase().includes(contractFilter.toLowerCase()) || c.objeto.toLowerCase().includes(contractFilter.toLowerCase())).map(c => (
                        <tr key={c.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                          <td style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            <b>{c.sei}</b>
                            {assets.some(a => a.numeroContrato === c.sei && a.isEmergency) && (
                               <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.05)", border: "2px solid #fbbf24" }} title="Possui ativos de CONTINGÊNCIA">
                                  <Siren size={14} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
                               </span>
                            )}
                          </td>
                          <td style={{ padding: 10 }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: "bold", background: getContractStatus(c) === "active" ? "#d1fae5" : getContractStatus(c) === "expiring" ? "#ffedd5" : "#fee2e2", color: getContractStatus(c) === "active" ? "#065f46" : getContractStatus(c) === "expiring" ? "#9a3412" : "#991b1b" }}>
                              {getContractStatus(c) === "active" ? "Ativo" : getContractStatus(c) === "expiring" ? "A Vencer" : "Vencido"}
                            </span>
                          </td>
                          <td style={{ padding: 10, maxWidth: 300 }}><div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.objeto}</div><div style={{ fontSize: 10, color: "var(--n500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.itens || "(Sem itens listados)"}</div></td>
                          <td style={{ padding: 10, textAlign: "right", whiteSpace: "nowrap" }}>
                            <button className="btn btn-outline btn-xs" title="Visualizar Detalhes" onClick={() => setShowContractDetail(c.id)} style={{ marginRight: 4 }}><FileText size={12} /></button>
                            {canEdit && (
                              <>
                                <button className="btn btn-outline btn-xs" title="Editar" onClick={() => { setEditContractId(c.id); setContractForm(c); setOpenContractDlg("edit"); }} style={{ marginRight: 4 }}><Pencil size={12} /></button>
                                <button className="btn btn-outline btn-xs" title="Excluir" onClick={() => deleteContract(c.id, c.sei)}><Trash2 size={12} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <div className="fr">
                  <div className="fg" style={{ flex: 1 }}>
                    <label className="fl">Unidade Vinculada *</label>
                    <NodeSelector
                      value={contractForm.nodeId || ""}
                      nodes={nodes}
                      onChange={(id) => setContractForm({ ...contractForm, nodeId: id })}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}><label className="fl">Nº Processo (SEI) *</label><input className="fi" value={contractForm.sei} onChange={(e) => setContractForm({ ...contractForm, sei: e.target.value })} placeholder="Ex: 25.10.000010414-3" /></div>
                </div>
                <div className="fr">
                  <div className="fg" style={{ flex: 1 }}><label className="fl">Nome da Empresa Contratada *</label><input className="fi" value={contractForm.empresa || ""} placeholder="Razão social..." onChange={(e) => setContractForm({ ...contractForm, empresa: e.target.value })} /></div>
                  <div className="fg" style={{ flex: 1 }}><label className="fl">CNPJ *</label><input className="fi" value={contractForm.cnpj || ""} placeholder="00.000.000/0000-00" onChange={(e) => setContractForm({ ...contractForm, cnpj: e.target.value })} /></div>
                </div>
                <div className="fr">
                  <div className="fg" style={{ flex: 1 }}><label className="fl">Contato da Empresa (Acionamento)</label><input className="fi" value={contractForm.contato || ""} placeholder="Telefone, WhatsApp ou E-mail..." onChange={(e) => setContractForm({ ...contractForm, contato: e.target.value })} /></div>
                </div>
                <div className="fr">
                  <div className="fg" style={{ flex: 1 }}><label className="fl">Data de Início</label><input type="date" className="fi" value={contractForm.dataInicio || ""} onChange={(e) => setContractForm({ ...contractForm, dataInicio: e.target.value })} /></div>
                  <div className="fg" style={{ flex: 1 }}><label className="fl">Data de Término</label><input type="date" className="fi" value={contractForm.dataTermino || ""} onChange={(e) => setContractForm({ ...contractForm, dataTermino: e.target.value })} /></div>
                </div>
                <div className="fg"><label className="fl">Objeto do Contrato *</label><textarea className="ft" style={{ height: 60 }} value={contractForm.objeto} onChange={(e) => setContractForm({ ...contractForm, objeto: e.target.value })} placeholder="Descreva o objeto da contratação..." /></div>
                <div className="fg"><label className="fl">Itens do Contrato (Materiais / Serviços)</label><textarea className="ft" style={{ height: 60 }} value={contractForm.itens} onChange={(e) => setContractForm({ ...contractForm, itens: e.target.value })} placeholder="Liste os materiais ou serviços contemplados..." /></div>
                
                <div style={{ marginTop: 12, padding: 12, background: "var(--n50)", borderRadius: 12, border: "1px solid var(--n200)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>Aditivos</h3>
                    <button className="btn btn-outline btn-xs" onClick={() => setContractForm({ ...contractForm, aditivos: [...(contractForm.aditivos || []), { aditivoInício: "", aditivoTermino: "" }] })}>+ Add Aditivo</button>
                  </div>
                  {contractForm.aditivos && contractForm.aditivos.map((ad, idx) => (
                    <div key={idx} className="fr" style={{ marginBottom: 8, alignItems: "flex-end" }}>
                      <div className="fg"><label className="fl">Início Aditivo {idx + 1}</label><input type="date" className="fi" value={ad.aditivoInício} onChange={(e) => { const nads = [...contractForm.aditivos]; nads[idx].aditivoInício = e.target.value; setContractForm({ ...contractForm, aditivos: nads }); }} /></div>
                      <div className="fg"><label className="fl">Término Aditivo {idx + 1}</label><input type="date" className="fi" value={ad.aditivoTermino} onChange={(e) => { const nads = [...contractForm.aditivos]; nads[idx].aditivoTermino = e.target.value; setContractForm({ ...contractForm, aditivos: nads }); }} /></div>
                      <button className="btn btn-outline btn-xs" style={{ marginBottom: 12, color: "red" }} onClick={() => setContractForm({ ...contractForm, aditivos: contractForm.aditivos.filter((_, i) => i !== idx) })}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* GESTOR SECTION */}
                  <div style={{ background: "var(--n50)", padding: 12, borderRadius: 12, border: "1px solid var(--n200)" }}>
                    <h3 style={{ fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} /> Gestor do Contrato</h3>
                    <PersonSelector enforceNodeOccupation={false} label="Titular" valueId={contractForm.gestor.titularId} persons={persons} onSelect={(id) => setContractForm({ ...contractForm, gestor: { ...contractForm.gestor, titularId: id } })} onClear={() => setContractForm({ ...contractForm, gestor: { ...contractForm.gestor, titularId: "" } })} />
                    <PersonSelector enforceNodeOccupation={false} label="Suplente" valueId={contractForm.gestor.suplenteId} persons={persons} onSelect={(id) => setContractForm({ ...contractForm, gestor: { ...contractForm.gestor, suplenteId: id } })} onClear={() => setContractForm({ ...contractForm, gestor: { ...contractForm.gestor, suplenteId: "" } })} />
                  </div>

                  <div style={{ opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed var(--n200)", borderRadius: 12 }}>
                    <p style={{ fontSize: 11, textAlign: "center" }}>Defina o Gestor e respectivos Fiscais<br />nos campos ao lado e abaixo.</p>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Fiscais de Contrato</h3>
                    <button type="button" className="btn btn-outline btn-xs" onClick={() => setContractForm({ ...contractForm, fiscaisContrato: [...contractForm.fiscaisContrato, { titularId: "", suplenteId: "" }] })}>+ Add Fiscal</button>
                  </div>
                  {contractForm.fiscaisContrato.map((f, idx) => (
                    <div key={idx} className="fr" style={{ marginBottom: 12, background: "var(--n50)", padding: 10, borderRadius: 12, border: "1px solid var(--n200)", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}><PersonSelector enforceNodeOccupation={false} label={`Titular ${idx + 1}`} valueId={f.titularId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisContrato]; nf[idx].titularId = id; setContractForm({ ...contractForm, fiscaisContrato: nf }); }} onClear={() => { const nf = [...contractForm.fiscaisContrato]; nf[idx].titularId = ""; setContractForm({ ...contractForm, fiscaisContrato: nf }); }} /></div>
                      <div style={{ flex: 1 }}><PersonSelector enforceNodeOccupation={false} label={`Suplente ${idx + 1}`} valueId={f.suplenteId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisContrato]; nf[idx].suplenteId = id; setContractForm({ ...contractForm, fiscaisContrato: nf }); }} onClear={() => { const nf = [...contractForm.fiscaisContrato]; nf[idx].suplenteId = ""; setContractForm({ ...contractForm, fiscaisContrato: nf }); }} /></div>
                      <button type="button" className="btn btn-outline btn-xs" style={{ marginBottom: 12, color: "red" }} onClick={() => setContractForm({ ...contractForm, fiscaisContrato: contractForm.fiscaisContrato.filter((_, i) => i !== idx) })}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={14} /> Fiscais de Serviço</h3>
                    <button type="button" className="btn btn-outline btn-xs" onClick={() => setContractForm({ ...contractForm, fiscaisServico: [...contractForm.fiscaisServico, { titularId: "", suplenteId: "" }] })}>+ Add Fiscal de Serviço</button>
                  </div>
                  {contractForm.fiscaisServico.map((f, idx) => (
                    <div key={idx} className="fr" style={{ marginBottom: 12, background: "var(--n50)", padding: 10, borderRadius: 12, border: "1px solid var(--n200)", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}><PersonSelector enforceNodeOccupation={false} label={`Titular ${idx + 1}`} valueId={f.titularId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisServico]; nf[idx].titularId = id; setContractForm({ ...contractForm, fiscaisServico: nf }); }} onClear={() => { const nf = [...contractForm.fiscaisServico]; nf[idx].titularId = ""; setContractForm({ ...contractForm, fiscaisServico: nf }); }} /></div>
                      <div style={{ flex: 1 }}><PersonSelector enforceNodeOccupation={false} label={`Suplente ${idx + 1}`} valueId={f.suplenteId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisServico]; nf[idx].suplenteId = id; setContractForm({ ...contractForm, fiscaisServico: nf }); }} onClear={() => { const nf = [...contractForm.fiscaisServico]; nf[idx].suplenteId = ""; setContractForm({ ...contractForm, fiscaisServico: nf }); }} /></div>
                      <button type="button" className="btn btn-outline btn-xs" style={{ marginBottom: 12, color: "red" }} onClick={() => setContractForm({ ...contractForm, fiscaisServico: contractForm.fiscaisServico.filter((_, i) => i !== idx) })}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenContractDlg(openContractDlg === "registry" ? false : "registry")}>{openContractDlg === "registry" ? "Fechar" : "Voltar"}</button>
              {openContractDlg === "edit" && (
                <div style={{ display: "flex", gap: 8 }}>
                  {editContractId && <button className="btn btn-outline btn-xs" onClick={() => setShowContractDetail(editContractId)}><FileText size={12} /> Espelho do Contrato</button>}
                  <button className="btn btn-primary btn-xs" onClick={saveContract}><Save size={12} /> Salvar Contrato</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═Â═Â═Â CHANGE PASSWORD MODAL ═Â═Â═Â */}
      {(openPasswordDlg || forcePassMode) && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="modal-content narrow">
            {!forcePassMode && <button className="modal-close" onClick={() => setOpenPasswordDlg(false)}><X size={12} /></button>}
            <div className="modal-header">
                            <h2>{forcePassMode ? "\u2699\ufe0f Segurança: Primeiro Acesso" : "Trocar Senha"}</h2>
              <p>Usuário: <b>{currentUser?.username}</b></p>
            </div>
            <div className="modal-body">
              {forcePassMode && (
                <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8, marginBottom: 15, border: "1px solid #bfdbfe", fontSize: 13 }}>
                                    <b>Bem-vindo!</b> Por segurança corporativa, você deve criar uma senha pessoal antes de prosseguir com o uso do sistema.
                </div>
              )}
              {!forcePassMode && <div className="fg"><label className="fl">Senha Atual</label><input className="fi" type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} /></div>}
              <div className="fg"><label className="fl">Nova Senha Pessoal</label><input className="fi" type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} /></div>
              <div className="fg"><label className="fl">Confirme a Nova Senha</label><input className="fi" type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} /></div>
            </div>
            <div className="modal-footer">
              {!forcePassMode ? (
                <button className="btn btn-outline btn-xs" onClick={() => setOpenPasswordDlg(false)}>Cancelar</button>
              ) : (
                <button className="btn btn-outline btn-xs" onClick={() => { setForcePassMode(false); setCurrentUser(null); setCanEdit(false); }}>Sair</button>
              )}
              <button className="btn btn-primary btn-xs" onClick={handleChangePassword}>Definir Senha e Entrar</button>
            </div>
          </div>
        </div>
      )}
      {/* ═─ ═─ ═─ ASSET REGISTRY MODAL (CENTRALIZED) ═─ ═─ ═─ */}
      {openAssetRegistryDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenAssetRegistryDlg(false); }}>
          <div className="modal-content wide" style={{ maxWidth: 1100 }}>
            <button className="modal-close" onClick={() => setOpenAssetRegistryDlg(false)}><X size={12} /></button>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Package size={24} color="var(--p600)" />
                <div>
                  <h2 style={{ margin: 0 }}>Registro Centralizado de Ativos</h2>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: 12 }}>Gerenciamento completo do patrimônio e equipamentos do DMAE.</p>
                </div>
              </div>
              {canEdit && (
                <button className="btn btn-primary btn-sm" style={{ height: 36, padding: "0 16px" }} onClick={() => openNewAsset(null)}>
                  <Plus size={14} /> Novo Ativo
                </button>
              )}
            </div>

            <div className="modal-body">
              {/* FILTERS SECTION */}
              <div style={{ 
                background: "var(--n50)", 
                padding: 16, 
                borderRadius: 12, 
                border: "1px solid var(--n200)", 
                marginBottom: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                alignItems: "end"
              }}>
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Busca Identificação</label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--n400)" }} />
                    <input className="fi" style={{ paddingLeft: 32 }} 
                      placeholder={assetRegFilter.vinculo === "Contratado" ? "Busque por Nome, Placa, SEI ou Empresa..." : "Busque por Nome, Placa ou Patrimônio..."} 
                      value={assetRegFilter.search} onChange={e => setAssetRegFilter({...assetRegFilter, search: e.target.value})} />
                  </div>
                </div>

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Vínculo</label>
                  <select className="fi" value={assetRegFilter.vinculo} onChange={e => setAssetRegFilter({...assetRegFilter, vinculo: e.target.value, sei: "all", empresa: "all"})}>
                    <option value="all">Todos</option>
                    <option value="Próprio">Próprio</option>
                    <option value="Contratado">Contratado</option>
                  </select>
                </div>

                {assetRegFilter.vinculo === "Contratado" && (
                  <div className="fg" style={{ margin: 0, position: "relative", minWidth: 260 }}>
                    <label className="fl">Contrato / Empresa</label>
                    <div style={{ position: "relative" }}>
                       <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--n400)" }} />
                       <input 
                         className="fi" 
                         style={{ paddingLeft: 32 }}
                         placeholder="Filtre por SEI ou Empresa..."
                         value={assetRegFilter.contractSearch}
                         onChange={e => setAssetRegFilter({...assetRegFilter, contractSearch: e.target.value})}
                       />
                       {assetRegFilter.contractSearch && (
                         <button 
                           onClick={() => setAssetRegFilter({...assetRegFilter, contractSearch: ""})}
                           style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--n400)" }}
                         >
                           <X size={12} />
                         </button>
                       )}
                       {/* Suggestions list */}
                       {assetRegFilter.contractSearch && assetRegFilter.contractSearch.length > 0 && (
                         (() => {
                            const q = assetRegFilter.contractSearch.toLowerCase();
                            const sugs = uniqueContracts.filter(c => 
                              c.sei.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q)
                            ).slice(0, 10);
                            
                            // Only show if the current input isn't an EXACT match for a suggestion
                            const exactMatch = sugs.find(s => s.sei === assetRegFilter.contractSearch || s.empresa === assetRegFilter.contractSearch);
                            
                            return (sugs.length > 0 && !exactMatch) ? (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--n200)", borderRadius: 10, boxShadow: "var(--sh-lg)", zIndex: 60, marginTop: 4, overflow: "hidden" }}>
                                {sugs.map((s, idx) => (
                                  <button 
                                    key={idx}
                                    className="dropdown-item" 
                                    style={{ borderBottom: "1px solid var(--n100)", borderRadius: 0, padding: "8px 12px" }}
                                    onClick={() => setAssetRegFilter({...assetRegFilter, contractSearch: s.sei})}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 11 }}>{s.sei}</div>
                                      <div style={{ fontSize: 10, color: "var(--n500)" }}>{s.empresa}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null;
                         })()
                       )}
                    </div>
                  </div>
                )}

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Grupo / Categoria</label>
                  <select className="fi" value={assetRegFilter.category} onChange={e => setAssetRegFilter({...assetRegFilter, category: e.target.value, subType: "all"})}>
                    <option value="all">Todos</option>
                    {Array.from(new Set(assets.map(a => a.category))).sort().map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Tipo de Ativo</label>
                  <select className="fi" value={assetRegFilter.subType} onChange={e => setAssetRegFilter({...assetRegFilter, subType: e.target.value})}>
                    <option value="all">Todos</option>
                    {Array.from(new Set(assets
                      .filter(a => assetRegFilter.category === "all" || a.category === assetRegFilter.category)
                      .map(a => a.type)
                    )).sort().map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Unidade / Local</label>
                  <NodeSelector 
                    value={assetRegFilter.nodeId === "all" ? "" : assetRegFilter.nodeId} 
                    nodes={nodes} 
                    onChange={val => setAssetRegFilter({...assetRegFilter, nodeId: val || "all"})} 
                  />
                </div>

                <div className="fg" style={{ margin: 0, display: "flex", alignItems: "center", paddingBottom: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: "bold", color: assetRegFilter.emergency ? "#ef4444" : "inherit" }}>
                    <input type="checkbox" checked={assetRegFilter.emergency} onChange={e => setAssetRegFilter({...assetRegFilter, emergency: e.target.checked})} />
                    Apenas Contingência
                  </label>
                </div>
              </div>

              {/* EXPORT BAR */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 12, padding: "0 4px" }}>
                 <button className="btn btn-outline btn-xs" style={{ background: "var(--n50)" }} onClick={() => {
                    const list = assets.filter(a => {
                       const matchesSearch = !assetRegFilter.search || a.name.toLowerCase().includes(assetRegFilter.search.toLowerCase()) || a.plate?.toLowerCase().includes(assetRegFilter.search.toLowerCase());
                       const matchesVinculo = assetRegFilter.vinculo === "all" || a.tipoVinculo === assetRegFilter.vinculo;
                       const matchesCategory = assetRegFilter.category === "all" || a.category === assetRegFilter.category;
                       const matchesSubType = assetRegFilter.subType === "all" || a.type === assetRegFilter.subType;
                       const matchesNode = assetRegFilter.nodeId === "all" || a.nodeId === assetRegFilter.nodeId;
                       const matchesEmergency = !assetRegFilter.emergency || a.isEmergency;
                       const matchesContract = !assetRegFilter.contractSearch || a.numeroContrato?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase()) || a.empresaContratada?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase());
                       return matchesSearch && matchesVinculo && matchesCategory && matchesSubType && matchesNode && matchesEmergency && matchesContract;
                    });
                    exportAssetsPdf(list, "Registro Centralizado", (nid) => nodes.find(n => n.id === nid)?.name || nid);
                 }}>
                   <Printer size={12} /> Imprimir / PDF
                 </button>
                 <button className="btn btn-outline btn-xs" style={{ background: "var(--n50)" }} onClick={() => {
                    const list = assets.filter(a => {
                       const matchesSearch = !assetRegFilter.search || a.name.toLowerCase().includes(assetRegFilter.search.toLowerCase()) || a.plate?.toLowerCase().includes(assetRegFilter.search.toLowerCase());
                       const matchesVinculo = assetRegFilter.vinculo === "all" || a.tipoVinculo === assetRegFilter.vinculo;
                       const matchesCategory = assetRegFilter.category === "all" || a.category === assetRegFilter.category;
                       const matchesSubType = assetRegFilter.subType === "all" || a.type === assetRegFilter.subType;
                       const matchesNode = assetRegFilter.nodeId === "all" || a.nodeId === assetRegFilter.nodeId;
                       const matchesEmergency = !assetRegFilter.emergency || a.isEmergency;
                       const matchesContract = !assetRegFilter.contractSearch || a.numeroContrato?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase()) || a.empresaContratada?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase());
                       return matchesSearch && matchesVinculo && matchesCategory && matchesSubType && matchesNode && matchesEmergency && matchesContract;
                    });
                    const rows = [["Identificacao", "Categoria", "Tipo", "Fabricante", "Modelo", "Ano", "Placa", "Patrimonio", "Vinculo", "Contrato", "Empresa", "Unidade"],
                    ...list.map(a => [a.name, a.category, a.type, a.manufacturer, a.model, a.year, a.plate, a.patrimonio, a.tipoVinculo, a.numeroContrato, a.empresaContratada, nodes.find(n => n.id === a.nodeId)?.name || ""])];
                    downloadFile("ativos-export.csv", toCsv(rows), "text/csv;charset=utf-8;");
                 }}>
                   <Download size={12} /> Exportar Excel (CSV)
                 </button>
              </div>

              {/* RESULTS TABLE */}
              <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ maxHeight: 500, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ background: "var(--n100)", position: "sticky", top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Ativo</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Vínculo</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Localização (Unidade)</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Contato / Responsável</th>
                        <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = assets.filter(a => {
                          const matchesSearch = !assetRegFilter.search || 
                            a.name.toLowerCase().includes(assetRegFilter.search.toLowerCase()) ||
                            a.plate?.toLowerCase().includes(assetRegFilter.search.toLowerCase()) ||
                            a.patrimonio?.toLowerCase().includes(assetRegFilter.search.toLowerCase()) ||
                            a.numeroContrato?.toLowerCase().includes(assetRegFilter.search.toLowerCase()) ||
                            a.empresaContratada?.toLowerCase().includes(assetRegFilter.search.toLowerCase());
                          
                          const matchesVinculo = assetRegFilter.vinculo === "all" || a.tipoVinculo === assetRegFilter.vinculo;
                          const matchesCategory = assetRegFilter.category === "all" || a.category === assetRegFilter.category;
                          const matchesSubType = assetRegFilter.subType === "all" || a.type === assetRegFilter.subType;
                          const matchesNode = assetRegFilter.nodeId === "all" || a.nodeId === assetRegFilter.nodeId;
                          const matchesEmergency = !assetRegFilter.emergency || a.isEmergency;
                          
                          const matchesContract = !assetRegFilter.contractSearch || 
                            a.numeroContrato?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase()) ||
                            a.empresaContratada?.toLowerCase().includes(assetRegFilter.contractSearch.toLowerCase());

                          return matchesSearch && matchesVinculo && matchesCategory && matchesSubType && matchesNode && matchesEmergency && matchesContract;
                        });

                        if (filtered.length === 0) return (
                          <tr>
                            <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--n400)" }}>
                              Nenhum ativo encontrado com os filtros aplicados.
                            </td>
                          </tr>
                        );

                        return filtered.map(a => {
                          const node = nodes.find(n => n.id === a.nodeId);
                          return (
                            <tr key={a.id} style={{ borderBottom: "1px solid var(--n100)" }} className="search-item-hover">
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ 
                                    width: 32, height: 32, borderRadius: 8, background: "var(--n50)", 
                                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--n600)",
                                    border: a.isEmergency ? "2px solid #eab308" : "1px solid var(--n200)"
                                  }}>
                                    {assetIcon(a.category)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                      {a.name}
                                      {a.isEmergency && (
                                        <div style={{ 
                                          display: "flex", alignItems: "center", justifyContent: "center", 
                                          width: 22, height: 22, borderRadius: "50%", 
                                          border: "2px solid #eab308", background: "#fff", 
                                          boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)",
                                          marginLeft: 4
                                        }} title="Ativo de Contingência">
                                          <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} style={{ transform: "scale(1.3)" }} />
                                        </div>
                                      )}
                                      {a.isMaintenance && (
                                        <div className="badge-maintenance" style={{ 
                                          display: "flex", alignItems: "center", justifyContent: "center", 
                                          width: 22, height: 22, borderRadius: "50%", 
                                          border: "2px solid #d97706", background: "#fff", 
                                          boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)",
                                          marginLeft: 4,
                                          color: "#d97706"
                                        }} title="Ativo em Manutenção/Inoperante">
                                          <AlertTriangle size={12} strokeWidth={3} style={{ transform: "scale(1.3)" }} />
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 10, color: "var(--n500)" }}>{a.type} • {a.model || "—"} {a.year && `(${a.year})`}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className={`badge ${a.tipoVinculo === "Contratado" ? "badge-sec" : "badge-out"}`}>
                                  {a.tipoVinculo || "Próprio"}
                                </span>
                                {a.plate && <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>Placa: {a.plate}</div>}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ fontWeight: 600 }}>{node?.name || "Desconhecida"}</div>
                                <div style={{ fontSize: 10, color: "var(--n500)" }}>{node?.unidade || "DMAE"}</div>
                              </td>
                               <td style={{ padding: "12px 16px" }}>
                                {(() => {
                                  const displayContact = a.isEmergency && a.contatoResponsavel ? a.contatoResponsavel : a.contatoResponsavel || a.contatoFone || "—";
                                  return (
                                    <>
                                      <div style={{ fontWeight: 600 }}>{displayContact}</div>
                                      {a.isEmergency ? (
                                        <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, display: "flex", flexDirection: "column", gap: 2 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Siren size={10} /> Tel.: {a.contatoAcionamento || "Não informado"}
                                            {a.contatoAcionamento && (
                                              <a href={`https://wa.me/55${a.contatoAcionamento.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }} title="WhatsApp">
                                                <MessageCircle size={10} />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ) : null}
                                      {!a.isEmergency && (a.contatoFone || a.contatoAcionamento) && (
                                        <div style={{ fontSize: 10, color: "var(--n500)", display: "flex", alignItems: "center", gap: 4 }}>
                                          <Phone size={10} /> {a.contatoFone || a.contatoAcionamento}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button className="btn btn-outline btn-xs" title="Visualizar Cadastro" onClick={() => setViewAssetId(a.id)}>
                                    <Eye size={12} />
                                  </button>
                                  <button className="btn btn-outline btn-xs" title="Ver no Organograma" onClick={() => { selectNode(a.nodeId); setFocusId(a.nodeId); setOpenAssetRegistryDlg(false); setShowDetail(true); }}>
                                    <FolderTree size={12} />
                                  </button>
                                  {canEdit && (
                                    <>
                                      <button className="btn btn-outline btn-xs" title="Editar Ativo" onClick={() => openEditAsset(a)}>
                                        <Pencil size={12} />
                                      </button>
                                      <button className="btn btn-outline btn-xs" title="Excluir Ativo" style={{ color: "#ef4444" }} onClick={() => deleteAsset(a.id, a.name)}>
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "var(--n500)" }}>
                Exibindo {assets.length} ativos totais.
              </div>
              <button className="btn btn-primary btn-xs" onClick={() => setOpenAssetRegistryDlg(false)}>Fechar Registro</button>
            </div>
          </div>
        </div>
      )}
            <footer className="app-footer" style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr auto 1fr", 
              alignItems: "center", 
              padding: "8px 20px",
              fontSize: "11px"
            }}>
              <div /> {/* Spacer */}
              <div style={{ textAlign: "center" }}>
                Desenvolvido por <span>&nbsp;{"Fábio Bühler"} - {"Versão"} 1.0.2026.04241445</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--n600)", justifyContent: "flex-end" }}>
                <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }}></div>
                <b>{onlineCount}</b> usuários on-line
              </div>
            </footer>

      {/* ─€─€─€─€ DELETE CONFIRMATION MODAL ─€─€─€─€ */}
      {deleteRequest && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content narrow" style={{ borderTop: "4px solid var(--danger)" }}>
            <button className="modal-close" onClick={() => setDeleteRequest(null)}><X size={14} /></button>
            <div className="modal-header">
              <h2 style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={20} /> Confirmar Exclusão</h2>
              <p>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>Tem certeza que deseja excluir <strong>{deleteRequest.name}</strong>?</p>
              <div style={{ marginTop: 12, padding: 10, background: "#fff1f2", borderRadius: 8, fontSize: 12, color: "#991b1b", border: "1px solid #fecaca" }}>
                {deleteRequest.type === "node" 
                  ? "A exclusão só será permitida se não houver subordinados nem ativos vinculados."
                  : "A pessoa só será excluída se não estiver vinculada a nenhuma caixa do organograma."}
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-outline btn-xs" onClick={() => setDeleteRequest(null)}>Cancelar</button>
              <button className="btn btn-danger btn-xs" onClick={confirmDelete}><Trash2 size={12} /> Confirmar Exclusão</button>
            </div>
          </div>
        </div>
      )}

      {/* ═─ ═─ ═─ ASSET DETAIL VIEW ═─ ═─ ═─ */}
      {viewAssetId && (
        <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setViewAssetId(null); }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setViewAssetId(null)}><X size={12} /></button>
            {(() => {
              const a = assets.find(x => x.id === viewAssetId);
              if (!a) return <p>Ativo não encontrado.</p>;
              const node = nodes.find(n => n.id === a.nodeId);
              return (
                <>
                  <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                       {assetIcon(a.category)} {a.name}
                       {a.isEmergency && (
                         <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)" }} title="Contingência">
                           <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} style={{ transform: "scale(1.3)" }} />
                         </div>
                       )}
                       {a.isMaintenance && (
                         <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", color: "#d97706" }} title="Manutenção">
                           <AlertTriangle size={12} strokeWidth={3} style={{ transform: "scale(1.3)" }} />
                         </div>
                       )}
                    </h2>
                    <p style={{ marginTop: 4 }}>{a.category} • {a.type}</p>
                  </div>
                  <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                     {/* Photos Gallery */}
                     {a.photos && a.photos.length > 0 && (
                       <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                         {a.photos.map((p, idx) => (
                           <img 
                             key={idx} 
                             src={p} 
                             style={{ height: 160, borderRadius: 12, border: "1px solid var(--n200)", cursor: "zoom-in", objectFit: "cover" }} 
                             onClick={() => setExpandedImage(p)}
                           />
                         ))}
                       </div>
                     )}

                     <div className="asset-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="detail-group">
                           <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Fabricante / Modelo</label>
                           <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{a.manufacturer || "---"} / {a.model || "---"}</div>
                        </div>
                        <div className="detail-group">
                           <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Ano / Placa</label>
                           <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{a.year || "---"} / {a.plate || "---"}</div>
                        </div>
                        <div className="detail-group">
                           <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Patrimônio / OS</label>
                           <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{a.patrimonio || "---"} / {a.os || "---"}</div>
                        </div>
                        <div className="detail-group">
                           <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Localização (Unidade)</label>
                           <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{node?.name || "---"}</div>
                        </div>
                     </div>

                     {a.isEmergency && (
                        <div className="asset-detail-emergency-box">
                          <h3>
                            <Siren size={16} />
                            Acionamento de Contingência
                          </h3>

                          <p>
                            <strong>Responsável pela Contingência:</strong>{" "}
                            {a.contatoResponsavel || "Não informado"}
                          </p>

                          <p>
                            <strong>Telefone de Emergência / Acionamento:</strong>{" "}
                            {a.contatoAcionamento || "Não informado"}
                            {a.contatoAcionamento && (
                              <a href={`https://wa.me/55${a.contatoAcionamento.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#25D366", display: "inline-flex", verticalAlign: "middle" }} title="Chamar no WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                            )}
                          </p>

                          <p>
                            <strong>Contato Geral:</strong>{" "}
                            {a.contatoFone || "Não informado"}
                          </p>
                        </div>
                      )}

                     {(isProtected || canEdit) && a.tipoVinculo === "Contratado" && (
                        <div style={{ background: "#fefce8", padding: 16, borderRadius: 12, border: "1px solid #fde047" }}>
                           <h4 style={{ fontSize: 11, color: "#854d0e", marginBottom: 12, fontWeight: 800 }}>DADOS DO CONTRATO</h4>
                           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div>
                                 <label className="fl" style={{ fontSize: 8 }}>Processo SEI</label>
                                 <div className="detail-val" style={{ fontWeight: 700, fontSize: 12 }}>{a.numeroContrato}</div>
                              </div>
                              <div>
                                 <label className="fl" style={{ fontSize: 8 }}>Empresa</label>
                                 <div className="detail-val" style={{ fontSize: 12 }}>{a.empresaContratada}</div>
                              </div>
                              <div>
                                 <label className="fl" style={{ fontSize: 8 }}>Fiscal Titular</label>
                                 <div className="detail-val" style={{ fontSize: 12 }}>{a.fiscalContrato}</div>
                              </div>
                              <div>
                                 <label className="fl" style={{ fontSize: 8 }}>Contato Empresa</label>
                                 <div className="detail-val" style={{ fontSize: 11 }}>{a.contatoAcionamento}</div>
                              </div>
                           </div>
                        </div>
                      )}

                     {a.notes && (
                        <div className="detail-group">
                           <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Observações</label>
                           <div className="detail-val" style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{a.notes}</div>
                        </div>
                     )}
                  </div>
                  <div className="modal-footer" style={{ gap: 8 }}>
                    <button className="btn btn-outline btn-xs" onClick={() => setViewAssetId(null)}>Fechar</button>
                    {canEdit && <button className="btn btn-primary btn-xs" onClick={() => { setViewAssetId(null); openEditAsset(a); }}><Pencil size={12} /> Editar Cadastro</button>}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* LIGHTBOX DE FOTO */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)"
          }}
        >
          <img
            src={expandedImage}
            alt="Foto ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "90vh",
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              objectFit: "contain"
            }}
          />
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: "50%", width: 36, height: 36,
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >\u00d7</button>
        </div>
      )}

      <SystemAlertModal alert={systemAlert} onClose={closeSystemAlert} />
      <ConfirmDialog
        dialog={confirmDialog}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          const action = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          if (typeof action === "function") action();
        }}
      />
    </div>
  );
}
