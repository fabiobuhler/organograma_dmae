const fs = require('fs');
const path = 'src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add States
content = content.replace('const [assetTypes, setAssetTypes] = useState(seedAssetTypes);', 
  'const [assetTypes, setAssetTypes] = useState(seedAssetTypes);\n  const [assetTypeForm, setAssetTypeForm] = useState({ id: "", category: "", name: "" });\n  const [editAssetTypeId, setEditAssetTypeId] = useState(null);\n  const [confirmDialog, setConfirmDialog] = useState(null);');

// 2. Add Functions (target specific area)
const functionsHook = '  // Asset CRUD';
const functions = `  const resetAssetTypeForm = useCallback(() => {
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
      showSystemAlert(\`Preencha os campos obrigatórios antes de salvar o tipo:\\n\\n\${missingFields.map((field) => \`- \${field}\`).join("\\n")}\`, { title: "Dados obrigatórios", type: "warning" });
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
      showSystemAlert(\`Não foi possível salvar o tipo de ativo.\\n\\nDetalhe técnico: \${error.message}\`, { title: "Erro ao salvar tipo", type: "error" });
    }
  }, [assetTypeForm, assetTypes, editAssetTypeId, resetAssetTypeForm, showSystemAlert, supabase]);

  const startEditAssetType = useCallback((item) => {
    const id = item.id || item._localId || \`\${item.category}-\${item.name}\`;
    setEditAssetTypeId(id);
    setAssetTypeForm({ id: item.id || "", category: item.category || "", name: item.name || "" });
  }, []);

  const requestDeleteAssetType = useCallback((item) => {
    const typeId = item.id || item._localId || \`\${item.category}-\${item.name}\`;
    const usedAssets = assets.filter((asset) => {
      return String(asset.category || "").trim().toLowerCase() === String(item.category || "").trim().toLowerCase() && String(asset.type || "").trim().toLowerCase() === String(item.name || "").trim().toLowerCase();
    });
    const usageMessage = usedAssets.length > 0 ? \`\\n\\nAtenção: existem \${usedAssets.length} ativo(s) usando este tipo. A exclusão removerá apenas o tipo da lista de opções, não alterará os ativos já cadastrados.\` : "";
    setConfirmDialog({
      title: "Excluir tipo de ativo",
      subtitle: "Esta ação precisa de confirmação.",
      type: "danger",
      confirmText: "Excluir",
      message: \`Deseja realmente excluir o tipo abaixo?\\n\\nGrupo: \${item.category}\\nTipo: \${item.name}\${usageMessage}\`,
      onConfirm: async () => {
        try {
          if (supabase && item.id) {
            const { error } = await supabase.from("asset_types").delete().eq("id", item.id);
            if (error) throw error;
          }
          setAssetTypes((current) => current.filter((typeItem) => (typeItem.id || typeItem._localId || \`\${typeItem.category}-\${typeItem.name}\`) !== typeId));
          if (editAssetTypeId === typeId) resetAssetTypeForm();
          showSystemAlert("Tipo de ativo excluído com sucesso.", { title: "Tipo excluído", type: "success" });
        } catch (error) {
          console.error("Erro ao excluir tipo de ativo:", error);
          showSystemAlert(\`Não foi possível excluir o tipo de ativo.\\n\\nDetalhe técnico: \${error.message}\`, { title: "Erro ao excluir tipo", type: "error" });
        }
      }
    });
  }, [assets, editAssetTypeId, resetAssetTypeForm, showSystemAlert, supabase]);\n\n`;

content = content.replace(functionsHook, functions + functionsHook);

// 3. Add ConfirmDialog Component (after SystemAlertModal)
const alertModalCode = `function ConfirmDialog({ dialog, onCancel, onConfirm }) {
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
          <div className={\`system-alert-box \${isDanger ? "error" : "warning"}\`} style={{ border: "none", background: "none", padding: 0 }}>
            <div className="system-alert-icon" style={{ background: isDanger ? "#fee2e2" : "#fefce8", color: isDanger ? "#ef4444" : "#eab308" }}>
              {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
            </div>

            <div className="system-alert-text">
              <div className="system-alert-title" style={{ color: "var(--n800)" }}>
                {dialog.title || "Confirmar ação"}
              </div>

              <div className="system-alert-message" style={{ color: "var(--n600)" }}>
                {String(dialog.message || "")
                  .split("\\n")
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
}`;

// Find the end of SystemAlertModal precisely
const alertModalEnd = /function SystemAlertModal[\s\S]+?\n\}/;
content = content.replace(alertModalEnd, (match) => match + '\n\n' + alertModalCode);

// 4. Update Dialog JSX
const dialogTarget = /\{openAssetTypesDlg && isAdmin && \([\s\S]+?\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
const dialogReplacement = `{openAssetTypesDlg && isAdmin && (
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
                      const tId = t.id || t._localId || \`\${t.category}-\${t.name}\`;
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
      )}`;

content = content.replace(dialogTarget, dialogReplacement);

// 5. Render ConfirmDialog in App JSX
const systemAlertModalRender = /<SystemAlertModal alert=\{systemAlert\} onClose=\{closeSystemAlert\} \/>/;
content = content.replace(systemAlertModalRender, (match) => match + \`
      <ConfirmDialog
        dialog={confirmDialog}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          const action = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          if (typeof action === "function") action();
        }}
      />\`);

fs.writeFileSync(path, content, 'utf8');
console.log('Asset types management improved successfully');
