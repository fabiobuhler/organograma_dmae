import { 
  X, Search, FileText, Pencil, Trash2, Briefcase, 
  ShieldCheck, Wrench, Save, Siren 
} from "lucide-react";
import NodeSelector from "../selectors/NodeSelector";
import PersonSelector from "../selectors/PersonSelector";
import { getContractStatus } from "../../utils/contractUtils";

/**
 * Componente de formulário e listagem de contratos (Modal).
 * Extraído do App.jsx na Fase 6D.
 */
export default function ContractForm({
  open,
  contractForm,
  setContractForm,
  editContractId,
  canEdit,
  isAdmin,
  nodes = [],
  persons = [],
  contracts = [],
  assets = [],
  contractFilter = "",
  setContractFilter,
  onCloseRegistry,
  onCancelEdit,
  onSave,
  onCreateContract,
  onEditContract,
  onShowDetail,
  onDeleteRequest,
  maskCnpj,
  getCnpjValidationMessage
}) {
  if (!open) return null;

  const handleClose = () => {
    if (open === "registry") {
      onCloseRegistry?.();
    } else {
      onCancelEdit?.();
    }
  };

  const cnpjMessage = getCnpjValidationMessage?.(contractForm.cnpj || "");

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-content wide">
        <button className="modal-close" onClick={handleClose}><X size={12} /></button>
        <div className="modal-header">
          <h2>{open === "registry" ? "Cadastro de Contratos" : (editContractId ? "Editar Contrato" : "Cadastrar Contrato")}</h2>
          <p>{open === "registry" ? "Base de dados centralizada de contratos e seus respectivos fiscais." : "Preencha as informações do processo SEI e responsabilidades."}</p>
        </div>

        {open === "registry" ? (
          <div className="modal-body" style={{ minHeight: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
              {canEdit ? (
                <button className="btn btn-primary btn-sm" onClick={onCreateContract}>
                  + Novo Contrato
                </button>
              ) : <div/>}
              <div className="hdr-search" style={{ width: 220 }}>
                <Search size={12} />
                <input 
                  placeholder="Filtrar contratos..." 
                  value={contractFilter} 
                  onChange={(e) => setContractFilter(e.target.value)} 
                />
              </div>
            </div>
            <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "var(--n50)" }}>
                  <tr>
                    <th style={{ padding: 10, textAlign: "left" }}>Nº SEI</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Status</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Objeto / Itens</th>
                    <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts
                    .filter(c => !contractFilter || c.sei.toLowerCase().includes(contractFilter.toLowerCase()) || c.objeto.toLowerCase().includes(contractFilter.toLowerCase()))
                    .map(c => (
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
                      <td style={{ padding: 10, maxWidth: 300 }}>
                        <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.objeto}</div>
                        <div style={{ fontSize: 10, color: "var(--n500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.itens || "(Sem itens listados)"}</div>
                      </td>
                      <td style={{ padding: 10, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="btn btn-outline btn-xs" title="Visualizar Detalhes" onClick={() => onShowDetail(c.id)} style={{ marginRight: 4 }}>
                          <FileText size={12} />
                        </button>
                        {canEdit && (
                          <>
                            <button className="btn btn-outline btn-xs" title="Editar" onClick={() => onEditContract?.(c)} style={{ marginRight: 4 }}>
                              <Pencil size={12} />
                            </button>
                            <button className="btn btn-outline btn-xs" title="Excluir" onClick={() => onDeleteRequest(c)}>
                              <Trash2 size={12} />
                            </button>
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
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Nº Processo (SEI) *</label>
                <input 
                  className="fi" 
                  value={contractForm.sei} 
                  onChange={(e) => setContractForm({ ...contractForm, sei: e.target.value })} 
                  placeholder="Ex: 25.10.000010414-3" 
                />
              </div>
            </div>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Nome da Empresa Contratada *</label>
                <input 
                  className="fi" 
                  value={contractForm.empresa || ""} 
                  placeholder="Razão social..." 
                  onChange={(e) => setContractForm({ ...contractForm, empresa: e.target.value })} 
                />
              </div>
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">CNPJ *</label>
                <input 
                  className="fi" 
                  value={contractForm.cnpj || ""} 
                  placeholder="00.000.000/0000-00" 
                  onChange={(e) => setContractForm({ ...contractForm, cnpj: maskCnpj ? maskCnpj(e.target.value) : e.target.value })} 
                />
                {cnpjMessage && (
                  <div style={{ color: "#b91c1c", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                    {cnpjMessage}
                  </div>
                )}
              </div>
            </div>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Contato da Empresa (Acionamento)</label>
                <input 
                  className="fi" 
                  value={contractForm.contato || ""} 
                  placeholder="Telefone, WhatsApp ou E-mail..." 
                  onChange={(e) => setContractForm({ ...contractForm, contato: e.target.value })} 
                />
              </div>
            </div>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Data de Início</label>
                <input 
                  type="date" 
                  className="fi" 
                  value={contractForm.dataInicio || ""} 
                  onChange={(e) => setContractForm({ ...contractForm, dataInicio: e.target.value })} 
                />
              </div>
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Data de Término</label>
                <input 
                  type="date" 
                  className="fi" 
                  value={contractForm.dataTermino || ""} 
                  onChange={(e) => setContractForm({ ...contractForm, dataTermino: e.target.value })} 
                />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Objeto do Contrato *</label>
              <textarea 
                className="ft" 
                style={{ height: 60 }} 
                value={contractForm.objeto} 
                onChange={(e) => setContractForm({ ...contractForm, objeto: e.target.value })} 
                placeholder="Descreva o objeto da contratação..." 
              />
            </div>
            <div className="fg">
              <label className="fl">Itens do Contrato (Materiais / Serviços)</label>
              <textarea 
                className="ft" 
                style={{ height: 60 }} 
                value={contractForm.itens} 
                onChange={(e) => setContractForm({ ...contractForm, itens: e.target.value })} 
                placeholder="Liste os materiais ou serviços contemplados..." 
              />
            </div>
            
            <div style={{ marginTop: 12, padding: 12, background: "var(--n50)", borderRadius: 12, border: "1px solid var(--n200)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>Aditivos</h3>
                <button 
                  className="btn btn-outline btn-xs" 
                  onClick={() => setContractForm({ ...contractForm, aditivos: [...(contractForm.aditivos || []), { aditivoInício: "", aditivoTermino: "" }] })}
                >
                  + Add Aditivo
                </button>
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
          <button className="btn btn-outline btn-xs" onClick={handleClose}>
            {open === "registry" ? "Fechar" : "Voltar"}
          </button>
          {open === "edit" && (
            <div style={{ display: "flex", gap: 8 }}>
              {editContractId && (
                <button className="btn btn-outline btn-xs" onClick={() => onShowDetail(editContractId)}>
                  <FileText size={12} /> Espelho do Contrato
                </button>
              )}
              <button className="btn btn-primary btn-xs" onClick={onSave}>
                <Save size={12} /> Salvar Contrato
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
