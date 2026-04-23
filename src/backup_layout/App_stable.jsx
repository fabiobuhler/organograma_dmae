import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  FolderTree, Search, KeyRound, ShieldCheck, Download, Upload,
  Pencil, Trash2, Users, Building2, ClipboardList, Briefcase,
  Home, Plus, GitBranchPlus, Save, Mail, Phone, Car, Wrench, X,
  ImagePlus, List, Network, ChevronRight, ChevronDown, ChevronUp, FileText, Printer,
} from "lucide-react";
import { OrgBranch } from "./components/OrgNode";
import { seedNodes, seedAssets, seedPersons, seedContracts } from "./data/seedData";
import {
  makeId, initials, sortNodes, downloadFile, toCsv,
  getDescendantIds, getParentChain, fileToBase64,
} from "./utils/helpers";

const STORAGE_KEY = "dmae-orgchart-v7";
const DEMO_USER = "admin";
const DEMO_PASS = "dmae123";

const emptyNode = {
  id: "", parentId: "", name: "", description: "", funcao: "", responsavel: "", matricula: "",
  unidade: "DMAE", lotacao: "", tipo: "estrutura", subtipo: "subordinada",
  email: "", telefone: "", ramal: "", foto: "", observacoes: "", tags: "", color: "",
  personId: "",
};
const emptyPerson = {
  id: "", name: "", matricula: "", cargo: "", email: "", telefone: "", ramal: "",
  lotacao: "", regime: "", vinculo: "", contracts: []
};
const emptyAsset = {
  id: "", nodeId: "", category: "veículo", name: "",
  manufacturer: "", model: "", year: "", plate: "",
  patrimonio: "", os: "", notes: "",
};
const emptyContract = {
  id: "",
  sei: "",
  objeto: "",
  itens: "",
  gestor: { titularId: "", suplenteId: "" },
  fiscaisContrato: [{ titularId: "", suplenteId: "" }],
  fiscaisServico: [{ titularId: "", suplenteId: "" }]
};

function assetIcon(c) {
  if (c === "veículo") return <Car size={12} />;
  if (c === "ferramenta") return <Wrench size={12} />;
  return <Briefcase size={12} />;
}

