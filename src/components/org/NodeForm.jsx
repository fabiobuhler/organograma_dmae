import { X, Save, Trash2 } from "lucide-react";
import PersonSelector from "../selectors/PersonSelector";
import { DEFAULT_ROOT_COLOR } from "../../utils/helpers";

/**
 * Componente de formulário para criação e edição de caixas (Nodes).
 * Extraído do App.jsx na Fase 6B.
 */
export default function NodeForm({
  open,
  nodeForm,
  setNodeForm,
  editNodeId,
  persons = [],
  nodes = [],
  onClose,
  onSave,
  requestDeleteNode
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content wide">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
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
            <button className="btn btn-outline btn-xs" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-xs" onClick={onSave}><Save size={12} /> Salvar Alterações</button>
          </div>
        </div>
      </div>
    </div>
  );
}
