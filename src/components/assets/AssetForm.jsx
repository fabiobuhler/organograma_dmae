import { X, Save, Siren, Plus, ClipboardList, ImagePlus } from "lucide-react";
import NodeSelector from "../selectors/NodeSelector";

/**
 * Componente de formulário para criação e edição de ativos.
 * Extraído do App.jsx na Fase 6C.
 */
export default function AssetForm({
  open,
  assetForm,
  setAssetForm,
  editAssetId,
  isAdmin,
  nodes,
  contracts,
  assetTypes,
  personMap,
  onClose,
  onSave,
  onOpenAssetTypes,
  showSystemAlert,
  fileToBase64,
  maskPhone
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
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
                        contatoAcionamento: maskPhone(e.target.value)
                      }))
                    }
                    placeholder="Ex.: (51) 99999-9999"
                  />
                </div>
              </div>

              <div className="hint-text">
                Informe o responsável operacional e o telefone que deve ser acionado diretamente para deslocamento ou operação do equipamento em contingência.
              </div>
            </div>
          )}

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

          <div className="fr">
            <div className="fg" style={{ flex: 1 }}><label className="fl">Grupo *</label>
              <div style={{ display: "flex", gap: 4, width: "100%" }}>
                <select className="fi" value={assetForm.category} style={{ textTransform: "capitalize" }} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}>
                  {Array.from(new Set(assetTypes.map(t => t.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {isAdmin && <button className="btn btn-outline btn-xs" type="button" style={{ padding: "0 8px" }} onClick={onOpenAssetTypes} title="Gerenciar Grupos/Tipos"><Plus size={12} /></button>}
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
                {isAdmin && <button className="btn btn-outline btn-xs" type="button" style={{ padding: "0 8px" }} onClick={onOpenAssetTypes} title="Gerenciar Grupos/Tipos"><Plus size={12} /></button>}
              </div>
            </div>
          </div>
          <div className="fg" style={{ marginTop: 8 }}><label className="fl">Identificação / Nome Curto *</label><input className="fi" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="Ex: Retro 01, Viatura 102..." /></div>

          <div className="fr" style={{ marginTop: 12 }}>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">Telefone / Contato do Ativo (Geral)</label>
              <input className="fi" value={assetForm.contatoFone || ""} onChange={(e) => setAssetForm({ ...assetForm, contatoFone: maskPhone(e.target.value) })} placeholder="Ex: (51) 99999-9999" />
            </div>
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
                       const fiscalTitular = personMap?.get(match.fiscaisContrato?.[0]?.titularId)?.name || "";
                       const fiscalMat = personMap?.get(match.fiscaisContrato?.[0]?.titularId)?.matricula || "";
                       setAssetForm({
                         ...assetForm,
                         numeroContrato: match.sei,
                         empresaContratada: match.empresa || "",
                         cnpjContratada: match.cnpj || "",
                         contatoEmpresa: match.contato || "",
                         responsavelDireto: match.responsavel || "",
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
                               const fiscal = personMap?.get(c.fiscaisContrato?.[0]?.titularId)?.name || "";
                               const fiscalMat = personMap?.get(c.fiscaisContrato?.[0]?.titularId)?.matricula || "";
                               setAssetForm({ 
                                 ...assetForm, 
                                 numeroContrato: c.sei, 
                                 empresaContratada: c.empresa || "", 
                                 cnpjContratada: c.cnpj || "", 
                                 contatoEmpresa: c.contato || "",
                                 responsavelDireto: c.responsavel || "",
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
                   <input className="fi" value={assetForm.contatoEmpresa || ""} placeholder="Telefone, e-mail ou nome do contato" onChange={(e) => setAssetForm({ ...assetForm, contatoEmpresa: e.target.value })} />
                 </div>
                 <div className="fg" style={{ flex: 1 }}>
                   <label className="fl">Responsável Direto (Condutor/Equipe)</label>
                   <input className="fi" value={assetForm.responsavelDireto || ""} placeholder="Nome e Telefone direto..." onChange={(e) => setAssetForm({ ...assetForm, responsavelDireto: e.target.value })} />
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
          <button className="btn btn-outline btn-xs" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-xs" onClick={onSave}><Save size={12} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}