/* ─── PDF/Print export ─── */
function exportAssetsPdf(list, label, getPath) {
  const w = window.open("", "_blank");
  if (!w) { alert("Permita pop-ups para exportar."); return; }
  const rows = list.map((a) =>
    `<tr><td>${a.category}</td><td>${a.name}</td><td>${a.manufacturer||""}</td><td>${a.model||""}</td><td>${a.year||""}</td><td>${a.plate||""}</td><td>${a.patrimonio||""}</td><td>${getPath(a.nodeId)}</td></tr>`
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
  if (!w) { alert("Permita pop-ups para exportar."); return; }
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
     alert("Carregador PDF indisponível no momento. Usando módulo de impressão.");
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
    margin:       10,
    filename:     'auditoria-logs.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  window.html2pdf().set(opt).from(content).save();
}

function exportLogsCsv(logsList) {
  const rows = [["Data/Hora","Operador","Acao","Detalhes"], ...logsList.map((lg) => [lg.timestamp, lg.user, lg.action, lg.target])];
  downloadFile(`auditoria-logs.csv`, toCsv(rows), "text/csv;charset=utf-8;");
}

/* ─── List View Component ─── */
function ListNode({ node, getChildren, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const ch = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const hasChildren = ch.length > 0;
  const isApoio = node.subtipo === "apoio";

  return (
    <div className={`list-node ${open ? "expanded" : ""}`} style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <div className="list-node-header" onClick={() => onSelect(node.id)}>
        {hasChildren ? (
          <button className="list-collapse-icon" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : <div style={{ width: 20 }} />}
        <div className="av" style={{ width: 28, height: 28, minWidth: 28, borderRadius: 6, cursor: node.foto ? "zoom-in" : "default" }} onClick={(e) => { if(node.foto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: node.foto })); } }}>
          {node.foto ? <img src={node.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 9 }}>{initials(node.name)}</span>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{node.name}</div>
          <div style={{ fontSize: 10, color: "var(--n500)" }}>{node.responsavel || node.cargo}</div>
        </div>
        <span className={`badge ${isApoio ? "badge-apoio" : "badge-sec"}`} style={{ flexShrink: 0 }}>
          {isApoio ? "apoio" : node.tipo}
        </span>
        {hasChildren && <span className="badge badge-out">{ch.length}</span>}
      </div>
      {open && hasChildren && (
        <div className="list-children">
          {ch.map((c) => <ListNode key={c.id} node={c} getChildren={getChildren} onSelect={onSelect} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Person Selector Component ─── */
function PersonSelector({ label, valueId, persons, nodes, onSelect, onClear }) {
  const [q, setQ] = useState("");
  const person = persons.find(p => p.id === valueId);
  
  const isOccupied = (pid) => nodes.some(n => n.personId === pid);

  return (
    <div className="fg" style={{ position: "relative" }}>
      <label className="fl">{label}</label>
      {person ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--n50)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--n200)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{person.name}</div>
            <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {person.matricula} • {person.cargo}</div>
          </div>
          <button className="btn btn-outline btn-xs btn-icon" onClick={onClear} title="Remover"><X size={10} /></button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input className="fi" placeholder="Buscar por nome ou matrícula..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--n400)" }}><Search size={12} /></div>
          {q.length > 1 && (
            <div className="search-drop" style={{ top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 100 }}>
              {persons.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.matricula.includes(q)).slice(0, 10).map(p => {
                const occupied = isOccupied(p.id);
                return (
                  <button 
                    key={p.id} 
                    className="search-item" 
                    onClick={() => { if(!occupied) { onSelect(p.id); setQ(""); } }}
                    style={{ opacity: occupied ? 0.5 : 1, cursor: occupied ? "not-allowed" : "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {p.matricula} • {p.cargo}</div>
                      </div>
                      {occupied && <span style={{ fontSize: 8, fontWeight: 800, color: "#ef4444", textTransform: "uppercase" }}>Ocupado</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ APP ═══════════════════════════ */
export default function App() {
  const [nodes, setNodes] = useState(seedNodes);
  const [assets, setAssets] = useState(seedAssets);
  const [persons, setPersons] = useState(seedPersons);
  const [contracts, setContracts] = useState(seedContracts);
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "list"
  const [query, setQuery] = useState("");
  const [qFocused, setQFocused] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(null); // ID of person to show
  const [openNodeDlg, setOpenNodeDlg] = useState(false);
  const [openAssetDlg, setOpenAssetDlg] = useState(false);
  const [openPersonDlg, setOpenPersonDlg] = useState(false); // false | "registry" | "edit"
  const [registryFilter, setRegistryFilter] = useState("");
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
  const [expandedImage, setExpandedImage] = useState(null);

  const [canEdit, setCanEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [users, setUsers] = useState([{ username: "admin", password: "123", role: "admin" }]);
  const [logs, setLogs] = useState([]);
  const [openLogsDlg, setOpenLogsDlg] = useState(false);
  const [openUsersDlg, setOpenUsersDlg] = useState(false);
  const [openPasswordDlg, setOpenPasswordDlg] = useState(false);
  const [forcePassMode, setForcePassMode] = useState(false);
  
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [toast, setToast] = useState(null);
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
        if (Array.isArray(p.users) && p.users.length > 0) {
          // Normalize old data to ensure role presence and unify the default admin password
          const upU = p.users.map(u => ({ ...u, role: u.role || (u.username === "admin" ? "admin" : "editor") }));
          const adIdx = upU.findIndex(u => u.username === "admin");
          if (adIdx >= 0 && upU[adIdx].password === "123") upU[adIdx].password = "dmae123";
          setUsers(upU);
        }
        if (Array.isArray(p.logs)) setLogs(p.logs);
      }
    } catch {}
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
  const selected = selectedId ? nodeMap.get(selectedId) : null;
  const focused = focusId ? nodeMap.get(focusId) : rootNode;

  const totalPessoas = nodes.filter((n) => n.tipo === "pessoa").length;
  const totalEstruturas = nodes.filter((n) => n.tipo === "estrutura").length;

  const assetsByNode = useMemo(() => {
    const m = new Map();
    assets.forEach((a) => { if (!m.has(a.nodeId)) m.set(a.nodeId, []); m.get(a.nodeId).push(a); });
    return m;
  }, [assets]);

  const directAssetCount = useCallback((nid) => (assetsByNode.get(nid) || []).length, [assetsByNode]);
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

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

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
  }, [selectedId, viewMode]);

  // Auto-center on focus change – reset scroll first, then center
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
  }, [focusId, viewMode]);

  // Drag-to-pan on tree viewport
  useEffect(() => {
    if (viewMode !== "tree") return;
    const vp = vpRef.current;
    if (!vp) return;
    const onMouseDown = (e) => {
      if (e.target.closest('.org-card, button, a, input, select, textarea')) return;
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      scrollStartPos.current = { x: vp.scrollLeft, y: vp.scrollTop };
      vp.style.cursor = 'grabbing';
      vp.style.userSelect = 'none';
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      vp.scrollLeft = scrollStartPos.current.x - (e.clientX - dragStartPos.current.x);
      vp.scrollTop = scrollStartPos.current.y - (e.clientY - dragStartPos.current.y);
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        vp.style.cursor = '';
        vp.style.userSelect = '';
      }
    };
    vp.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      vp.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [viewMode, zoom]);

  // Select node → open detail
  const selectNode = useCallback((id) => {
    setSelectedId(id);
    setShowDetail(true);
  }, []);

  const logAction = useCallback((action, target) => {
    setLogs(prev => {
      const dt = new Date().toLocaleString("pt-BR");
      return [{ id: makeId("log"), timestamp: dt, user: currentUser || "Sistema", action, target }, ...prev].slice(0, 100);
    });
  }, [currentUser]);

  // Node CRUD
  const openNewNode = useCallback((parentId) => {
    const p = nodeMap.get(parentId);
    setEditNodeId(null);
    setNodeForm({ ...emptyNode, parentId, unidade: p?.unidade || "DMAE", lotacao: p?.name || "" });
    setOpenNodeDlg(true);
  }, [nodeMap]);

  const openEditNode = useCallback(() => {
    if (!selected || !canEdit) return;
    setEditNodeId(selected.id);
    setNodeForm({ ...selected, parentId: selected.parentId || "none" });
    setOpenNodeDlg(true);
  }, [selected, canEdit]);

  const saveNode = useCallback(() => {
    if (!nodeForm.name.trim()) return;
    
    // EXCLUSIVITY CHECK: Verify if the selected person is already in another node
    if (nodeForm.personId) {
      const alreadyAssigned = nodes.find(n => n.personId === nodeForm.personId && n.id !== editNodeId);
      if (alreadyAssigned) {
        alert(`Erro: Esta pessoa já está alocada na estrutura "${alreadyAssigned.name}". Cada colaborador pode ocupar apenas uma posição.`);
        return;
      }
    }

    const n = { ...nodeForm, id: editNodeId || makeId("node"), parentId: nodeForm.parentId === "none" || !nodeForm.parentId ? null : nodeForm.parentId };
    if (editNodeId) {
      setNodes((c) => c.map((x) => x.id === editNodeId ? n : x));
      setSelectedId(editNodeId);
      logAction("Editar Caixa", n.name);
    } else {
      setNodes((c) => [...c, n]);
      setSelectedId(n.id);
      setFocusId(n.parentId || n.id);
      logAction("Criar Caixa", n.name);
    }
    setOpenNodeDlg(false); setEditNodeId(null);
    flash(editNodeId ? "Caixa atualizada!" : "Caixa criada!");
  }, [nodeForm, editNodeId, nodes, logAction]);

  const deleteNode = useCallback(() => {
    if (!selected || !canEdit) return;
    if (!selected.parentId) { alert("O nó raiz não pode ser removido."); return; }
    if (nodes.some((n) => n.parentId === selected.id)) { alert("Remova subordinados antes."); return; }
    if (!confirm(`Excluir ${selected.name}?`)) return;
    setNodes((c) => c.filter((x) => x.id !== selected.id));
    setSelectedId(selected.parentId);
    setShowDetail(false);
    logAction("Excluir Caixa", selected.name);
    flash("Excluída");
  }, [selected, canEdit, nodes, logAction]);

  const handlePhoto = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024 * 2) { alert("Máx 2MB."); return; }
    try { setNodeForm((p) => ({ ...p, foto: "" })); const b = await fileToBase64(f); setNodeForm((p) => ({ ...p, foto: b })); } catch { alert("Erro."); }
    e.target.value = "";
  }, []);

  // Asset CRUD
  const openNewAsset = useCallback((nid) => { setEditAssetId(null); setAssetForm({ ...emptyAsset, nodeId: nid }); setOpenAssetDlg(true); }, []);
  const openEditAsset = useCallback((a) => { setEditAssetId(a.id); setAssetForm({ ...a }); setOpenAssetDlg(true); }, []);
  const saveAsset = useCallback(() => {
    if (!assetForm.nodeId || !assetForm.name.trim()) return;
    const n = { ...assetForm, id: editAssetId || makeId("asset") };
    setAssets(editAssetId ? (c) => c.map((a) => a.id === editAssetId ? n : a) : (c) => [...c, n]);
    logAction(editAssetId ? "Editar Ativo" : "Criar Ativo", n.name);
    setOpenAssetDlg(false); flash(editAssetId ? "Ativo atualizado!" : "Ativo criado!");
  }, [assetForm, editAssetId, logAction]);
  const deleteAsset = useCallback((id, name) => { if (!confirm("Excluir ativo?")) return; setAssets((c) => c.filter((a) => a.id !== id)); logAction("Excluir Ativo", name || id); flash("Ativo excluído"); }, [logAction]);

  // Person CRUD
  const openNewPerson = useCallback(() => { setEditPersonId(null); setPersonForm(emptyPerson); setOpenPersonDlg(true); }, []);
  const openEditPerson = useCallback((p) => { setEditPersonId(p.id); setPersonForm({ ...p }); setOpenPersonDlg(true); }, []);
  const savePerson = useCallback(() => {
    if (!personForm.name.trim() || !personForm.matricula.trim() || !personForm.cargo.trim() || !personForm.email.trim()) {
      alert("Nome, Matrícula, Cargo e E-mail são obrigatórios."); return;
    }
    const p = { ...personForm, id: editPersonId || makeId("person") };
    setPersons(editPersonId ? (c) => c.map((x) => x.id === editPersonId ? p : x) : (c) => [...c, p]);
    logAction(editPersonId ? "Editar Pessoa" : "Cadastrar Pessoa", p.name);
    setOpenPersonDlg(false); flash(editPersonId ? "Pessoa atualizada!" : "Pessoa cadastrada!");
  }, [personForm, editPersonId, logAction]);
  const deletePerson = useCallback((id, name) => {
    if (nodes.some(n => n.personId === id)) { alert("Esta pessoa está vinculada a uma caixa. Remova o vínculo antes."); return; }
    if (!confirm(`Excluir ${name}?`)) return;
    setPersons((c) => c.filter((p) => p.id !== id));
    logAction("Excluir Pessoa", name || id); flash("Pessoa excluída");
  }, [nodes, logAction]);
  
  // Contract CRUD
  const openNewContract = useCallback(() => { 
    setEditContractId(null); 
    setContractForm(emptyContract); 
    setOpenContractDlg("registry"); 
  }, []);
  
  const openEditContract = useCallback((c) => { 
    setEditContractId(c.id); 
    setContractForm({ ...c }); 
    setOpenContractDlg("edit"); 
  }, []);
  
  const saveContract = useCallback(() => {
    if (!contractForm.sei.trim() || !contractForm.objeto.trim()) {
      alert("Nº Processo (SEI) e Objeto são obrigatórios."); return;
    }
    // Unique SEI check
    if (contracts.some(c => c.sei === contractForm.sei && c.id !== editContractId)) {
      alert("Este Nº de Processo já está cadastrado."); return;
    }

    const c = { ...contractForm, id: editContractId || makeId("contract") };
    setContracts(editContractId ? (prev) => prev.map((x) => x.id === editContractId ? c : x) : (prev) => [...prev, c]);
    logAction(editContractId ? "Editar Contrato" : "Cadastrar Contrato", c.sei);
    setOpenContractDlg("registry"); // Return to list after save
    flash(editContractId ? "Contrato atualizado!" : "Contrato cadastrado!");
  }, [contractForm, editContractId, contracts, logAction]);

  const deleteContract = useCallback((id, sei) => {
    if (!confirm(`Excluir contrato ${sei}?`)) return;
    setContracts((prev) => prev.filter((c) => c.id !== id));
    logAction("Excluir Contrato", sei || id);
    flash("Contrato excluído");
  }, [logAction]);

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
  const expJson = useCallback(() => { downloadFile("organograma-dmae.json", JSON.stringify({ nodes, assets }, null, 2)); flash("JSON exportado!"); }, [nodes, assets]);
  const expCsv = useCallback((nid) => {
    const sc = new Set(descendantIds(nid));
    const rows = [["Categoria","Nome","Fabricante","Modelo","Ano","Placa","Patrimônio","OS","Estrutura","Obs"],
      ...assets.filter((a) => sc.has(a.nodeId)).map((a) => [a.category,a.name,a.manufacturer,a.model,a.year,a.plate,a.patrimonio,a.os,nodePath(a.nodeId),a.notes])];
    downloadFile(`ativos-${(nodeMap.get(nid)?.name||"").toLowerCase()}.csv`, toCsv(rows), "text/csv;charset=utf-8;");
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
    r.onload = () => { try { const p = JSON.parse(String(r.result)); if (!Array.isArray(p?.nodes)||!p.nodes.length) throw 0; setNodes(p.nodes); setAssets(Array.isArray(p.assets)?p.assets:[]); setSelectedId(null); setFocusId(null); logAction("Importar Base JSON", "Substituição completa"); flash("Importado!"); } catch { alert("Arquivo inválido."); } };
    r.readAsText(f); e.target.value = "";
  }, [logAction]);

  // Login & Admin
  const doLogin = useCallback(() => {
    const u = users.find(x => x.username === loginUser && x.password === loginPass);
    if (u) {
      const role = u.role || "editor";
      setOpenLoginDlg(false); 
      setCurrentUser(u.username); 
      setCurrentUserRole(role);
      setLoginUser(""); setLoginPass(""); setLoginErr("");
      
      if (u.firstLogin) {
        setForcePassMode(true);
        setOpenPasswordDlg(true);
        flash("Primeiro acesso detectado: Defina sua senha definitiva.");
      } else {
        setCanEdit(true); 
        flash(`Acesso concedido como ${role}!`);
        logAction("Login", `Sessão iniciada (${role})`);
        if (pendingEditNodeId) {
          const pNode = nodeMap.get(pendingEditNodeId);
          if (pNode) {
            setTimeout(() => { setEditNodeId(pendingEditNodeId); setNodeForm({ ...pNode, parentId: pNode.parentId || "none" }); setOpenNodeDlg(true); setPendingEditNodeId(null); }, 300);
          } else { setPendingEditNodeId(null); }
        }
      }
      return;
    }
    setLoginErr("Credenciais inválidas.");
  }, [loginUser, loginPass, users, pendingEditNodeId, nodeMap, logAction]);

  const handleChangePassword = useCallback(() => {
    if (pwdNew.length < 3) { alert("A nova senha deve ter no mínimo 3 caracteres."); return; }
    if (pwdNew !== pwdConfirm) { alert("A nova senha e a confirmação não coincidem."); return; }
    
    const u = users.find(x => x.username === currentUser);
    if (!u) return;
    if (u.password !== pwdCurrent && !forcePassMode) {
        alert("Senha atual incorreta.");
        return;
    }
    
    setUsers(prev => prev.map(x => x.username === currentUser ? { ...x, password: pwdNew, firstLogin: false } : x));
    setOpenPasswordDlg(false);
    setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    flash("Senha alterada com sucesso!");
    logAction("Trocar Senha", `A conta ${currentUser} realizou alteração de senha.`);
    
    if (forcePassMode) {
       setForcePassMode(false);
       setCanEdit(true);
       logAction("Login", `Sessão primeira iniciada (${currentUserRole})`);
    }
  }, [pwdCurrent, pwdNew, pwdConfirm, currentUser, currentUserRole, users, logAction, forcePassMode]);

  const handleAddUser = useCallback(() => {
    if (!newUser.trim() || newPass.length < 3) { alert("Login/Senha muito curtos."); return; }
    if (users.some(u => u.username === newUser)) { alert("Usuário já existe!"); return; }
    setUsers(prev => [...prev, { username: newUser, password: newPass, role: newIsAdmin ? "admin" : "editor", firstLogin: true }]);
    logAction("Novo Usuário", `Criado: ${newUser} (${newIsAdmin ? "admin" : "editor"})`);
    setNewUser(""); setNewPass(""); setNewIsAdmin(false); flash("Usuário cadastrado!");
  }, [newUser, newPass, newIsAdmin, users, logAction]);

  const handleDelUser = useCallback((username) => {
    if (username === currentUser) { alert("Não pode excluir a si mesmo!"); return; }
    if (username === "admin") { alert("A conta admin padrão não pode ser excluída."); return; }
    if (!confirm(`Excluir conta ${username}?`)) return;
    setUsers(p => p.filter(x => x.username !== username));
    logAction("Excluir Usuário", `Apagado: ${username}`);
    flash("Usuário removido.");
  }, [currentUser, logAction]);
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
    setTimeout(() => {
      const vp = vpRef.current;
      if (!vp) return;
      const el = vp.querySelector(`[data-node-id="${nodeId}"] .org-card`);
      if (el) {
        const vpRect = vp.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const dx = elRect.left - vpRect.left + vp.scrollLeft - (vpRect.width / 2) + (elRect.width / 2);
        const dy = elRect.top - vpRect.top + vp.scrollTop - (vpRect.height / 2) + (elRect.height / 2);
        vp.scrollTo({ left: Math.max(0, dx), top: Math.max(0, dy), behavior: "smooth" });
      }
    }, 300);
  }, []);

  const handleReturnFromFocus = useCallback(() => {
    if (!focusId) return;
    const fn = nodeMap.get(focusId);
    if (fn && fn.parentId) {
      setFocusId(fn.parentId);
    } else {
      setFocusId(null);
    }
  }, [focusId, nodeMap]);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ═══ FIXED HEADER ═══ */}
      <header className="app-header">
        <div className="header-row-1">
          <div className="header-brand">
            <div className="header-icon"><FolderTree size={16} /></div>
            <div><div className="header-title">Organograma DMAE</div><div className="header-sub">Prefeitura de Porto Alegre</div></div>
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
                        setEditContractId(it.id); setContractForm(it); setOpenContractDlg("edit");
                      } else {
                        selectNode(it.id); setFocusId(it.id); 
                      }
                      setQuery(""); 
                    }}>
                      <div className="av" style={{ width: 28, height: 28, minWidth: 28, borderRadius: 6 }}>
                        {it.resultType === "contract" ? <ClipboardList size={14} /> : (it.foto ? <img src={it.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 8 }}>{initials(it.name)}</span>)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="search-item-name">{it.name} {it.resultType === "person" && <span style={{fontSize: 9, fontWeight: 400, opacity: 0.7}}>(Pessoa)</span>} {it.resultType === "contract" && <span style={{fontSize: 9, fontWeight: 400, opacity: 0.7}}>(Contrato)</span>}</div>
                        <div className="search-item-sub">{it.resultType === "person" ? it.cargo : it.resultType === "contract" ? (it.objeto?.substring(0, 60) + "...") : (it.funcao || it.cargo)}</div>
                        {it.resultType === "contract" && it.itens && <div style={{fontSize: 8, color: "var(--n400)"}}>Itens: {it.itens.substring(0, 50)}...</div>}
                        {it.resultType === "person" && it.contracts?.length > 0 && it.contracts.map((c, idx) => (
                          <div key={c?.sei || idx} style={{fontSize: 8, color: "var(--n400)"}}>Contrato: {c?.sei || "N/A"} - {c?.tipo || ""}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="view-toggle">
              <button className={viewMode === "tree" ? "active" : ""} onClick={() => setViewMode("tree")}><Network size={12} /> Árvore</button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List size={12} /> Lista</button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { setFocusId(null); setSelectedId(null); setShowDetail(false); }}>
              <Home size={12} /> Início
            </button>
            {canEdit && <button className="btn btn-outline btn-sm" onClick={() => setOpenLogsDlg(true)}><FileText size={12} /> Logs do Sistema</button>}
            {canEdit && (
              <button className="btn btn-outline btn-sm" onClick={() => setOpenPersonDlg("registry")}><Users size={12} /> Cadastro de Pessoas</button>
            )}
            {canEdit && (
              <button className="btn btn-outline btn-sm" onClick={() => setOpenContractDlg("registry")}><ClipboardList size={12} /> Cadastro de Contratos</button>
            )}
            {canEdit && currentUserRole === "admin" && (
              <button className="btn btn-outline btn-sm" onClick={() => setOpenUsersDlg(true)}><ShieldCheck size={12} /> Usuários</button>
            )}
            <button className="btn btn-outline btn-sm" onClick={expJson}><Download size={12} /> JSON</button>
            <label className="import-label"><Upload size={12} /> Importar<input type="file" accept=".json" onChange={handleImport} /></label>
            {canEdit ? (
               <>
                 <button className="btn btn-outline btn-sm" onClick={() => setOpenPasswordDlg(true)}><KeyRound size={12} /> Trocar Senha</button>
                 <button className="btn btn-primary btn-sm" onClick={() => { setCanEdit(false); setCurrentUser(""); setCurrentUserRole(""); logAction("Logout", "Sessão encerrada"); }}>Sair ({currentUser})</button>
               </>
            ) : (
               <button className="btn btn-primary btn-sm" onClick={() => { setOpenLoginDlg(true); }}><KeyRound size={12}/> Entrar</button>
            )}
          </div>
        </div>

        <div className="header-row-2">
          <span className="stat-pill"><Users size={11} /> {persons.length} Pessoas (Ref.)</span>
          <span className="stat-pill"><Building2 size={11} /> {totalEstruturas} Estruturas</span>
          <span className="stat-pill"><ClipboardList size={11} /> {assets.length} Ativos</span>

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

      {/* ═══ MAIN ═══ */}
      <div className="main-content">
        {viewMode === "tree" ? (
          <div className="tree-viewport" ref={vpRef} style={{ position: "relative" }}>
            <div className="zoom-ctrls" style={{ position: "fixed", bottom: 80, left: 24, display: "flex", gap: 8, zIndex: 50 }}>
              <button className="btn btn-outline" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>-</span></button>
              <button className="btn btn-outline" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(1)}><span style={{ fontSize: 12, fontWeight: "bold" }}>{Math.round(zoom * 100)}%</span></button>
              <button className="btn btn-outline" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => setZoom(z => Math.min(2, z + 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>+</span></button>
            </div>
            <div className="tree-viewport-inner" style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease-out" }}>
              {focused && (
                <div className="tree">
                  <ul>
                    <OrgBranch
                      node={focused} getChildren={getChildren} personMap={personMap}
                      selectedId={selectedId} onSelect={selectNode}
                      onAddChild={handleAddFromCard} onEditNode={handleEditFromCard}
                      onExpand={handleExpand} onShowPerson={setShowPersonDetail}
                      directAssetCount={directAssetCount}
                      canEdit={canEdit} parentHex={null}
                      isFocusRoot={!!focusId && focusId !== rootNode?.id}
                      onReturnFromFocus={handleReturnFromFocus}
                    />
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="list-view">
            {focused && <ListNode node={focused} getChildren={getChildren} onSelect={selectNode} />}
          </div>
        )}
      </div>

      {/* ═══ FLOATING EDIT BUTTON ═══ */}
      <button className={`fab-edit ${canEdit ? "active" : ""}`}
        onClick={() => canEdit ? setCanEdit(false) : setOpenLoginDlg(true)}
        title={canEdit ? "Sair da edição e salvar" : "Entrar na edição"}>
        {canEdit ? <Save size={22} /> : <KeyRound size={22} />}
      </button>

      {/* ═══ DETAIL MODAL (shows when clicking a card) ═══ */}
      {showDetail && selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setShowDetail(false); }}>
          <div className="modal-content wide" style={{ position: "relative" }}>
            <button className="detail-close" onClick={() => setShowDetail(false)}><X size={14} /></button>
            <div className="detail-head">
              {(() => {
                const pObj = selected.personId ? personMap.get(selected.personId) : null;
                const dPhoto = pObj?.photo || selected.foto;
                return (
                  <div className="av av-lg" style={{ cursor: dPhoto ? "zoom-in" : "default" }} onClick={(e) => { if(dPhoto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: dPhoto })); } }}>
                    {dPhoto ? <img src={dPhoto} alt="" /> : <span className="av-fb">{initials(selected?.name || "??")}</span>}
                  </div>
                );
              })()}
              <div className="detail-head-info">
                <div className="detail-name">{selected.name}</div>
                <div className="detail-cargo">{selected.description || selected.cargo}</div>
                <div className="detail-resp" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {selected.responsavel || "—"}
                  {selected.personId && (
                    <button className="btn btn-outline btn-xs btn-icon" style={{ width: 20, height: 20 }} onClick={() => setShowPersonDetail(selected.personId)} title="Ver cadastro completo">
                      <Users size={12} />
                    </button>
                  )}
                </div>
                <div className="detail-mat">{selected.funcao || "---"} • Mat: {selected.matricula || "---"}</div>
                <div className="detail-badges">
                  <span className="badge badge-sec">{selected.tipo}</span>
                  <span className={`badge ${selected.subtipo === "apoio" ? "badge-apoio" : "badge-out"}`}>{selected.subtipo === "apoio" ? "apoio" : "subordinada"}</span>
                  {selected.lotacao && <span className="badge badge-out">{selected.lotacao}</span>}
                </div>
              </div>
            </div>

            <div className="detail-actions" style={{ marginTop: 16, borderTop: "1px solid var(--n100)", paddingTop: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {canEdit && <>
                  <button className="btn btn-primary btn-xs" onClick={() => { setShowDetail(false); openNewNode(selected.id); }}><Plus size={12} /> Nova caixa</button>
                  {selected.tipo === "estrutura" && <button className="btn btn-outline btn-xs" onClick={() => { setShowDetail(false); openNewAsset(selected.id); }}><ClipboardList size={12} /> Novo ativo</button>}
                  <button className="btn btn-outline btn-xs" onClick={() => { setShowDetail(false); openEditNode(); }}><Pencil size={12} /> Editar</button>
                </>}
                <button className="btn btn-outline btn-xs" onClick={() => { setFocusId(selected.id); setShowDetail(false); }}><Network size={12} /> Foco</button>
                {selected.tipo === "estrutura" && (
                  <>
                    <button className="btn btn-outline btn-xs" onClick={() => expCsv(selected.id)} title="Baixar lista em CSV"><Download size={12} /> CSV</button>
                    {(directAssets.length > 0 || scopeAssets.length > 0) && (
                      <button className="btn btn-outline btn-xs" onClick={() => exportAssetsPdf(scopeAssets, selected.name, (id) => nodeMap.get(id)?.name || "N/A")} title="Gerar relatório de ativos em PDF"><Printer size={12} /> PDF</button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="detail-grid">
              <div className="dg-item"><div className="dg-label">Subordinado a</div><div className="dg-val">{selected.parentId ? nodeMap.get(selected.parentId)?.name : "—"}</div></div>
              <div className="dg-item"><div className="dg-label">Responsável</div><div className="dg-val">{selected.responsavel || "—"}</div></div>
              <div className="dg-item"><div className="dg-label">Matrícula</div><div className="dg-val">{selected.matricula || "—"}</div></div>
              <div className="dg-item"><div className="dg-label">Caixas abaixo</div><div className="dg-val">{getChildren(selected.id).length}</div></div>
              <div className="dg-item"><div className="dg-label">Lotação</div><div className="dg-val">{selected.lotacao || "—"}</div></div>
              <div className="dg-item"><div className="dg-label"><Mail size={10} /> E-mail</div><div className="dg-val">{selected.email || "—"}</div></div>
              <div className="dg-item"><div className="dg-label"><Phone size={10} /> Telefone</div><div className="dg-val">{selected.telefone || "—"}</div></div>
            </div>

            {selected.observacoes && <div className="detail-obs">{selected.observacoes}</div>}

            {/* Assets in this node */}
            {directAssets.length > 0 && (
              <div className="asset-section">
                <div className="asset-section-title"><ClipboardList size={13} /> Ativos diretos ({directAssets.length})</div>
                {directAssets.map((a) => (
                  <div key={a.id} className="asset-mini">
                    <div className="asset-mini-name">{assetIcon(a.category)} {a.name}</div>
                    <div className="asset-mini-meta">{[a.manufacturer, a.model, a.year].filter(Boolean).join(" • ")}</div>
                    <div className="asset-mini-badges">
                      {a.plate && <span className="badge badge-out">Placa {a.plate}</span>}
                      {a.patrimonio && <span className="badge badge-out">Pat. {a.patrimonio}</span>}
                    </div>
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
            
            {/* Contracts where the responsible person is involved */}
            {selected.personId && (
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
                      <div className="asset-mini-meta" style={{fontSize: 10}}><b>Objeto:</b> {c.objeto}</div>
                      <div className="asset-mini-badges">
                        <span className="badge badge-sec" style={{fontSize: 8}}>
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

      {/* ═══ LOGIN MODAL ═══ */}
      {openLoginDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) { setOpenLoginDlg(false); setPendingEditNodeId(null); } }}>
          <div className="modal-content narrow">
            <button className="modal-close" onClick={() => { setOpenLoginDlg(false); setPendingEditNodeId(null); }}><X size={12} /></button>
            <div className="modal-header"><h2>Login de edição</h2></div>
            <div className="modal-body">
              <div className="fg"><label className="fl">Usuário (Login)</label><input className="fi" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} /></div>
              <div className="fg"><label className="fl">Senha</label><input className="fi" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} /></div>
              {loginErr && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{loginErr}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => { setOpenLoginDlg(false); setPendingEditNodeId(null); }}>Cancelar</button>
              <button className="btn btn-primary btn-xs" onClick={doLogin}>Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXPANDED IMAGE OVERLAY ═══ */}
      {expandedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }} 
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="Foto Expandida" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
        </div>
      )}


      {/* ═══ NODE DIALOG ═══ */}
      {openNodeDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenNodeDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenNodeDlg(false)}><X size={12} /></button>
            <div className="modal-header"><h2>{editNodeId ? "Editar caixa" : "Nova caixa"}</h2></div>
            <div className="modal-body">
              <div className="fg">
                <label className="fl">Foto</label>
                <div className="photo-area">
                  <div className="photo-prev">
                    {nodeForm.foto ? <img src={nodeForm.foto} alt="" /> : <span className="photo-prev-fb">{initials(nodeForm.name)}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label className="photo-lbl"><ImagePlus size={12} /> Selecionar foto<input type="file" accept="image/*" onChange={handlePhoto} /></label>
                    {nodeForm.foto && <button className="color-clr" onClick={() => setNodeForm((p) => ({ ...p, foto: "" }))}>Remover</button>}
                  </div>
                </div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Nome da caixa (Sigla)</label><input className="fi" placeholder="Ex: C-OPLUV" value={nodeForm.name} onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })} /></div>
                <div className="fg"><label className="fl">Descrição por Extenso</label><input className="fi" placeholder="Ex: Coordenação de Operação Pluvial" value={nodeForm.description} onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })} /></div>
              </div>
              
              <div style={{ background: "var(--n50)", padding: 12, borderRadius: 12, border: "1px solid var(--n200)", display: "flex", flexDirection: "column", gap: 12 }}>
                <PersonSelector 
                  label="Responsável (Pesquisar no Cadastro de Pessoas)"
                  valueId={nodeForm.personId}
                  persons={persons}
                  nodes={nodes}
                  onSelect={(id) => {
                    const p = personMap.get(id);
                    if (p) {
                      setNodeForm({ ...nodeForm, responsavel: p.name, matricula: p.matricula, personId: p.id, cargo: p.cargo });
                    }
                  }}
                  onClear={() => setNodeForm({ ...nodeForm, responsavel: "", matricula: "", personId: "" })}
                />
                <div className="fr">
                  <div className="fg"><label className="fl">Função nesta Unidade</label><input className="fi" placeholder="Ex: Coordenador" value={nodeForm.funcao} onChange={(e) => setNodeForm({ ...nodeForm, funcao: e.target.value })} /></div>
                  <div className="fg"><label className="fl">Matrícula</label><input className="fi" placeholder="000.000-0" value={nodeForm.matricula} readOnly={!!nodeForm.personId} style={{ opacity: nodeForm.personId ? 0.7 : 1 }} onChange={(e) => setNodeForm({ ...nodeForm, matricula: e.target.value })} /></div>
                </div>
              </div>

              <div className="fr">
                <div className="fg"><label className="fl">Tipo</label>
                  <select className="fs" value={nodeForm.tipo} onChange={(e) => setNodeForm({ ...nodeForm, tipo: e.target.value })}>
                    <option value="estrutura">Estrutura</option><option value="pessoa">Pessoa</option>
                  </select></div>
                <div className="fg"><label className="fl">Relação</label>
                  <select className="fs" value={nodeForm.subtipo} onChange={(e) => setNodeForm({ ...nodeForm, subtipo: e.target.value })}>
                    <option value="subordinada">Subordinada direta</option><option value="apoio">Apoio (gabinete/assessoria)</option>
                  </select></div>
              </div>
              <div className="fg"><label className="fl">Subordinado a</label>
                <select className="fs" value={nodeForm.parentId || "none"} onChange={(e) => setNodeForm({ ...nodeForm, parentId: e.target.value })}>
                  <option value="none">Sem superior</option>
                  {parentOpts.map((n) => <option key={n.id} value={n.id}>{"\u00A0\u00A0\u00A0\u00A0".repeat(n.depth)}{n.name}{n.subtipo === "apoio" ? " (apoio)" : ""}</option>)}
                </select></div>
              <div className="fr">
                <div className="fg"><label className="fl">Unidade</label><input className="fi" value={nodeForm.unidade} onChange={(e) => setNodeForm({ ...nodeForm, unidade: e.target.value })} /></div>
                <div className="fg"><label className="fl">Lotação</label><input className="fi" value={nodeForm.lotacao} onChange={(e) => setNodeForm({ ...nodeForm, lotacao: e.target.value })} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">E-mail</label><input className="fi" value={nodeForm.email} onChange={(e) => setNodeForm({ ...nodeForm, email: e.target.value })} /></div>
                <div className="fg"><label className="fl">Telefone</label><input className="fi" value={nodeForm.telefone} onChange={(e) => setNodeForm({ ...nodeForm, telefone: e.target.value })} /></div>
              </div>
              <div className="fg">
                <label className="fl">Cor (vazio = herda do pai)</label>
                <div className="color-row">
                  <input type="color" className="color-sw" value={nodeForm.color || "#40E0D0"} onChange={(e) => setNodeForm({ ...nodeForm, color: e.target.value })} />
                  <input className="color-hex" placeholder="#HEX" value={nodeForm.color} onChange={(e) => setNodeForm({ ...nodeForm, color: e.target.value })} />
                  {nodeForm.color && <button className="color-clr" onClick={() => setNodeForm((p) => ({ ...p, color: "" }))}>Herdar</button>}
                </div>
              </div>
              <div className="fg"><label className="fl">Tags</label><input className="fi" placeholder="ex.: pluvial, equipe" value={nodeForm.tags} onChange={(e) => setNodeForm({ ...nodeForm, tags: e.target.value })} /></div>
              <div className="fg"><label className="fl">Observações</label><textarea className="ft" value={nodeForm.observacoes} onChange={(e) => setNodeForm({ ...nodeForm, observacoes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenNodeDlg(false)}>Cancelar</button>
              <button className="btn btn-primary btn-xs" onClick={saveNode}><Save size={12} /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ASSET DIALOG ═══ */}
      {openAssetDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenAssetDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenAssetDlg(false)}><X size={12} /></button>
            <div className="modal-header"><h2>{editAssetId ? "Editar ativo" : "Novo ativo"}</h2></div>
            <div className="modal-body">
              <div className="fr">
                <div className="fg"><label className="fl">Estrutura</label>
                  <select className="fs" value={assetForm.nodeId} onChange={(e) => setAssetForm({ ...assetForm, nodeId: e.target.value })}>
                    {nodes.filter((n) => n.tipo === "estrutura").sort(sortNodes).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select></div>
                <div className="fg"><label className="fl">Categoria</label>
                  <select className="fs" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}>
                    <option value="veículo">Veículo</option><option value="equipamento">Equipamento</option>
                    <option value="ferramenta">Ferramenta</option><option value="máquina">Máquina</option><option value="outro">Outro</option>
                  </select></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Nome</label><input className="fi" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} /></div>
                <div className="fg"><label className="fl">Fabricante</label><input className="fi" value={assetForm.manufacturer} onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Modelo</label><input className="fi" value={assetForm.model} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} /></div>
                <div className="fg"><label className="fl">Ano</label><input className="fi" value={assetForm.year} onChange={(e) => setAssetForm({ ...assetForm, year: e.target.value })} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Placa</label><input className="fi" value={assetForm.plate} onChange={(e) => setAssetForm({ ...assetForm, plate: e.target.value })} /></div>
                <div className="fg"><label className="fl">Patrimônio</label><input className="fi" value={assetForm.patrimonio} onChange={(e) => setAssetForm({ ...assetForm, patrimonio: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">OS</label><input className="fi" value={assetForm.os} onChange={(e) => setAssetForm({ ...assetForm, os: e.target.value })} /></div>
              <div className="fg"><label className="fl">Observações</label><textarea className="ft" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenAssetDlg(false)}>Cancelar</button>
              <button className="btn btn-primary btn-xs" onClick={saveAsset}><Save size={12} /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LOGS MODAL ═══ */}
      {openLogsDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenLogsDlg(false); }}>
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
                    <button className="btn btn-outline btn-xs" onClick={() => exportLogsCsv(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }}/> CSV</button>
                    <button className="btn btn-outline btn-xs" onClick={() => generateDirectPdf(filteredLogs)} style={{ height: 32 }}><Download size={12} style={{ marginRight: 4 }}/> Baixar PDF</button>
                    <button className="btn btn-outline btn-xs" onClick={() => exportLogsPdf(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }}/> Imprimir</button>
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
              <button className="btn btn-outline btn-xs" onClick={() => { if(confirm("Apagar histórico de modificações?")) setLogs([]); }}>Limpar Histórico</button>
              <button className="btn btn-primary btn-xs" onClick={() => setOpenLogsDlg(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ USUARIOS MODAL ═══ */}
      {openUsersDlg && currentUserRole === "admin" && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenUsersDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenUsersDlg(false)}><X size={12} /></button>
            <div className="modal-header"><h2>Gerenciamento de Usuários</h2><p>Controle de administradores e editores.</p></div>
            <div className="modal-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "flex-end", background: "var(--n50)", padding: 12, borderRadius: 8, border: "1px solid var(--n200)" }}>
                 <div className="fg" style={{ flex: 1, minWidth: 120, margin: 0 }}><label className="fl">Novo Login</label><input className="fi" value={newUser} onChange={(e) => setNewUser(e.target.value)} /></div>
                 <div className="fg" style={{ flex: 1, minWidth: 120, margin: 0 }}><label className="fl">Senha</label><input className="fi" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></div>
                 <label style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, cursor: "pointer", userSelect: "none" }}>
                   <input type="checkbox" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} /> É Adminstrador?
                 </label>
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
                        <td style={{ padding: "8px 12px" }}><b>{u.username}</b> {u.username === currentUser && "(Você)"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span className={u.role === "admin" ? "badge badge-out" : "badge badge-sec"} style={{ fontSize: 10 }}>{u.role === "admin" ? "Administrador" : "Editor"}</span>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                           {u.username !== "admin" && u.username !== currentUser && (
                              <button className="btn btn-outline btn-xs" onClick={() => handleDelUser(u.username)}><Trash2 size={10} /> Excluir</button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-xs" onClick={() => setOpenUsersDlg(false)}>Fechar painel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERSON REGISTRY / EDIT MODAL ═══ */}
      {openPersonDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenPersonDlg(false); }}>
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
                    <button className="btn btn-primary btn-sm" onClick={() => { setEditPersonId(null); setPersonForm(emptyPerson); setOpenPersonDlg("edit"); }}>+ Nova Pessoa</button>
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
                            <td style={{ padding: 10 }}><b>{p.name}</b><br/><span style={{ fontSize: 10, color: "var(--n400)" }}>{p.matricula} • {p.regime || "—"} / {p.vinculo || "—"}</span></td>
                            <td style={{ padding: 10 }}>{p.cargo}</td>
                            <td style={{ padding: 10, textAlign: "right" }}>
                              <button className="btn btn-outline btn-xs" title="Visualizar Detalhes" onClick={() => setShowPersonDetail(p.id)} style={{ marginRight: 4 }}><Users size={12} /></button>
                              <button className="btn btn-outline btn-xs" title="Editar Cadastro" onClick={() => { setEditPersonId(p.id); setPersonForm(p); setOpenPersonDlg("edit"); }} style={{ marginRight: 4 }}><Pencil size={12} /></button>
                              <button className="btn btn-outline btn-xs" title="Excluir Registro" onClick={() => deletePerson(p.id, p.name)}><Trash2 size={12} /></button>
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
                  <div className="fg"><label className="fl">Nome Completo *</label><input className="fi" value={personForm.name} onChange={(e) => setPersonForm({...personForm, name: e.target.value})} /></div>
                  <div className="fg"><label className="fl">Matrícula *</label><input className="fi" value={personForm.matricula} onChange={(e) => setPersonForm({...personForm, matricula: e.target.value})} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Cargo Oficial *</label><input className="fi" value={personForm.cargo} onChange={(e) => setPersonForm({...personForm, cargo: e.target.value})} /></div>
                  <div className="fg"><label className="fl">E-mail *</label><input className="fi" value={personForm.email} onChange={(e) => setPersonForm({...personForm, email: e.target.value})} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Telefone</label><input className="fi" value={personForm.telefone || ""} onChange={(e) => setPersonForm({...personForm, telefone: e.target.value})} /></div>
                  <div className="fg"><label className="fl">Ramal</label><input className="fi" value={personForm.ramal || ""} onChange={(e) => setPersonForm({...personForm, ramal: e.target.value})} /></div>
                </div>
                <div className="fr">
                  <div className="fg"><label className="fl">Regime Jurídico</label><input className="fi" value={personForm.regime} onChange={(e) => setPersonForm({...personForm, regime: e.target.value})} placeholder="Estatutário, CLT..." /></div>
                  <div className="fg"><label className="fl">Vínculo</label><input className="fi" value={personForm.vinculo} onChange={(e) => setPersonForm({...personForm, vinculo: e.target.value})} placeholder="Efetivo, Adido..." /></div>
                </div>
                <div className="fg">
                  <label className="fl">Foto do Colaborador</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--n100)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--n200)" }}>
                      {personForm.photo ? <img src={personForm.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Users size={20} color="var(--n400)" />}
                    </div>
                    <label className="btn btn-outline btn-xs" style={{ cursor: "pointer" }}>
                      Selecionar Foto
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const b64 = await fileToBase64(file);
                          setPersonForm({ ...personForm, photo: b64 });
                        }
                      }} />
                    </label>
                    {personForm.photo && <button className="btn btn-outline btn-xs" style={{ color: "red" }} onClick={() => setPersonForm({ ...personForm, photo: "" })}>Remover</button>}
                  </div>
                </div>
                <div className="fg"><label className="fl">Endereço de Lotação</label><input className="fi" value={personForm.lotacao || ""} onChange={(e) => setPersonForm({...personForm, lotacao: e.target.value})} /></div>
              </div>
            )}
            
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenPersonDlg(openPersonDlg === "registry" ? false : "registry")}>{openPersonDlg === "registry" ? "Fechar" : "Voltar"}</button>
              {openPersonDlg === "edit" && <button className="btn btn-primary btn-xs" onClick={savePerson}>Salvar Alterações</button>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERSON DETAIL VIEW ═══ */}
      {showPersonDetail && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setShowPersonDetail(null); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setShowPersonDetail(null)}><X size={12} /></button>
            {personMap.has(showPersonDetail) ? (
              (() => {
                const p = personMap.get(showPersonDetail);
                return (
                  <>
                    <div className="modal-header"><h2>{p.name}</h2><p>{p.cargo} • Matrícula {p.matricula}</p></div>
                    <div className="modal-body">
                      <div className="detail-grid" style={{ padding: 0, gridTemplateColumns: "1fr 1fr 1fr" }}>
                        <div className="dg-item"><div className="dg-label">E-mail</div><div className="dg-val">{p.email}</div></div>
                        <div className="dg-item"><div className="dg-label">Telefone</div><div className="dg-val">{p.telefone || "—"}</div></div>
                        <div className="dg-item"><div className="dg-label">Ramal</div><div className="dg-val">{p.ramal || "—"}</div></div>
                        <div className="dg-item"><div className="dg-label">Regime</div><div className="dg-val">{p.regime || "—"}</div></div>
                        <div className="dg-item"><div className="dg-label">Vínculo</div><div className="dg-val">{p.vinculo || "—"}</div></div>
                        <div className="dg-item" style={{ gridColumn: "span 3" }}><div className="dg-label">Endereço de Lotação</div><div className="dg-val">{p.lotacao || "—"}</div></div>
                      </div>
                      
                      <div className="asset-section" style={{ padding: 0, marginTop: 12 }}>
                        <div className="asset-section-title"><ShieldCheck size={14} /> Contratos Vincuados (Gestor/Fiscal)</div>
                        {(() => {
                          const pContracts = contracts.filter(c => 
                            c.gestor.titularId === showPersonDetail || c.gestor.suplenteId === showPersonDetail ||
                            c.fiscaisContrato.some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail) ||
                            c.fiscaisServico.some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail)
                          );
                          return pContracts.length > 0 ? pContracts.map((c) => (
                            <div key={c.id} className="asset-mini" style={{ background: "var(--n50)" }}>
                              <div className="asset-mini-name">{c.sei} <span className="badge badge-sec" style={{ marginLeft: "auto", fontSize: 9 }}>
                                {c.gestor.titularId === showPersonDetail || c.gestor.suplenteId === showPersonDetail ? "Gestor" : 
                                 c.fiscaisContrato.some(f => f.titularId === showPersonDetail || f.suplenteId === showPersonDetail) ? "Fiscal Contrato" : "Fiscal Serviço"}
                              </span></div>
                              <div className="asset-mini-meta"><b>Objeto:</b> {c.objeto}</div>
                              <div className="asset-mini-meta"><b>Papel:</b> {
                                c.gestor.titularId === showPersonDetail ? "Titular (Gestor)" : 
                                c.gestor.suplenteId === showPersonDetail ? "Suplente (Gestor)" :
                                c.fiscaisContrato.some(f => f.titularId === showPersonDetail) ? "Titular (Fiscal Contrato)" :
                                c.fiscaisContrato.some(f => f.suplenteId === showPersonDetail) ? "Suplente (Fiscal Contrato)" :
                                c.fiscaisServico.some(f => f.titularId === showPersonDetail) ? "Titular (Fiscal Serviço)" :
                                "Suplente (Fiscal Serviço)"
                              }</div>
                            </div>
                          )) : <p style={{ fontSize: 12, color: "var(--n400)" }}>Nenhum contrato vinculado.</p>;
                        })()}
                      </div>

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

      {/* ═══ CONTRACT REGISTRY / EDIT MODAL ═══ */}
      {openContractDlg && (
        <div className="modal-overlay" onMouseDown={(e) => { if(e.target === e.currentTarget) setOpenContractDlg(false); }}>
          <div className="modal-content wide">
            <button className="modal-close" onClick={() => setOpenContractDlg(false)}><X size={12} /></button>
            <div className="modal-header">
              <h2>{openContractDlg === "registry" ? "Cadastro de Contratos" : (editContractId ? "Editar Contrato" : "Cadastrar Contrato")}</h2>
              <p>{openContractDlg === "registry" ? "Base de dados centralizada de contratos e seus respectivos fiscais." : "Preencha as informações do processo SEI e responsabilidades."}</p>
            </div>
            
            {openContractDlg === "registry" ? (
              <div className="modal-body" style={{ minHeight: 400 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditContractId(null); setContractForm(emptyContract); setOpenContractDlg("edit"); }}>+ Novo Contrato</button>
                  <div className="hdr-search" style={{ width: 220 }}><Search size={12} /><input placeholder="Filtrar contratos..." onChange={(e) => { /* filter logic if needed */ }} /></div>
                </div>
                <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ background: "var(--n50)" }}>
                      <tr><th style={{ padding: 10, textAlign: "left" }}>Nº SEI</th><th style={{ padding: 10, textAlign: "left" }}>Objeto / Itens</th><th style={{ padding: 10, textAlign: "right" }}>Ações</th></tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => (
                        <tr key={c.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                          <td style={{ padding: 10 }}><b>{c.sei}</b></td>
                          <td style={{ padding: 10, maxWidth: 300 }}><div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.objeto}</div><div style={{ fontSize: 10, color: "var(--n500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.itens || "(Sem itens listados)"}</div></td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            <button className="btn btn-outline btn-xs" onClick={() => { setEditContractId(c.id); setContractForm(c); setOpenContractDlg("edit"); }} style={{ marginRight: 4 }}><Pencil size={12} /></button>
                            <button className="btn btn-outline btn-xs" onClick={() => deleteContract(c.id, c.sei)}><Trash2 size={12} /></button>
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
                  <div className="fg"><label className="fl">Nº Processo (SEI) *</label><input className="fi" value={contractForm.sei} onChange={(e) => setContractForm({...contractForm, sei: e.target.value})} placeholder="Ex: 25.10.000010414-3" /></div>
                  <div style={{ flex: 1 }} />
                </div>
                <div className="fg"><label className="fl">Objeto do Contrato *</label><textarea className="ft" style={{ height: 60 }} value={contractForm.objeto} onChange={(e) => setContractForm({...contractForm, objeto: e.target.value})} placeholder="Descreva o objeto da contratação..." /></div>
                <div className="fg"><label className="fl">Itens do Contrato (Materiais / Serviços)</label><textarea className="ft" style={{ height: 60 }} value={contractForm.itens} onChange={(e) => setContractForm({...contractForm, itens: e.target.value})} placeholder="Liste os materiais ou serviços contemplados..." /></div>
                
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                   {/* GESTOR SECTION */}
                   <div style={{ background: "var(--n50)", padding: 12, borderRadius: 12, border: "1px solid var(--n200)" }}>
                     <h3 style={{ fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} /> Gestor do Contrato</h3>
                     <PersonSelector label="Titular" valueId={contractForm.gestor.titularId} persons={persons} nodes={nodes} onSelect={(id) => setContractForm({...contractForm, gestor: {...contractForm.gestor, titularId: id}})} onClear={() => setContractForm({...contractForm, gestor: {...contractForm.gestor, titularId: ""}})} />
                     <PersonSelector label="Suplente" valueId={contractForm.gestor.suplenteId} persons={persons} nodes={nodes} onSelect={(id) => setContractForm({...contractForm, gestor: {...contractForm.gestor, suplenteId: id}})} onClear={() => setContractForm({...contractForm, gestor: {...contractForm.gestor, suplenteId: ""}})} />
                   </div>

                   <div style={{ opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed var(--n200)", borderRadius: 12 }}>
                     <p style={{ fontSize: 11, textAlign: "center" }}>Defina o Gestor e respectivos Fiscais<br/>nos campos ao lado e abaixo.</p>
                   </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Fiscais de Contrato</h3>
                    <button className="btn btn-outline btn-xs" onClick={() => setContractForm({...contractForm, fiscaisContrato: [...contractForm.fiscaisContrato, { titularId: "", suplenteId: "" }]})}>+ Add Fiscal</button>
                  </div>
                  {contractForm.fiscaisContrato.map((f, idx) => (
                    <div key={idx} className="fr" style={{ marginBottom: 12, background: "var(--n50)", padding: 10, borderRadius: 12, border: "1px solid var(--n200)", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}><PersonSelector label={`Titular ${idx + 1}`} valueId={f.titularId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisContrato]; nf[idx].titularId = id; setContractForm({...contractForm, fiscaisContrato: nf}); }} onClear={() => { const nf = [...contractForm.fiscaisContrato]; nf[idx].titularId = ""; setContractForm({...contractForm, fiscaisContrato: nf}); }} /></div>
                      <div style={{ flex: 1 }}><PersonSelector label={`Suplente ${idx + 1}`} valueId={f.suplenteId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisContrato]; nf[idx].suplenteId = id; setContractForm({...contractForm, fiscaisContrato: nf}); }} onClear={() => { const nf = [...contractForm.fiscaisContrato]; nf[idx].suplenteId = ""; setContractForm({...contractForm, fiscaisContrato: nf}); }} /></div>
                      <button className="btn btn-outline btn-xs" style={{ marginBottom: 12, color: "red" }} onClick={() => setContractForm({...contractForm, fiscaisContrato: contractForm.fiscaisContrato.filter((_, i) => i !== idx)})}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={14} /> Fiscais de Serviço</h3>
                    <button className="btn btn-outline btn-xs" onClick={() => setContractForm({...contractForm, fiscaisServico: [...contractForm.fiscaisServico, { titularId: "", suplenteId: "" }]})}>+ Add Fiscal de Serviço</button>
                  </div>
                  {contractForm.fiscaisServico.map((f, idx) => (
                    <div key={idx} className="fr" style={{ marginBottom: 12, background: "var(--n50)", padding: 10, borderRadius: 12, border: "1px solid var(--n200)", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}><PersonSelector label={`Titular ${idx + 1}`} valueId={f.titularId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisServico]; nf[idx].titularId = id; setContractForm({...contractForm, fiscaisServico: nf}); }} onClear={() => { const nf = [...contractForm.fiscaisServico]; nf[idx].titularId = ""; setContractForm({...contractForm, fiscaisServico: nf}); }} /></div>
                      <div style={{ flex: 1 }}><PersonSelector label={`Suplente ${idx + 1}`} valueId={f.suplenteId} persons={persons} onSelect={(id) => { const nf = [...contractForm.fiscaisServico]; nf[idx].suplenteId = id; setContractForm({...contractForm, fiscaisServico: nf}); }} onClear={() => { const nf = [...contractForm.fiscaisServico]; nf[idx].suplenteId = ""; setContractForm({...contractForm, fiscaisServico: nf}); }} /></div>
                      <button className="btn btn-outline btn-xs" style={{ marginBottom: 12, color: "red" }} onClick={() => setContractForm({...contractForm, fiscaisServico: contractForm.fiscaisServico.filter((_, i) => i !== idx)})}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-footer">
              <button className="btn btn-outline btn-xs" onClick={() => setOpenContractDlg(openContractDlg === "registry" ? false : "registry")}>{openContractDlg === "registry" ? "Fechar" : "Voltar"}</button>
              {openContractDlg === "edit" && <button className="btn btn-primary btn-xs" onClick={saveContract}><Save size={12} /> Salvar Contrato</button>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHANGE PASSWORD MODAL ═══ */}
      {(openPasswordDlg || forcePassMode) && (
        <div className="modal-overlay" onMouseDown={(e) => { if (!forcePassMode && e.target === e.currentTarget) setOpenPasswordDlg(false); }}>
          <div className="modal-content narrow">
            {!forcePassMode && <button className="modal-close" onClick={() => setOpenPasswordDlg(false)}><X size={12} /></button>}
            <div className="modal-header"><h2>{forcePassMode ? "Troca Obrigatória" : "Trocar Senha"}</h2><p>Conta: {currentUser}</p></div>
            <div className="modal-body">
              {!forcePassMode && <div className="fg"><label className="fl">Senha Atual</label><input className="fi" type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} /></div>}
              {forcePassMode && <p style={{ fontSize: 13, marginBottom: 16 }}><b>Atenção:</b> Esta é a sua primeira vez acessando o sistema. É obrigatório criar uma senha de uso exclusivamente pessoal para auditar suas futuras ações.</p>}
              <div className="fg"><label className="fl">Nova Senha</label><input className="fi" type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} /></div>
              <div className="fg"><label className="fl">Confirmar Nova Senha</label><input className="fi" type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} /></div>
            </div>
            <div className="modal-footer">
              {!forcePassMode && <button className="btn btn-outline btn-xs" onClick={() => setOpenPasswordDlg(false)}>Cancelar</button>}
              {forcePassMode && <button className="btn btn-outline btn-xs" onClick={() => { setOpenPasswordDlg(false); setForcePassMode(false); setCurrentUser(""); setCurrentUserRole(""); }}>Sair do Sistema</button>}
              <button className="btn btn-primary btn-xs" onClick={handleChangePassword}>Salvar Definitiva</button>
            </div>
          </div>
        </div>
      )}
      <footer className="app-footer">
        Desenvolvido por <span>&nbsp;Fábio Bühler</span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
