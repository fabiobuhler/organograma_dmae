import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  FolderTree, Search, KeyRound, Download, Upload,
  Pencil, Trash2, Users, Building2, ClipboardList, Briefcase,
  Home, Plus, Save, Mail, Phone, Car, Wrench, X, Menu, LogOut,
  ImagePlus, Image, List, Network, MapPin, ChevronsDown, Undo2, FileText, Printer, PieChart, Package, ArrowUp,
  AlertTriangle, History, ChevronLeft, Eye, Settings, Siren, ShieldCheck
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { OrgBranch } from "./components/OrgNode";
import PersonForm from "./components/people/PersonForm";
import PersonDetail from "./components/people/PersonDetail";
import ContractDetail from "./components/contracts/ContractDetail";
import AssetDetail from "./components/assets/AssetDetail";
import { seedNodes, seedAssets, seedPersons, seedContracts, seedAssetTypes } from "./data/seedData";
import {
  makeId, initials, sortNodes, downloadFile,
  getDescendantIds, getParentChain, fileToBase64,
  normalizeHex, DEFAULT_ROOT_COLOR, computeNodeColor
} from "./utils/helpers";
import { maskPhone } from "./utils/phone";
import WhatsAppButton from "./components/common/WhatsAppButton";
import WhatsAppQrButton from "./components/common/WhatsAppQrButton";
import { supabase } from "./lib/supabase";
import SystemAlertModal from "./components/common/SystemAlertModal";
import ConfirmDialog from "./components/common/ConfirmDialog";
import { getContractStatus, getDashboardStats, cleanRole, cleanRoleArray } from "./utils/contractUtils";
import NodeSelector from "./components/selectors/NodeSelector";
import PersonSelector from "./components/selectors/PersonSelector";
import ListNode from "./components/org/ListNode";
import AssetTypesModal from "./components/assets/AssetTypesModal";
import AssetContactActions from "./components/assets/AssetContactActions";
import AssetBadges from "./components/assets/AssetBadges";
import LogsModal from "./components/admin/LogsModal";
import StatsModal from "./components/admin/StatsModal";
import NodeForm from "./components/org/NodeForm";
import AssetForm from "./components/assets/AssetForm";
import ContractForm from "./components/contracts/ContractForm";
import DashboardCard from "./components/dashboard/DashboardCard";
import DonutChart from "./components/dashboard/DonutChart";
import DashboardAssetTable from "./components/dashboard/DashboardAssetTable";
import { maskCnpj, isValidCnpj, getCnpjValidationMessage } from "./utils/cnpj";
import {
  getPersonsInScope,
  getAssetsInScope,
  getContractsInScope,
  getStructuresInScope,
  getAssetEmergencyStats
} from "./utils/dashboardMetrics";
import {
  fetchNodes,
  fetchPersons,
  fetchAssets,
  fetchContracts,
  fetchUsers,
  fetchAssetTypes,
  fetchAuditLogs
} from "./services/supabaseReadService";
import {
  upsertPerson,
  deletePersonById,
  upsertNode,
  deleteNodeById,
  upsertAsset,
  deleteAssetById,
  upsertContract,
  deleteContractById,
  upsertAssetType,
  deleteAssetTypeById,
  upsertUser,
  deleteUserById,
  deleteUserByUsername
} from "./services/supabaseWriteService";
import { writeAuditLog } from "./services/auditService";
import { 
  exportAuditLogsCsv, 
  exportAuditLogsPdf, 
  generateDirectLogsPdf,
  exportAssetsCsv,
  exportAssetsPdf,
  exportContractsCsv as exportContractsCsvFile,
  exportContractsPdf as exportContractsPdfFile,
  exportContractDetailCsv as exportContractDetailCsvFile,
  exportContractDetailPdf as exportContractDetailPdfFile
} from "./services/exportService";

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
  contatoEmpresa: "",
  responsavelDireto: "",

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

/* --- PDF/Print export --- */

function exportLogsPdf(logsList) {
  const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
  const normalizedLogs = (logsList || []).map(normalizeAuditLog);
  
  try {
    exportAuditLogsPdf(normalizedLogs, {
      logoUrl,
      title: "Auditoria de Sistema",
      subtitle: "Log de eventos e operações"
    });
  } catch (err) {
    alert(err.message);
  }
}


function generateDirectPdf(logsList) {
  const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
  const normalizedLogs = (logsList || []).map(normalizeAuditLog);

  generateDirectLogsPdf(normalizedLogs, {
    logoUrl,
    title: "Registro de Auditoria de Sistema",
    subtitle: "Log de eventos e operações",
    filename: 'auditoria-logs.pdf'
  });
}

function getLogTarget(log) {
  if (!log) return "—";

  const details = log.details && typeof log.details === "object" ? log.details : {};

  const candidates = [
    log.target,
    log.entity_name,
    log.entityName,
    details.target,
    details.name,
    details.nome,
    details.entity_name,
    details.entityName,
    details.message,
    log.entity_type,
    log.entityType
  ];

  const found = candidates.find((value) => {
    if (value === undefined || value === null) return false;
    const text = String(value).trim();
    return text && text !== "undefined" && text !== "undefined: undefined" && text !== "null";
  });

  return found ? String(found).trim() : "—";
}

function getLogEntityType(log) {
  if (!log) return "";

  const details = log.details && typeof log.details === "object" ? log.details : {};

  const candidates = [
    log.entityType,
    details.entityType,
    details.entity_type
  ];

  const found = candidates.find((value) => {
    if (value === undefined || value === null) return false;
    const text = String(value).trim();
    return text && text !== "undefined" && text !== "null";
  });

  return found ? String(found).trim() : "";
}

function normalizeAuditLog(log) {
  const target = getLogTarget(log);
  const entityType = getLogEntityType(log);

  return {
    ...log,
    timestamp: log.timestamp || new Date(log.created_at || log.createdAt || Date.now()).toLocaleString("pt-BR"),
    user: log.user || log.user_name || log.userName || "—",
    action: log.action || "—",
    target,
    entityType
  };
}

