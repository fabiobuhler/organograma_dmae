import { X, Save, Plus, Pencil, Trash2 } from "lucide-react";

/**
 * AssetTypesModal - Modal de gestão de tipos e categorias de ativos.
 */
export default function AssetTypesModal({
  open,
  onClose,
  isAdmin,
  assetTypes,
  assetTypeForm,
  setAssetTypeForm,
  editAssetTypeId,
  saveAssetType,
  resetAssetTypeForm,
  startEditAssetType,
  requestDeleteAssetType
}) {
  if (!open || !isAdmin) return null;

  const DEFAULT_ASSET_GROUPS = [
    "Veículo",
    "Equipamento",
    "Ferramenta",
    "Equipamento Leve",
    "Equipamento Pesado"
  ];

  const assetGroupOptions = Array.from(
    new Set([
      ...DEFAULT_ASSET_GROUPS,
      ...(Array.isArray(assetTypes)
        ? assetTypes.map((item) => item.category).filter(Boolean)
        : []),
      assetTypeForm?.category
    ].filter(Boolean).map((item) => String(item).trim()).filter(Boolean))
  ).sort();

  return (
    <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
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
                  {assetGroupOptions.map(group => (
                    <option key={group} value={group} />
                  ))}
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
          <button className="btn btn-primary btn-xs" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
