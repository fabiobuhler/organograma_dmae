import { 
  X, Search, Upload, Users, Pencil, Trash2, MapPin 
} from "lucide-react";

/**
 * Componente de formulário e listagem de pessoas (Modal).
 * Extraído do App.jsx na Fase 6A.
 */
export default function PersonForm({
  open,
  personForm,
  setPersonForm,
  editPersonId,
  persons = [],
  registryFilter = "",
  setRegistryFilter = () => {},
  onShowDetail,
  onCreatePerson,
  onEditPerson,
  onSave,
  onCloseRegistry,
  onCancelEdit,
  onDeleteRequest,
  onImport,
  fileToBase64,
  maskPhone
}) {
  if (!open) return null;

  const handleClose = () => {
    if (open === "registry") {
      onCloseRegistry?.();
    } else {
      onCancelEdit?.();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-content wide">
        <button className="modal-close" onClick={handleClose}><X size={12} /></button>
        <div className="modal-header">
          <h2>{open === "registry" ? "Cadastro de Pessoas" : (editPersonId ? "Editar Pessoa" : "Cadastrar Pessoa")}</h2>
          <p>{open === "registry" ? "Base de dados centralizada de servidores e colaboradores." : "Preencha as informações obrigatórias."}</p>
        </div>

        {open === "registry" ? (
          <div className="modal-body" style={{ minHeight: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => onCreatePerson?.()}>+ Nova Pessoa</button>
                <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                  <Upload size={14} /> Importar
                  <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={onImport} />
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
                  <tr>
                    <th style={{ padding: 10, textAlign: "left" }}>Nome / Matrícula</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Cargo Oficial</th>
                    <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {persons
                    .filter(p => !registryFilter || p.name.includes(registryFilter.toUpperCase()) || p.matricula.includes(registryFilter))
                    .slice(0, 50)
                    .map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                        <td style={{ padding: 10 }}>
                          <b>{p.name}</b><br />
                          <span style={{ fontSize: 10, color: "var(--n400)" }}>{p.matricula} • {p.regime || "—"} / {p.vinculo || "—"}</span>
                        </td>
                        <td style={{ padding: 10 }}>{p.cargo}</td>
                        <td style={{ padding: 10, textAlign: "right" }}>
                          <button className="btn btn-outline btn-xs" title="Visualizar Detalhes" onClick={() => onShowDetail(p.id)} style={{ marginRight: 4 }}>
                            <Users size={12} />
                          </button>
                          <button className="btn btn-outline btn-xs" title="Editar Cadastro" onClick={() => onEditPerson?.(p)} style={{ marginRight: 4 }}>
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-outline btn-xs" title="Excluir Registro" onClick={() => onDeleteRequest(p.id)}>
                            <Trash2 size={12} />
                          </button>
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
              <div className="fg">
                <label className="fl">Nome Completo <span style={{ color: "red" }}>*</span></label>
                <input className="fi" value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value.toUpperCase() })} />
              </div>
              <div className="fg">
                <label className="fl">Matrícula <span style={{ color: "red" }}>*</span></label>
                <input className="fi" value={personForm.matricula} onChange={(e) => setPersonForm({ ...personForm, matricula: e.target.value })} />
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Cargo Oficial <span style={{ color: "red" }}>*</span></label>
                <input className="fi" value={personForm.cargo} onChange={(e) => setPersonForm({ ...personForm, cargo: e.target.value.toUpperCase() })} />
              </div>
              <div className="fg">
                <label className="fl">E-mail <span style={{ color: "red" }}>*</span></label>
                <input id="person-email-input" className="fi" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} />
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Regime Jurídico</label>
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
              <div className="fg">
                <label className="fl">Vínculo</label>
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
              <div className="fg">
                <label className="fl">Telefone (Fixo ou Whats)</label>
                <input className="fi" value={personForm.telefone || ""} onChange={(e) => setPersonForm({ ...personForm, telefone: maskPhone ? maskPhone(e.target.value) : e.target.value })} placeholder="(51) 99999-9999" />
              </div>
              <div className="fg">
                <label className="fl">Ramal</label>
                <input className="fi" value={personForm.ramal} onChange={(e) => setPersonForm({ ...personForm, ramal: e.target.value })} placeholder="Ex: 8001" />
              </div>
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
          <button className="btn btn-outline btn-xs" onClick={handleClose}>
            {open === "registry" ? "Fechar" : "Voltar"}
          </button>
          {open === "edit" && (
            <button className="btn btn-primary btn-xs" onClick={onSave}>
              Salvar Alterações
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