function exportLogsCsv(logsList) {
  const normalizedLogs = (logsList || []).map(normalizeAuditLog);
  exportAuditLogsCsv(normalizedLogs, {
    filename: `auditoria-logs.csv`
  });
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


/* ================= APP ================= */
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
  const [personReturnTarget, setPersonReturnTarget] = useState(null); // null | "registry"
  const [registryFilter, setRegistryFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [openContractDlg, setOpenContractDlg] = useState(false);
  const [contractReturnTarget, setContractReturnTarget] = useState(null); // null | "registry"
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

  const loadCloudData = useCallback(async () => {
    if (!supabase) { setCloudStatus("offline"); setIsLoadingCloud(false); return; }
    try {
      setCloudStatus("checking");
      const [nData, pData, aData, cData, uData, tData] = await Promise.all([
        fetchNodes(supabase),
        fetchPersons(supabase),
        fetchAssets(supabase),
        fetchContracts(supabase),
        fetchUsers(supabase),
        fetchAssetTypes(supabase)
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
            contatoEmpresa: a.contato_empresa || a.contatoEmpresa || "",
            responsavelDireto: a.responsavel_direto || a.responsavelDireto || "",

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
  const [assetRegSort, setAssetRegSort] = useState({ key: "name", direction: "asc" });
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

  const logAction = useCallback(async (action, type, name, details = {}) => {
    if (!supabase || !currentUser) return;
    try {
      await writeAuditLog(supabase, {
        userName: currentUser.username || currentUser.name || "Sistema",
        action,
        entityType: type,
        entityName: name,
        details
      });
    } catch (e) { 
      console.warn("Falha ao registrar auditoria:", e); 
    }
  }, [supabase, currentUser]);

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
  const [centeredNodeId, setCenteredNodeId] = useState(null);

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
    }).map(normalizeAuditLog);
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

  // Auto-center on focus change
  // --- AUTO-CENTER EFFECTS ---
  useEffect(() => {
    if (viewMode !== "tree" || !selectedId) return;
    centerNodeInView(selectedId, { behavior: "smooth", attempts: 4, delay: 100 });
  }, [selectedId, viewMode]);

  useEffect(() => {
    if (viewMode !== "tree" || !focusId) return;
    // Quando o foco muda, centralizamos o novo nó raiz do foco
    centerNodeInView(focusId, { behavior: "smooth", attempts: 5, delay: 150 });
  }, [focusId, viewMode]);

  /**
   * Centraliza um nó no viewport do organograma de forma robusta.
   * Unifica cálculos de zoom, pan e tentativas de renderização.
   */
  const centerNodeInView = useCallback((nodeId, options = {}) => {
    if (!nodeId || viewMode !== "tree") return;

    const {
      behavior = "smooth",
      attempts = 3,
      delay = 80
    } = options;

    // Registra como último nó centralizado para preservação no zoom
    setCenteredNodeId(nodeId);

    const run = (remainingAttempts) => {
      const vp = vpRef.current;
      if (!vp) return;

      // Seletor exato: .org-card que contém o data-node-id
      const safeId = String(nodeId).replace(/"/g, '\\"');
      const el = vp.querySelector(`.org-card[data-node-id="${safeId}"]`);

      if (!el) {
        if (remainingAttempts > 0) {
          setTimeout(() => run(remainingAttempts - 1), delay);
        }
        return;
      }

      const vpRect = vp.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Centro exato da viewport (visual)
      const viewportCenterX = vpRect.left + vpRect.width / 2;
      const viewportCenterY = vpRect.top + vpRect.height / 2;

      // Centro exato do nó (visual, já escalado pelo transform)
      const nodeCenterX = elRect.left + elRect.width / 2;
      const nodeCenterY = elRect.top + elRect.height / 2;

      // Diferença visual em pixels de tela
      const deltaX = nodeCenterX - viewportCenterX;
      const deltaY = nodeCenterY - viewportCenterY;

      const currentZoom = zoom || 1;

      // Ajusta o scroll: somamos o deslocamento visual dividido pelo zoom
      // porque scrollLeft/Top operam no espaço de layout (não escalado).
      vp.scrollTo({
        left: Math.max(0, vp.scrollLeft + deltaX / currentZoom),
        top: Math.max(0, vp.scrollTop + deltaY / currentZoom),
        behavior
      });
    };

    requestAnimationFrame(() => run(attempts));
  }, [viewMode, zoom]);

  const zoomAndKeepCenter = useCallback((nextZoom) => {
    const targetNodeId = centeredNodeId || selectedId || focusId;
    setZoom(nextZoom);

    if (targetNodeId) {
      // Pequeno delay para o transform: scale ser aplicado antes do recalcular
      setTimeout(() => {
        centerNodeInView(targetNodeId, {
          behavior: "auto", // Movimento instantâneo durante zoom para evitar lag visual
          attempts: 5,
          delay: 50
        });
      }, 150);
    }
  }, [centeredNodeId, selectedId, focusId, centerNodeInView]);

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


  // Select node 
  const selectNode = useCallback((id) => {
    setSelectedId(id);
    centerNodeInView(id, { behavior: "smooth", attempts: 4, delay: 100 });
    setShowDetail(true);
  }, [centerNodeInView]);



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
      await upsertNode(supabase, n);

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
        logAction("Editar Caixa", "NODE", n.name);
        showSystemAlert("Caixa atualizada com sucesso!", { title: "Concluído", type: "success" });
      } else {
        setSelectedId(n.id);
        setFocusId(n.parentId || n.id);
        logAction("Criar Caixa", "NODE", n.name);
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
    
    logAction("Excluir Caixa", "NODE", nodeName);
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
      try {
        if (supabase) {
          const saved = await upsertAssetType(supabase, {
            ...payload,
            ...(editAssetTypeId && assetTypeForm.id ? { id: assetTypeForm.id } : {})
          });
          savedPayload = saved || savedPayload;
        }
      } catch (err) {
        throw err;
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
      logAction(editAssetTypeId ? "Editar Tipo de Ativo" : "Criar Tipo de Ativo", "ASSET_TYPE", `${category} / ${name}`);
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
            await deleteAssetTypeById(supabase, item.id);
          }
          setAssetTypes((current) => current.filter((typeItem) => (typeItem.id || typeItem._localId || `${typeItem.category}-${typeItem.name}`) !== typeId));
          if (editAssetTypeId === typeId) resetAssetTypeForm();
          logAction("Excluir Tipo de Ativo", "ASSET_TYPE", `${item.category} / ${item.name}`);
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
      contato_empresa: normalizedAsset.contatoEmpresa || "",
      responsavel_direto: normalizedAsset.responsavelDireto || "",
      fiscal_contrato: normalizedAsset.fiscalContrato || "",
      matricula_fiscal: normalizedAsset.matriculaFiscal || "",
      photos: normalizedAsset.photos || []
    };

    try {
      await upsertAsset(supabase, assetToDb);
    } catch (error) {
      console.error("Erro ao salvar ativo:", error, assetToDb);
      showSystemAlert(`O ativo não pôde ser salvo.\n\nDetalhe técnico: ${error.message}`, { title: "Erro ao salvar ativo", type: "error" });
      return;
    }
    
    setAssets((current) =>
      editAssetId
        ? current.map((item) => item.id === editAssetId ? normalizedAsset : item)
        : [...current, normalizedAsset]
    );
    logAction(editAssetId ? "Editar Ativo" : "Criar Ativo", "ASSET", normalizedAsset.name);
    setOpenAssetDlg(false); setEditAssetId(null); setAssetForm(emptyAsset);
    showSystemAlert("Ativo salvo com sucesso.", { title: "Ativo salvo", type: "success" });
  }, [assetForm, editAssetId, logAction, supabase]);

  const deleteAsset = useCallback(async (id, name) => {
    try {
      await deleteAssetById(supabase, id);
      console.log("Asset deleted");
    } catch (err) {
      console.error("Error deleting asset:", err);
      flash("Erro ao excluir ativo da nuvem.");
    }
    setAssets((c) => c.filter((a) => a.id !== id));
    logAction("Excluir Ativo", "ASSET", name || id);
    flash("Ativo excluído");
  }, [logAction]);

  const requestDeleteAsset = useCallback((asset) => {
    if (!asset) return;
    setConfirmDialog({
      open: true,
      title: "Excluir Ativo",
      message: `Confirma a exclusão do ativo "${asset.name}"? Esta ação não poderá ser desfeita.`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      type: "danger",
      onConfirm: () => {
        deleteAsset(asset.id, asset.name);
        setConfirmDialog(null);
        setViewAssetId(null);
      }
    });
  }, [deleteAsset]);

  // Person CRUD
  const openPersonEdit = useCallback((person, options = {}) => {
    if (!person) return;
    const fromRegistry = options.fromRegistry || personReturnTarget === "registry";
    
    setPersonForm({
      id: person.id || "",
      name: person.name || "",
      matricula: person.matricula || "",
      cargo: person.cargo || "",
      email: person.email || "@dmae.prefpoa.com.br",
      telefone: maskPhone(person.telefone || ""),
      ramal: person.ramal || "",
      regime: person.regime || "",
      vinculo: person.vinculo || "",
      foto: person.foto || "",
      lotacao: person.lotacao || ""
    });

    setEditPersonId(person.id);
    setShowPersonDetail(null);
    
    if (fromRegistry) {
      setPersonReturnTarget("registry");
    } else {
      setPersonReturnTarget(null);
    }
    
    setOpenPersonDlg("edit");
  }, [maskPhone, personReturnTarget]);

  const openPersonCreate = useCallback((options = {}) => {
    const fromRegistry = options.fromRegistry || false;
    setEditPersonId(null);
    setPersonForm({
      ...emptyPerson,
      email: "@dmae.prefpoa.com.br"
    });
    if (fromRegistry) {
      setPersonReturnTarget("registry");
    } else {
      setPersonReturnTarget(null);
    }
    setShowPersonDetail(null);
    setOpenPersonDlg("edit");
    setTimeout(() => {
      const el = document.getElementById("person-email-input");
      if (el) {
        el.focus();
        el.setSelectionRange(0, 0);
      }
    }, 100);
  }, [emptyPerson]);

  const closePersonDetail = useCallback(() => {
    setShowPersonDetail(null);
    if (personReturnTarget === "registry") {
      setOpenPersonDlg("registry");
      return;
    }
    setPersonReturnTarget(null);
  }, [personReturnTarget]);

  const closePersonRegistry = useCallback(() => {
    setShowPersonDetail(null);
    setEditPersonId(null);
    setPersonReturnTarget(null);
    setOpenPersonDlg(false);
  }, []);

  const backToPersonRegistry = useCallback(() => {
    setShowPersonDetail(null);
    setEditPersonId(null);
    setPersonReturnTarget("registry");
    setOpenPersonDlg("registry");
  }, []);

  const cancelPersonEdit = useCallback(() => {
    setEditPersonId(null);
    if (personReturnTarget === "registry") {
      setOpenPersonDlg("registry");
      return;
    }
    setOpenPersonDlg(false);
    setPersonReturnTarget(null);
  }, [personReturnTarget]);

  const closePersonForm = useCallback(() => {
    if (personReturnTarget === "registry") {
      setOpenPersonDlg("registry");
    } else {
      setOpenPersonDlg(false);
      setPersonReturnTarget(null);
    }
    setEditPersonId(null);
  }, [personReturnTarget]);
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
    
    (async () => {
      try {
        await upsertPerson(supabase, p);
        console.log("Person synced");
      } catch (err) {
        console.error("Person sync error:", err);
        flash("Erro ao sincronizar com nuvem.");
      }
    })();

    setPersons(editPersonId ? (c) => c.map((x) => x.id === editPersonId ? p : x) : (c) => [...c, p]);
    logAction(editPersonId ? "Editar Pessoa" : "Criar Pessoa", "PERSON", p.name);
    
    if (personReturnTarget === "registry") {
      setOpenPersonDlg("registry");
      setEditPersonId(null);
      setShowPersonDetail(null);
    } else {
      setOpenPersonDlg(false);
      setPersonReturnTarget(null);
    }
    
    showSystemAlert(editPersonId ? "Pessoa atualizada!" : "Pessoa cadastrada!", { title: "Pessoa salva", type: "success" });
    // If we were in the middle of assigning this person to a node, restore the node dialog
    if (pendingPersonNodeForm) {
      setNodeForm(prev => ({ ...pendingPersonNodeForm, personId: p.id, responsavel: p.name, matricula: p.matricula, cargo: p.cargo }));
      setPendingPersonNodeForm(null);
      setTimeout(() => setOpenNodeDlg(true), 100);
    }
  }, [personForm, editPersonId, logAction, pendingPersonNodeForm, personReturnTarget, showSystemAlert, supabase, flash]);
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
        await deleteNodeById(supabase, id);
        setNodes((c) => c.filter((x) => x.id !== id));
        if (selectedId === id) { setSelectedId(nodeRecord.parentId); setFocusId(nodeRecord.parentId); setShowDetail(false); }
        if (editNodeId === id) { setOpenNodeDlg(false); setEditNodeId(null); }
        logAction("Excluir Caixa", "NODE", nodeRecord.name || id);
        flash("Excluída");
      } catch (err) {
        console.error("Delete node error:", err);
        flash("Erro ao excluir. Verifique permissões.");
      }
    } else if (type === "person") {
      try {
        await deletePersonById(supabase, id);
        setPersons((c) => c.filter((p) => p.id !== id));
        logAction("Excluir Pessoa", "PERSON", name || id);
        showSystemAlert("Pessoa excluída com sucesso.", { title: "Concluído", type: "success" });
      } catch (err) {
        console.error("Delete person error:", err);
        flash("Erro ao excluir pessoa.");
      }
    }
    setDeleteRequest(null);
  }, [deleteRequest, nodeMap, nodes, assets, supabase, selectedId, editNodeId, logAction, flash]);

  // Contract CRUD
  const closeContractRegistry = useCallback(() => {
    setShowContractDetail(null);
    setEditContractId(null);
    setContractReturnTarget(null);
    setOpenContractDlg(false);
  }, []);

  const backToContractRegistry = useCallback(() => {
    setShowContractDetail(null);
    setEditContractId(null);
    setContractReturnTarget("registry");
    setOpenContractDlg("registry");
  }, []);

  const cancelContractEdit = useCallback(() => {
    setEditContractId(null);
    if (contractReturnTarget === "registry") {
      setOpenContractDlg("registry");
      return;
    }
    setOpenContractDlg(false);
    setContractReturnTarget(null);
  }, [contractReturnTarget]);

  const openContractCreate = useCallback((options = {}) => {
    const fromRegistry = options.fromRegistry || false;
    setEditContractId(null);
    setContractForm({ ...emptyContract });
    if (fromRegistry) {
      setContractReturnTarget("registry");
    } else {
      setContractReturnTarget(null);
    }
    setShowContractDetail(null);
    setOpenContractDlg("edit");
  }, []);

  const openContractEdit = useCallback((contract, options = {}) => {
    if (!contract) return;
    const fromRegistry = options.fromRegistry || contractReturnTarget === "registry";
    setContractForm({
      ...emptyContract,
      ...contract,
      nodeId: contract.nodeId || contract.node_id || "",
      dataInicio: contract.dataInicio || contract.data_inicio || "",
      dataTermino: contract.dataTermino || contract.data_fim || "",
      valorTotal: contract.valorTotal ?? contract.valor_total ?? "",
      empresa: contract.empresa || "",
      cnpj: maskCnpj(contract.cnpj || ""),
      contato: contract.contato || "",
      itens: contract.itens || "",
      gestor: contract.gestor || { titularId: "", suplenteId: "" },
      fiscaisContrato: contract.fiscaisContrato || contract.fiscais_contrato || [{ titularId: "", suplenteId: "" }],
      fiscaisServico: contract.fiscaisServico || contract.fiscais_servico || [{ titularId: "", suplenteId: "" }],
      fiscaisAdministrativos: contract.fiscaisAdministrativos || contract.fiscais_administrativos || [],
      aditivos: contract.aditivos || []
    });
    setEditContractId(contract.id);
    setShowContractDetail(null);
    if (fromRegistry) {
      setContractReturnTarget("registry");
    } else {
      setContractReturnTarget(null);
    }
    setOpenContractDlg("edit");
  }, [contractReturnTarget]);

  const saveContract = useCallback(async () => {
    if (contractForm.cnpj && !isValidCnpj(contractForm.cnpj)) {
      showSystemAlert("O CNPJ informado é inválido. Verifique o número e tente novamente.", {
        title: "CNPJ inválido",
        type: "warning"
      });
      return;
    }

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

      try {
        await upsertContract(supabase, contractToDb);
      } catch (error) {
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

    logAction(editContractId ? "Editar Contrato" : "Criar Contrato", "CONTRACT", normalizedContract.sei);
    
    if (contractReturnTarget === "registry") {
      setOpenContractDlg("registry");
      setEditContractId(null);
      setContractForm(emptyContract);
    } else {
      setOpenContractDlg(false);
      setEditContractId(null);
      setContractForm(emptyContract);
      setContractReturnTarget(null);
    }
    
    showSystemAlert("Contrato salvo com sucesso.", { title: "Contrato salvo", type: "success" });
  }, [contractForm, editContractId, contractReturnTarget, logAction]);

  const deleteContract = useCallback(async (id, sei) => {
    try {
      await deleteContractById(supabase, id);
      console.log("Contract removed from cloud");
    } catch (err) {
      console.error("Error deleting contract:", err);
      flash("Erro ao excluir contrato da nuvem.");
    }
    setContracts((prev) => prev.filter((c) => c.id !== id));
    logAction("Excluir Contrato", "CONTRACT", sei || id);
    showSystemAlert("Contrato excluído com sucesso.", { title: "Concluído", type: "success" });
  }, [logAction]);

  const requestDeleteContract = useCallback((contract) => {
    if (!contract) return;
    setConfirmDialog({
      open: true,
      title: "Excluir contrato",
      message: `Confirma a exclusão do contrato SEI ${contract.sei}? Esta ação removerá o vínculo de todos os ativos e fiscais associados e não poderá ser desfeita.`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      type: "danger",
      onConfirm: () => {
        deleteContract(contract.id, contract.sei);
        setConfirmDialog(null);
      }
    });
  }, [deleteContract]);

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
      await deleteNodeById(supabase, targetId);
      setNodes((c) => c.filter((x) => x.id !== targetId));
      if (selectedId === targetId) { setSelectedId(nodeRecord.parentId); setFocusId(nodeRecord.parentId); setShowDetail(false); }
      if (editNodeId === targetId) { setOpenNodeDlg(false); setEditNodeId(null); }
      logAction("Excluir Caixa", "NODE", nodeRecord.name || targetId);
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
        logAction("Importar Pessoas", "IMPORT", `${newP.length} servidores importados.`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [flash, logAction]);

  // Export / Import
  const exportContractDetailPdf = useCallback((c) => {
    if (!c) return;
    try {
      exportContractDetailPdfFile(c, {
        nodes,
        personMap,
        logoUrl: window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png",
        getContractStatus
      });
      flash("PDF Gerado!");
    } catch (e) {
      console.error(e);
      window.alert("Não foi possível gerar o PDF do contrato.");
    }
  }, [nodes, personMap, flash]);

  const exportContractDetailCsv = useCallback((c) => {
    if (!c) return;
    try {
      exportContractDetailCsvFile(c, {
        nodes,
        personMap,
        getContractStatus
      });
      flash("CSV Gerado!");
    } catch (e) {
      console.error(e);
      window.alert("Não foi possível gerar o CSV do contrato.");
    }
  }, [nodes, personMap, flash]);

  const exportContractsCsv = useCallback((contractsList) => {
    try {
      exportContractsCsvFile(contractsList, {
        filename: "contratos-export.csv",
        nodes,
        personMap,
        getContractStatus
      });
      flash("CSV Gerado!");
    } catch (e) {
      console.error(e);
      window.alert("Não foi possível gerar o CSV de contratos.");
    }
  }, [nodes, personMap, flash]);

  const exportContractsPdf = useCallback((contractsList) => {
    try {
      exportContractsPdfFile(contractsList, {
        title: "Relatório de Contratos",
        subtitle: "Lista de Contratos Cadastrados",
        logoUrl: window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png",
        nodes,
        personMap,
        getContractStatus
      });
      flash("PDF Gerado!");
    } catch (e) {
      console.error(e);
      window.alert("Não foi possível gerar o PDF de contratos.");
    }
  }, [nodes, personMap, flash]);

  const expJson = useCallback(() => { downloadFile("organograma-dmae.json", JSON.stringify({ nodes, assets }, null, 2)); flash("JSON exportado!"); }, [nodes, assets]);
  const expCsv = useCallback((nid) => {
    const sc = new Set(descendantIds(nid));
    const list = assets.filter((a) => sc.has(a.nodeId));
    exportAssetsCsv(list, { 
      filename: `ativos-${(nodeMap.get(nid)?.name || "").toLowerCase()}.csv`,
      nodes 
    });
    flash("CSV exportado!");
  }, [assets, descendantIds, nodeMap, nodes, flash]);
  const expPdf = useCallback((nid) => {
    const sc = new Set(descendantIds(nid));
    const list = assets.filter((a) => sc.has(a.nodeId));
    const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
    exportAssetsPdf(list, { 
      label: nodeMap.get(nid)?.name || "", 
      nodes, 
      logoUrl 
    });
  }, [assets, descendantIds, nodeMap, nodePath]);
  const handleImport = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const p = JSON.parse(String(r.result)); if (!Array.isArray(p?.nodes) || !p.nodes.length) throw 0; setNodes(p.nodes); setAssets(Array.isArray(p.assets) ? p.assets : []); setSelectedId(null); setFocusId(null); logAction("Importar Base JSON", "IMPORT", "Substituição completa"); showSystemAlert("Importado com sucesso!", { title: "Concluído", type: "success" }); } catch { showSystemAlert("Arquivo inválido.", { title: "Erro na importação", type: "error" }); } };
    r.readAsText(f); e.target.value = "";
  }, [logAction]);

  // Login & Admin
  const doLogin = useCallback(async () => {
    setLoginErr("");
    
    // 1. Try regular admin/editor users from Supabase first
    try {
      const latestUsers = await fetchUsers(supabase);
      if (latestUsers) {
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

    const u = users.find(x => x.username === currentUser?.username);
    if (!u) return;
    if (u.password !== pwdCurrent && !forcePassMode) {
      showSystemAlert("Senha atual incorreta.", { title: "Erro de autenticação", type: "error" });
      return;
    }

    setUsers(prev => prev.map(x => x.username === currentUser?.username ? { ...x, password: pwdNew, firstLogin: false } : x));
    setOpenPasswordDlg(false);
    setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    showSystemAlert("Senha alterada com sucesso!", { title: "Senha alterada", type: "success" });
    logAction("Trocar Senha", "AUTH", currentUser?.username || "Usuário");

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
          if (uid) {
            await upsertUser(supabase, { id: uid, password: pwdNew, must_change_password: false });
          } else {
            await supabase.from('users').update({ password: pwdNew, must_change_password: false }).eq('username', uname);
          }
          
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
      const data = await upsertUser(supabase, { 
        username: newUser, 
        password: newPass, 
        role: newIsAdmin ? 'admin' : 'editor',
        must_change_password: true
      });

      setUsers(prev => [...prev, data]);
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
        try {
          if (userId) {
            await deleteUserById(supabase, userId);
          } else {
            await deleteUserByUsername(supabase, username);
          }
        } catch (error) {
          console.error("Delete error:", error);
          // Re-fetch users if cloud delete fails to restore UI state
          try {
            const latest = await fetchUsers(supabase);
            if (latest) setUsers(latest);
          } catch (fetchErr) {
            console.error("Erro ao restaurar lista de usuários:", fetchErr);
          }
          throw error;
        }
      }
      
      logAction("Excluir Usuário", "USER", username);
      showSystemAlert("Usuário removido com sucesso.", { title: "Concluído", type: "success" });
    } catch (err) {
      showSystemAlert("Erro crítico ao excluir usuário: " + err.message, { title: "Erro crítico", type: "error" });
    }
  }, [currentUser, logAction, supabase]);

  const handleResetPass = async (username) => {
    const newRaw = "dmae123";
    try {
      if (supabase) {
        // Como o handleResetPass original não tinha ID, usamos username
        await supabase.from('users').update({ 
          password: newRaw,
          must_change_password: true 
        }).eq('username', username);
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
    setSelectedId(nodeId);
    // Aguarda a expansão do componente e centraliza o nó clicado
    setTimeout(() => {
      centerNodeInView(nodeId, { behavior: "smooth", attempts: 5, delay: 120 });
    }, 80);
  }, [centerNodeInView]);

  const handleReturnFromFocus = useCallback(() => {
    setFocusId(null);
  }, []);

  const handleExpandAllBelow = useCallback((nodeId) => {
    const ids = new Set(getDescendantIds(nodeId, getChildren));
    setExpandedSet(ids);
    setSelectedId(nodeId);
    // Centralização com mais tentativas para lidar com múltiplos níveis abrindo
    setTimeout(() => {
      centerNodeInView(nodeId, { behavior: "smooth", attempts: 8, delay: 150 });
    }, 100);
  }, [getChildren, centerNodeInView]);

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
              <img src={dmaeNode?.foto || (window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png")} alt="DMAE" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
                          try {
                            const data = await fetchAuditLogs(supabase);
                            if (data) {
                              setLogs((data || []).map((l) => normalizeAuditLog({
                                id: l.id,
                                created_at: l.created_at,
                                timestamp: new Date(l.created_at).toLocaleString('pt-BR'),
                                user_name: l.user_name,
                                user: l.user_name,
                                action: l.action,
                                entity_type: l.entity_type,
                                entity_name: l.entity_name,
                                details: l.details || {}
                              })));
                            }
                          } catch (err) {
                            console.error("Erro ao buscar logs:", err);
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
                    onClick={() => { 
                      const pid = focused.parentId;
                      setFocusId(pid); 
                      setSelectedId(pid);
                      setTimeout(() => centerNodeInView(pid, { behavior: "smooth", attempts: 5 }), 100);
                    }}
                    style={{ marginLeft: 8, padding: "3px 10px", fontSize: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    <ArrowUp size={10} /> {"Subir Nível"}
                  </button>
                )}

                <button className="btn btn-outline btn-xs" onClick={() => {
                    handleReturnFromFocus();
                    if (rootNode) {
                      setSelectedId(rootNode.id);
                      setTimeout(() => centerNodeInView(rootNode.id, { behavior: "smooth", attempts: 5 }), 120);
                    }
                  }}
                  style={{ marginLeft: 4, padding: "3px 10px", fontSize: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Undo2 size={10} /> Sair do Foco
                </button>
              </div>
            )}
            <div className="zoom-ctrls" style={{ position: "fixed", bottom: 80, left: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 50 }}>
              <button className="btn btn-outline" title="Aumentar zoom" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => zoomAndKeepCenter(Math.min(2, zoom + 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>+</span></button>
              <button className="btn btn-outline" title="Zoom 100%" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => zoomAndKeepCenter(1)}><span style={{ fontSize: 12, fontWeight: "bold" }}>{Math.round(zoom * 100)}%</span></button>
              <button className="btn btn-outline" title="Diminuir zoom" style={{ background: "#fff", width: 36, height: 36, padding: 0, justifyContent: "center" }} onClick={() => zoomAndKeepCenter(Math.max(0.3, zoom - 0.1))}><span style={{ fontSize: 18, fontWeight: "bold" }}>-</span></button>
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

      {/* ─── FLOATING EDIT BUTTON ─── */}
      <button className={`fab-edit ${canEdit ? "active" : ""}`}
        onClick={() => canEdit ? setCanEdit(false) : setOpenLoginDlg(true)}
        title={canEdit ? "Sair da edição e salvar" : "Entrar na edição"}>
        {canEdit ? <Save size={22} /> : <KeyRound size={22} />}
      </button>

      {/* ─── DETAIL MODAL (shows when clicking a card) ─── */}
      {showDetail && selected && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDetail(false); }}>
          <div className="modal-content wide" style={{ display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
            <div className="modal-header-fixed">
              <button className="detail-close" onClick={() => setShowDetail(false)} style={{ top: 20, right: 20 }}><X size={14} /></button>
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
                    <button className="btn btn-outline btn-xs" onClick={() => { setDashboardNodeId(selected.id); setDashboardView("summary"); setShowDetail(false); }} title="Painel de Contratos">
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
                          <button className="btn btn-outline btn-xs" onClick={() => {
                            const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
                            exportAssetsPdf(scopeAssets, { label: selected.name, nodes, logoUrl, nodeMap });
                          }} title="Gerar relatório de ativos em PDF"><Printer size={12} /> PDF</button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="modal-scroll-body">
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
                          <span style={{ fontSize: 11 }}>{full}</span>
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
                            <>
                              <WhatsAppButton phone={showPhone} label="" />
                              <WhatsAppQrButton 
                                phone={showPhone} 
                                responsible={selected.responsavel || respObj?.name} 
                                label="" 
                                title="QR Code WhatsApp" 
                              />
                            </>
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
                <div className="asset-scroll-list">
                  {directAssets.map((a) => (
                    <div key={a.id} className="asset-mini">
                      <div className="asset-mini-name">{assetIcon(a.category)} {a.name}</div>
                      {a.tipoVinculo === "Contratado" && a.empresaContratada && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", marginBottom: 4 }}>🏢 {a.empresaContratada}</div>
                      )}
                      <div className="asset-mini-meta">{[a.manufacturer, a.model, a.year].filter(Boolean).join(" \u2022 ")}</div>
                    <div className="asset-mini-badges" style={{ alignItems: "center" }}>
                      {a.plate && <span className="badge badge-out">Placa {a.plate}</span>}
                      {a.patrimonio && <span className="badge badge-out">Pat. {a.patrimonio}</span>}
                      <span className={`badge ${a.tipoVinculo === "Contratado" ? "badge-sec" : "badge-out"}`}>{a.tipoVinculo || "Próprio"}</span>
                      {a.isEmergency && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)", flexShrink: 0 }} title="Ativo de Contingência">
                          <Siren size={14} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
                        </div>
                      )}
                      {a.isMaintenance && (
                        <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", flexShrink: 0, color: "#d97706" }} title="Ativo em Manutenção/Inoperante">
                          <AlertTriangle size={14} strokeWidth={3} />
                        </div>
                      )}
                      {a.isEmergency && a.contatoAcionamento && (
                        <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                          <AssetContactActions phone={a.contatoAcionamento} responsible={a.contatoResponsavel} />
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                      <button className="btn btn-outline btn-xs" style={{ flex: 1, justifyContent: "center" }} onClick={() => setViewAssetId(a.id)}>
                        <Eye size={10} /> Detalhes
                      </button>
                      {a.tipoVinculo === "Contratado" && (
                        <button className="btn btn-outline btn-xs" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowAssetContractModal(a.id)}>
                          <FileText size={10} /> Contrato
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Contracts Section - HIDDEN IF NOT LOGGED IN */}
            {(isProtected || canEdit) && (
              <div className="asset-section">
                {selected.tipo === "estrutura" ? (
                  <>
                    <div className="asset-section-title"><ShieldCheck size={13} /> Contratos vinculados à Estrutura</div>
                    {(() => {
                      const sContracts = contracts.filter(c => c.nodeId === selected.id);
                      return sContracts.length > 0 ? sContracts.map((c) => (
                        <div key={c.id} className="asset-mini" style={{ background: "var(--n50)" }}>
                          <div className="asset-mini-name">{c.sei}</div>
                          <div className="asset-mini-meta" style={{ fontSize: 10 }}><b>Objeto:</b> {c.objeto}</div>
                        </div>
                      )) : <p style={{ fontSize: 11, color: "var(--n400)" }}>Nenhum contrato vinculado diretamente a esta estrutura.</p>;
                    })()}
                  </>
                ) : (
                  selected.personId && (
                    <>
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
                        )) : <p style={{ fontSize: 11, color: "var(--n400)" }}>Nenhum contrato vinculado ao responsável.</p>;
                      })()}
                    </>
                  )
                )}
              </div>
            )}
            </div>
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
        const { direct: dContracts, sub: sContracts } = getContractsInScope(contracts, dashboardNodeId, descIds);
        const { direct: dPersons, sub: sPersons } = getPersonsInScope(nodes, persons, dashboardNodeId, descIds);
        const { direct: dAssets, sub: sAssets } = getAssetsInScope(assets, dashboardNodeId, descIds);
        const { direct: dStructures, sub: sStructures } = getStructuresInScope(nodes, dashboardNodeId, descIds, getChildren);

        const dStats = getDashboardStats(dContracts);
        const cStats = getDashboardStats(sContracts);

        const { dEmergency, sEmergency, dEmergencyMaintenance, sEmergencyMaintenance } = getAssetEmergencyStats(dAssets, sAssets);

        const exportPDF = async () => {
          // If in a list view, use the professional tabular report format
          if (dashboardView !== "summary") {
            const listToExport = dashboardView === "allAssets" ? [...dAssets, ...sAssets] : 
                                 dashboardView === "emergencyAssets" ? [...dAssets.filter(a => a.isEmergency), ...sAssets.filter(a => a.isEmergency)] :
                                 [...dAssets, ...sAssets].filter(a => a.isEmergency && a.isMaintenance);
            
            const listTitle = dashboardView === "allAssets" ? "Inventário Geral de Ativos" : 
                              dashboardView === "emergencyAssets" ? "Inventário de Contingência" : 
                              "Ativos em Manutenção";
            
            const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
    exportAssetsPdf(listToExport, { 
      label: `${listTitle} - ${dNode.name}`, 
      nodes, 
      logoUrl 
    });
            return;
          }

          // For summary view, use the "Model" with logo but capturing the dashboard visuals
          const el = document.getElementById("bi-dashboard-content");
          if(!el) return;
          
          flash("Gerando Relatório Executivo...");
          const canvas = await html2canvas(el, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          
          const w = window.open("", "_blank");
          if (!w) return;

          const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
          
          w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Relatório BI - ${dNode.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; margin: 0; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .header img { height: 60px; object-fit: contain; }
    .header-titles { text-align: right; }
    .header-titles h2 { margin: 0; font-size: 22px; color: #0f172a; }
    .header-titles p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
    .content-img { width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { .no-print { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="DMAE" />
    <div class="header-titles">
      <h2>Relatório Executivo de Governança e BI</h2>
      <p>Unidade: <b>${dNode.name}</b></p>
      <p style="font-size: 11px;">Consolidado: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>
  </div>
  
  <img src="${imgData}" class="content-img" />

  <div class="footer">
    <div>Sistema de Gestão de Organograma e Ativos - DMAE</div>
    <div>Página 1 de 1</div>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 500);
    };
  </script>
</body>
</html>`);
          w.document.close();
        };

        const exportExcel = () => {
          let rows = [];
          let filename = `Dashboard_${dNode.name.replace(/\s/g,'_')}.csv`;

          if (dashboardView === "summary") {
            rows = [
              ["Métrica", "Total", "Direto", "Indireto"],
              ["Força de Trabalho", dPersons.length + sPersons.length, dPersons.length, sPersons.length],
              ["Patrimônio / Ativos", dAssets.length + sAssets.length, dAssets.length, sAssets.length],
              ["Ativos de Contingência", dEmergency + sEmergency, dEmergency, sEmergency],
              ["Contingência em Manutenção", (dEmergencyMaintenance + sEmergencyMaintenance), dEmergencyMaintenance, sEmergencyMaintenance],
              ["Subunidades", dStructures.length + sStructures.length, dStructures.length, sStructures.length]
            ];
          } else {
            // Asset List export
            const list = dashboardView === "allAssets" ? [...dAssets, ...sAssets] : 
                         dashboardView === "emergencyAssets" ? [...dAssets.filter(a => a.isEmergency), ...sAssets.filter(a => a.isEmergency)] :
                         [...dAssets, ...sAssets].filter(a => a.isEmergency && a.isMaintenance);
            
            rows = [
              ["Ativo", "Categoria", "Unidade", "Patrimônio/Placa", "Contingência", "Status", "Manutenção Desde"]
            ];
            list.forEach(a => {
              rows.push([
                a.name,
                a.category || "",
                nodeMap.get(a.nodeId)?.name || "",
                `${a.patrimonio || ""} ${a.plate || ""}`.trim(),
                a.isEmergency ? "Sim" : "Não",
                a.isMaintenance ? "Em Manutenção" : "Operacional",
                a.maintenanceSince ? new Date(a.maintenanceSince).toLocaleDateString('pt-BR') : ""
              ]);
            });
            filename = `Listagem_${dashboardView}_${dNode.name.replace(/\s/g,'_')}.csv`;
          }

          const csvContent = "\uFEFF" + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };


        const AssetTable = ({ list, title }) => (
          <DashboardAssetTable list={list} title={title} nodeMap={nodeMap} />
        );



        return (
          <div className="modal-overlay">
            <div className="modal-content wide bi-dash" id="bi-dashboard-content" style={{ maxWidth: 1000 }}>
              <button className="modal-close no-print" onClick={() => { setDashboardNodeId(null); setShowDetail(true); }}><X size={12} /></button>
              
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
                        {dashboardView === "emergencyMaintenanceAssets" ? "Ativos de Contingência Inoperantes" : 
                         dashboardView === "allAssets" ? "Inventário Geral de Ativos" :
                         dashboardView === "emergencyAssets" ? "Inventário de Contingência" :
                         "Dashboard de Governança e BI"}
                      </h2>
                      <p style={{margin:0, opacity:0.8, fontSize: 13}}>Unidade: <b>{dNode.name}</b> {descIds.length > 0 && `(+ ${descIds.length} subunidades)`}</p>
                   </div>
                </div>
                <div className="bi-header-actions no-print" style={{ display: "flex", gap: 6 }}>
                   <button className="btn btn-outline btn-xs" onClick={exportExcel}><FileText size={14} /> Exportar Excel</button>
                   <button className="btn btn-primary btn-xs" onClick={exportPDF}><Download size={14} /> Exportar PDF</button>
                </div>
              </div>

              <div className="modal-body bi-body">
                {dashboardView === "summary" && (
                  <>
                    {/* TOP METRIC CARDS */}
                     <div className="bi-grid-cards" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                        <DashboardCard icon={Users} iconBg="#dbeafe" iconColor="#2563eb" className="people"
                          label="Força de Trabalho" value={dPersons.length + sPersons.length}
                          subtitle={`Direto: ${dPersons.length} | Indireto: ${sPersons.length}`} />
                        <DashboardCard icon={Package} iconBg="#fef3c7" iconColor="#d97706" className="assets"
                          label="Patrimônio / Ativos" value={dAssets.length + sAssets.length}
                          subtitle={`Direto: ${dAssets.length} | Indireto: ${sAssets.length}`}
                          onClick={() => setDashboardView("allAssets")} />
                        <DashboardCard icon={Siren} iconBg="#fee2e2" iconColor="#ef4444" className="emergency"
                          label="Ativos de Contingência" value={dEmergency + sEmergency}
                          valueColor={dEmergency + sEmergency > 0 ? "#ef4444" : undefined}
                          borderColor={dEmergency + sEmergency > 0 ? "#ef4444" : "var(--n200)"}
                          subtitle={`Direto: ${dEmergency} | Indireto: ${sEmergency}`}
                          onClick={() => setDashboardView("emergencyAssets")} />
                        <DashboardCard icon={AlertTriangle} className="maintenance"
                          label="Contingência em Manutenção" value={dEmergencyMaintenance + sEmergencyMaintenance}
                          borderColor={(dEmergencyMaintenance + sEmergencyMaintenance) > 0 ? "#f59e0b" : "var(--n200)"}
                          subtitle={`Críticos Inoperantes: ${dEmergencyMaintenance + sEmergencyMaintenance}`}
                          onClick={() => setDashboardView("emergencyMaintenanceAssets")} />
                        <DashboardCard icon={Building2} iconBg="#dcfce7" iconColor="#16a34a" className="units"
                          label="Subunidades" value={dStructures.length + sStructures.length}
                          subtitle={`Nível 1: ${dStructures.length} | Profundas: ${sStructures.length}`} />
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
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span>{a.contatoAcionamento || "—"}</span>
                                    {a.contatoAcionamento && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <AssetBadges asset={a} compact showText={false} />
                                        <AssetContactActions phone={a.contatoAcionamento} responsible={a.contatoResponsavel} />
                                      </div>
                                    )}
                                  </div>
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

                {dashboardView === "allAssets" && (
                  <div className="bi-list-view">
                    <div className="bi-list-view-header" style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800 }}>Inventário Geral de Ativos</h2>
                      <p style={{ fontSize: 12, color: "var(--n500)" }}>Listagem completa de equipamentos da estrutura e subunidades.</p>
                    </div>
                    <AssetTable list={dAssets} title="Ativos Diretos da Unidade" />
                    <AssetTable list={sAssets} title="Ativos das Subunidades (Hierarquia)" />
                  </div>
                )}

                {dashboardView === "emergencyAssets" && (
                  <div className="bi-list-view">
                    <div className="bi-list-view-header" style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>Inventário de Contingência</h2>
                      <p style={{ fontSize: 12, color: "var(--n500)" }}>Ativos estratégicos para operação em situações de emergência.</p>
                    </div>
                    <AssetTable list={dAssets.filter(a => a.isEmergency)} title="Contingência: Ativos Diretos" />
                    <AssetTable list={sAssets.filter(a => a.isEmergency)} title="Contingência: Subunidades" />
                  </div>
                )}
              </div>
              
               <div className="modal-footer bi-footer-actions no-print">
                {dashboardView !== "summary" ? (
                  <button className="btn btn-primary btn-xs" onClick={() => setDashboardView("summary")}>Voltar para o Resumo</button>
                ) : (
                  <button className="btn btn-outline btn-xs" onClick={() => { setDashboardNodeId(null); setShowDetail(true); }}>Fechar Dashboard</button>
                )}
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
                  const latestUsers = await fetchUsers(supabase);
                  if (!latestUsers) return setLoginErr("Erro de conexão. Tente novamente.");
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

      {/* ═─ ═─ ═─ NODE DIALOG (Create/Edit) ═─ ═─ ═─ */}
      <NodeForm
        open={openNodeDlg}
        nodeForm={nodeForm}
        setNodeForm={setNodeForm}
        editNodeId={editNodeId}
        canEdit={canEdit}
        persons={persons}
        nodes={nodes}
        onClose={() => setOpenNodeDlg(false)}
        onSave={saveNode}
        requestDeleteNode={requestDeleteNode}
      />

      {/* ═─ ═─ ═─ ASSET DIALOG ═─ ═─ ═─ */}
      <AssetForm
        open={openAssetDlg}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        editAssetId={editAssetId}
        canEdit={canEdit}
        isAdmin={isAdmin}
        nodes={nodes}
        contracts={contracts}
        assetTypes={assetTypes}
        personMap={personMap}
        onClose={() => setOpenAssetDlg(false)}
        onSave={saveAsset}
        onOpenAssetTypes={() => setOpenAssetTypesDlg(true)}
        showSystemAlert={showSystemAlert}
        fileToBase64={fileToBase64}
        maskPhone={maskPhone}
      />

      {/* ═─ ═─ ═─ LOGS MODAL ═─ ═─ ═─ */}
      <LogsModal
        open={openLogsDlg}
        onClose={() => setOpenLogsDlg(false)}
        logFilterStart={logFilterStart}
        setLogFilterStart={setLogFilterStart}
        logFilterEnd={logFilterEnd}
        setLogFilterEnd={setLogFilterEnd}
        filteredLogs={filteredLogs}
        exportLogsCsv={exportLogsCsv}
        generateDirectPdf={generateDirectPdf}
        exportLogsPdf={exportLogsPdf}
      />

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
      <StatsModal
        open={openStatsDlg && isAdmin}
        onClose={() => setOpenStatsDlg(false)}
        logs={logs}
      />

      
      {/* ═─ ═─ ═─ GESTÃO DE TIPOS DE ATIVOS ═─ ═─ ═─ */}
      <AssetTypesModal
        open={openAssetTypesDlg}
        onClose={() => setOpenAssetTypesDlg(false)}
        isAdmin={isAdmin}
        assetTypes={assetTypes}
        assetTypeForm={assetTypeForm}
        setAssetTypeForm={setAssetTypeForm}
        editAssetTypeId={editAssetTypeId}
        saveAssetType={saveAssetType}
        resetAssetTypeForm={resetAssetTypeForm}
        startEditAssetType={startEditAssetType}
        requestDeleteAssetType={requestDeleteAssetType}
      />

      {/* ═─ ═─ ═─ PERSON REGISTRY / EDIT MODAL ═─ ═─ ═─ */}
      <PersonForm
        open={openPersonDlg}
        setOpen={setOpenPersonDlg}
        personForm={personForm}
        setPersonForm={setPersonForm}
        editPersonId={editPersonId}
        setEditPersonId={setEditPersonId}
        persons={persons}
        registryFilter={registryFilter}
        setRegistryFilter={setRegistryFilter}
        onShowDetail={(id) => {
          setPersonReturnTarget("registry");
          setShowPersonDetail(id);
          setOpenPersonDlg("registry");
        }}
        onCreatePerson={() => openPersonCreate({ fromRegistry: true })}
        onEditPerson={(person) => openPersonEdit(person, { fromRegistry: true })}
        onSave={savePerson}
        onCloseRegistry={closePersonRegistry}
        onCancelEdit={cancelPersonEdit}
        onBackToRegistry={backToPersonRegistry}
        onDeleteRequest={requestDeletePerson}
        onImport={handleImportPersons}
        emptyPerson={emptyPerson}
        fileToBase64={fileToBase64}
        maskPhone={maskPhone}
      />

      {/* ═─ ═─ ═─ PERSON DETAIL VIEW ═─ ═─ ═─ */}
      {showPersonDetail && (
        <PersonDetail
          person={personMap.get(showPersonDetail)}
          nodes={nodes}
          contracts={contracts}
          isProtected={isProtected}
          canEdit={canEdit}
          onClose={closePersonDetail}
          onEdit={(p) => openPersonEdit(p)}
          onSelectNode={(id) => { 
            selectNode(id); 
            setFocusId(id); 
            setShowPersonDetail(null); 
            setShowDetail(true); 
          }}
          resolveAddress={resolveAddress}
        />
      )}

      {/* ═─ ═─ ═─ CONTRACT DETAIL VIEW ═─ ═─ ═─ */}
      {showContractDetail && (
        <ContractDetail
          contract={contracts.find(x => x.id === showContractDetail)}
          nodes={nodes}
          assets={assets}
          personMap={personMap}
          canEdit={canEdit}
          onClose={() => setShowContractDetail(null)}
          onExportPdf={exportContractDetailPdf}
          onExportCsv={exportContractDetailCsv}
          onPrint={() => window.print()}
          onDeleteRequest={requestDeleteContract}
        />
      )}

      {/* ═─ ═─ ═─ CONTRACT REGISTRY / EDIT MODAL ═─ ═─ ═─ */}
      <ContractForm
        open={openContractDlg}
        contractForm={contractForm}
        setContractForm={setContractForm}
        editContractId={editContractId}
        canEdit={canEdit}
        isAdmin={isAdmin}
        nodes={nodes}
        persons={persons}
        contracts={contracts}
        assets={assets}
        contractFilter={contractFilter}
        setContractFilter={setContractFilter}
        onCloseRegistry={closeContractRegistry}
        onCancelEdit={cancelContractEdit}
        onSave={saveContract}
        onCreateContract={() => openContractCreate({ fromRegistry: true })}
        onEditContract={(c) => openContractEdit(c, { fromRegistry: true })}
        onShowDetail={(id) => {
          setContractReturnTarget("registry");
          setShowContractDetail(id);
          setOpenContractDlg("registry");
        }}
        onDeleteRequest={requestDeleteContract}
        maskCnpj={maskCnpj}
        getCnpjValidationMessage={getCnpjValidationMessage}
      />

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

            <div className="modal-body" style={{ overflow: "hidden", height: "85vh", maxHeight: "none", paddingBottom: 16 }}>
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
                alignItems: "end",
                flexShrink: 0
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
                    const logoUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "/logo-dmae.png";
                    exportAssetsPdf(list, { 
                      label: "Registro Centralizado", 
                      nodes, 
                      sort: assetRegSort,
                      logoUrl
                    });
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
                    exportAssetsCsv(list, { nodes });
                 }}>
                   <Download size={12} /> Exportar Excel (CSV)
                 </button>
              </div>

              {/* RESULTS TABLE */}
              <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ background: "var(--n100)", position: "sticky", top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", userSelect: "none" }} onClick={() => setAssetRegSort({ key: "name", direction: assetRegSort.key === "name" && assetRegSort.direction === "asc" ? "desc" : "asc" })}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>Ativo {assetRegSort.key === "name" && (assetRegSort.direction === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", userSelect: "none" }} onClick={() => setAssetRegSort({ key: "vinculo", direction: assetRegSort.key === "vinculo" && assetRegSort.direction === "asc" ? "desc" : "asc" })}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>Vínculo {assetRegSort.key === "vinculo" && (assetRegSort.direction === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", userSelect: "none" }} onClick={() => setAssetRegSort({ key: "node", direction: assetRegSort.key === "node" && assetRegSort.direction === "asc" ? "desc" : "asc" })}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>Localização (Unidade) {assetRegSort.key === "node" && (assetRegSort.direction === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", userSelect: "none" }} onClick={() => setAssetRegSort({ key: "contato", direction: assetRegSort.key === "contato" && assetRegSort.direction === "asc" ? "desc" : "asc" })}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>Contato / Responsável {assetRegSort.key === "contato" && (assetRegSort.direction === "asc" ? "↑" : "↓")}</div>
                        </th>
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

                        filtered.sort((a, b) => {
                          let valA = "", valB = "";
                          if (assetRegSort.key === "name") { valA = a.name; valB = b.name; }
                          else if (assetRegSort.key === "vinculo") { valA = a.tipoVinculo; valB = b.tipoVinculo; }
                          else if (assetRegSort.key === "node") { valA = nodes.find(n=>n.id===a.nodeId)?.name || ""; valB = nodes.find(n=>n.id===b.nodeId)?.name || ""; }
                          else if (assetRegSort.key === "contato") { valA = a.contatoResponsavel || a.contatoFone || ""; valB = b.contatoResponsavel || b.contatoFone || ""; }
                          
                          valA = (valA || "").toLowerCase();
                          valB = (valB || "").toLowerCase();
                          if (valA < valB) return assetRegSort.direction === "asc" ? -1 : 1;
                          if (valA > valB) return assetRegSort.direction === "asc" ? 1 : -1;
                          return 0;
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
                                    <div style={{ fontSize: 10, color: "var(--n500)", display: "flex", alignItems: "center", gap: 6 }}>
                                      {a.type} • {a.model || "—"} {a.year && `(${a.year})`}
                                      {Array.isArray(a.photos) && a.photos.filter(Boolean).length > 0 && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--n600)", fontWeight: 600 }} title="Possui fotos">
                                          <Image size={10} /> Foto
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className={`badge ${a.tipoVinculo === "Contratado" ? "badge-sec" : "badge-out"}`}>
                                  {a.tipoVinculo || "Próprio"}
                                </span>
                                {a.tipoVinculo === "Contratado" && a.empresaContratada && (
                                  <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: "var(--n600)" }}>🏢 {a.empresaContratada}</div>
                                )}
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
                                              <>
                                                <AssetContactActions phone={a.contatoAcionamento} responsible={a.contatoResponsavel} />
                                              </>
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
                                      <button className="btn btn-outline btn-xs" title="Excluir Ativo" style={{ color: "#ef4444" }} onClick={() => requestDeleteAsset(a)}>
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
                Desenvolvido por <span>&nbsp;{"Fábio Bühler"} - {"Versão"} 1.0.2026.04252155</span>
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
        <AssetDetail
          asset={assets.find(x => x.id === viewAssetId)}
          nodes={nodes}
          canEdit={canEdit}
          isProtected={isProtected}
          onClose={() => setViewAssetId(null)}
          onEdit={(a) => { setViewAssetId(null); openEditAsset(a); }}
          onDeleteRequest={requestDeleteAsset}
          setExpandedImage={setExpandedImage}
        />
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
