import { 
  X, Printer, FileText, Siren, Package, 
  Calendar, Briefcase, ShieldCheck, Trash2, FileSpreadsheet
} from "lucide-react";
import { getContractStatus } from "../../utils/contractUtils";

/**
 * Componente de visualização detalhada de um contrato.
 * Extraído do App.jsx na Fase 5B.
 */
export default function ContractDetail({
  contract,
  nodes = [],
  assets = [],
  personMap = new Map(),
  canEdit = false,
  onClose,
  onPrint,
  onExportPdf,
  onExportCsv,
  onDeleteRequest
}) {
  if (!contract) return null;

  const status = getContractStatus(contract);
  const node = nodes.find(n => n.id === contract.nodeId);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
        
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 18 }}>
              Contrato SEI: {contract.sei}
              <span style={{ 
                fontSize: 10, 
                padding: "2px 6px", 
                borderRadius: 4, 
                fontWeight: "bold", 
                background: status === "active" ? "#d1fae5" : status === "expiring" ? "#ffedd5" : "#fee2e2", 
                color: status === "active" ? "#065f46" : status === "expiring" ? "#9a3412" : "#991b1b" 
              }}>
                {status === "active" ? "Ativo" : status === "expiring" ? "A Vencer" : "Vencido"}
              </span>
            </h2>
            <p style={{ marginTop: 4 }}>Visualização das informações da contratação</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-xs" onClick={onPrint || (() => window.print())}>
              <Printer size={12} /> Imprimir
            </button>
            <button className="btn btn-outline btn-xs" onClick={() => onExportPdf && onExportPdf(contract)}>
              <FileText size={12} /> Exportar PDF
            </button>
            {onExportCsv && (
              <button className="btn btn-outline btn-xs" onClick={() => onExportCsv(contract)}>
                <FileSpreadsheet size={12} /> Exportar CSV
              </button>
            )}
          </div>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--n50)", padding: 12, borderRadius: 12, border: "1px solid var(--n200)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 13, marginBottom: 4 }}><b>Objeto:</b> {contract.objeto || "---"}</p>
                <p style={{ fontSize: 13, marginBottom: 4 }}><b>Itens:</b> {contract.itens || "---"}</p>
                <p style={{ fontSize: 13, marginBottom: 4 }}><b>Unidade Vinculada:</b> {node ? `${node.name} — ${node.description || ""}` : "(Nenhuma)"}</p>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--n200)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--n500)", marginBottom: 4 }}>DADOS DA EMPRESA</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--p700)" }}>{contract.empresa || "(Razão Social não informada)"}</p>
                  <p style={{ fontSize: 11, color: "var(--n500)" }}>CNPJ: {contract.cnpj || "---"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12 }}><b>Contato:</b> {contract.contato || "---"}</p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, borderTop: "1px solid var(--n200)", paddingTop: 12 }}>
              <div><b>Início:</b> {contract.dataInício ? new Date(`${contract.dataInício}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}</div>
              <div><b>Término:</b> {contract.dataTermino ? new Date(`${contract.dataTermino}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}</div>
            </div>
          </div>

          {(() => {
            const contractAssets = assets.filter(a => a.numeroContrato === contract.sei);
            if (contractAssets.length === 0) return null;
            return (
              <div>
                <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} /> Ativos Vinculados ({contractAssets.length})
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {contractAssets.map(a => (
                    <div key={a.id} style={{ fontSize: 11, padding: "8px", background: "var(--n50)", borderRadius: 8, border: "1px solid var(--n200)" }}>
                      <div style={{ fontWeight: "bold", display: "flex", alignItems: "center" }}>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.name}>{a.name}</span>
                        {a.isEmergency && (
                          <span
                            title="Ativo de contingência"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              marginLeft: 6,
                              color: "#dc2626",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            <Siren size={12} />
                            Contingência
                          </span>
                        )}
                      </div>
                      <div style={{ opacity: 0.7 }}>{a.category} | {a.plate || a.patrimonio || "S/N"}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {(contract.aditivos && contract.aditivos.length > 0) && (
            <div>
              <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} /> Aditivos
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {contract.aditivos.map((ad, idx) => (
                  <div key={idx} style={{ fontSize: 12, background: "var(--n50)", padding: "6px 10px", borderRadius: 8, border: "1px solid var(--n200)" }}>
                    <b>Aditivo {idx + 1}:</b> {ad.aditivoInício ? new Date(`${ad.aditivoInício}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"} a {ad.aditivoTermino ? new Date(`${ad.aditivoTermino}T12:00:00`).toLocaleDateString("pt-BR") : "N/A"}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={14} /> Gestão do Contrato
              </h3>
              {contract.gestor?.titularId ? (
                <div style={{ fontSize: 13, padding: "8px", background: "var(--n50)", borderRadius: 8, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span><b>Titular:</b> {personMap.get(contract.gestor.titularId)?.name || "Desconhecido"}</span>
                  <span style={{ fontSize: 11, color: "var(--n500)" }}>Mat: {personMap.get(contract.gestor.titularId)?.matricula || "—"}</span>
                </div>
              ) : <div style={{ fontSize: 12, color: "var(--n400)" }}>Sem Gestor Titular</div>}
              {contract.gestor?.suplenteId ? (
                <div style={{ fontSize: 13, padding: "8px", background: "var(--n50)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                  <span><b>Suplente:</b> {personMap.get(contract.gestor.suplenteId)?.name || "Desconhecido"}</span>
                  <span style={{ fontSize: 11, color: "var(--n500)" }}>Mat: {personMap.get(contract.gestor.suplenteId)?.matricula || "—"}</span>
                </div>
              ) : null}
            </div>

            <div>
              <h3 className="asset-section-title" style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} /> Equipes de Fiscalização
              </h3>
              {(() => {
                const allFiscais = [...(contract.fiscaisContrato || []), ...(contract.fiscaisServico || [])].filter(f => f.titularId || f.suplenteId);
                if (allFiscais.length === 0) return <div style={{ fontSize: 12, color: "var(--n400)" }}>Nenhum fiscal vinculado.</div>;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {allFiscais.map((f, idx) => (
                      <div key={idx} style={{ fontSize: 12, padding: "10px", background: "var(--n50)", borderRadius: 8, border: "1px solid var(--n200)" }}>
                        <div style={{ fontWeight: "bold", marginBottom: 6, color: "var(--n600)" }}>Fiscal Equipe {idx + 1}</div>
                        {f.titularId && (
                          <div style={{ marginBottom: 4 }}>
                            <b>Titular:</b> {personMap.get(f.titularId)?.name || "Desconhecido"} 
                            <span style={{ color: "var(--n500)", fontSize: 10 }}> (Mat: {personMap.get(f.titularId)?.matricula || "—"})</span>
                          </div>
                        )}
                        {f.suplenteId && (
                          <div>
                            <b>Suplente:</b> {personMap.get(f.suplenteId)?.name || "Desconhecido"} 
                            <span style={{ color: "var(--n500)", fontSize: 10 }}> (Mat: {personMap.get(f.suplenteId)?.matricula || "—"})</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          {canEdit && (
            <button className="btn btn-outline btn-xs" style={{ color: "#ef4444" }} onClick={() => onDeleteRequest?.(contract)}>
              <Trash2 size={12} /> Excluir Contrato
            </button>
          )}
          <button className="btn btn-primary btn-xs" onClick={onClose}>Fechar Visualização</button>
        </div>
      </div>
    </div>
  );
}
