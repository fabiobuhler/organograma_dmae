import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Plus, Pencil, Undo2, Users } from "lucide-react";
import { initials, computeNodeColor, connectorColor } from "../utils/helpers";

/* ── Individual Card ── */
const OrgNodeCard = ({ node, selected, childCount, assetCount, onSelect, onAddChild, onEditNode, onShowPerson, canEdit, bgColor, borderColor, collapsed, onToggleCollapse }) => {
  const isApoio = node.subtipo === "apoio";
  return (
    <div className="org-card-wrap">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        className={`org-card ${selected ? "selected" : ""} ${isApoio ? "apoio-card" : ""} ${node.isDark ? "dark" : ""}`}
        style={{ cursor: "pointer", backgroundColor: bgColor, borderColor: selected ? "var(--n800)" : borderColor, color: node.isDark ? "#fff" : "inherit" }}
      >
        <div className="org-card-top">
          <div className="av" style={{ cursor: node.foto ? "zoom-in" : "default" }} onClick={(e) => { if(node.foto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: node.foto })); } }}>
            {node.foto ? <img src={node.foto} alt={node.name} /> : <span className="av-fb">{initials(node.name)}</span>}
          </div>
          <div className="org-card-info">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
              <span className="oc-name" title={node.name}>{node.name}</span>
              <span className="dot" style={{ marginTop: 5 }} />
            </div>
            {(node.description || node.cargo) && <div className="oc-cargo">{node.description || node.cargo}</div>}
          </div>
        </div>
        {(node.responsavel || node.matricula) ? (
          <div className="oc-resp">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="oc-resp-name">{node.responsavel || "—"}</div>
              <div className="oc-resp-mat">{node.funcao || ""} {node.matricula && `• Mat: ${node.matricula}`}</div>
            </div>
          </div>
        ) : (
          <div style={{ height: 4 }} />
        )}
        <div className="oc-badges">
          <span className={`badge ${isApoio ? "badge-apoio" : "badge-sec"}`}>{isApoio ? "apoio" : node.tipo}</span>
          {childCount > 0 && <span className="badge badge-out">{childCount} ↓</span>}
          {assetCount > 0 && <span className="badge badge-out">{assetCount} ativos</span>}
        </div>
      </div>
      {/* Edit button – always visible on hover */}
      <button type="button" className="card-edit-btn" onClick={(e) => { e.stopPropagation(); onEditNode(node.id); }} title="Editar">
        <Pencil size={10} />
      </button>
      <button type="button" className="add-btn" onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }} title="Adicionar subordinado">
        <Plus size={12} />
      </button>
      {childCount > 0 && typeof onToggleCollapse === "function" && (
        <button
          className="coll-btn"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      )}
    </div>
  );
};

/* ── Apoio Branch (recursive) ── */
const ApoioBranch = ({ node, getChildren, selectedId, onSelect, onAddChild, onEditNode, onShowPerson, canEdit, directAssetCount, parentHex }) => {
  const [collapsed, setCollapsed] = useState(false);
  const childCh = getChildren(node.id);
  const nodeColor = computeNodeColor(node, parentHex);
  const connColor = connectorColor(nodeColor.baseHex);

  return (
    <li className="apoio-card-box">
      <div style={{ position: "relative" }}>
        <OrgNodeCard
          node={node} selected={selectedId === node.id} childCount={childCh.length}
          assetCount={directAssetCount(node.id)} onSelect={onSelect} onAddChild={onAddChild}
          onEditNode={onEditNode} onShowPerson={onShowPerson} canEdit={canEdit} bgColor={nodeColor.bg} borderColor={connColor}
          collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>
      {!collapsed && childCh.length > 0 && (
        <ul className="tree tree-apoio" style={{ "--connector-color": connColor }}>
          {childCh.map((child) => (
            <OrgBranch
              key={child.id} node={child} getChildren={getChildren} selectedId={selectedId}
              onSelect={onSelect} onAddChild={onAddChild} onEditNode={onEditNode}
              onShowPerson={onShowPerson}
              canEdit={canEdit} directAssetCount={directAssetCount} parentHex={nodeColor.hex}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ── Branch (recursive) ── */
const OrgBranch = ({ node, getChildren, selectedId, onSelect, onAddChild, onEditNode, onExpand, onShowPerson, directAssetCount, canEdit, parentHex, isFocusRoot, onReturnFromFocus }) => {
  const [collapsed, setCollapsed] = useState(false);
  const allChildren = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const apoioChildren = useMemo(() => allChildren.filter((c) => c.subtipo === "apoio"), [allChildren]);
  const subChildren = useMemo(() => allChildren.filter((c) => c.subtipo !== "apoio"), [allChildren]);
  const totalChildren = subChildren.length;

  const nodeColor = computeNodeColor(node, parentHex);
  const connColor = connectorColor(nodeColor.baseHex);

  return (
    <li className={selectedId === node.id ? "node-selected" : ""}>
      <div className="org-card-container">
        {/* If focus root, show return button */}
        {isFocusRoot && (
          <div style={{ marginBottom: 15 }}>
            <button className="return-focus-btn" onClick={onReturnFromFocus}>
              <Undo2 size={12} /> Voltar ao topo
            </button>
          </div>
        )}

        <OrgNodeCard
          node={{...node, isDark: nodeColor.isDark }} selected={selectedId === node.id} childCount={allChildren.length}
          assetCount={directAssetCount(node.id)} onSelect={onSelect} onAddChild={onAddChild}
          onEditNode={onEditNode} onShowPerson={onShowPerson}
          canEdit={canEdit} bgColor={nodeColor.bg} borderColor={connColor}
          collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {!collapsed && (subChildren.length > 0 || apoioChildren.length > 0) && (
        <div 
          className={`apoio-row ${subChildren.length > 0 ? "has-subs" : ""}`}
          style={{ "--connector-color": connColor }}
        >
          {apoioChildren.length > 0 && (
            <div className="apoio-right" style={{ gridColumn: 2 }}>
              <div className="apoio-conn-h" />
              <ul className="apoio-cards">
                {apoioChildren.map((child) => (
                  <ApoioBranch
                    key={child.id} node={child} getChildren={getChildren} selectedId={selectedId}
                    onSelect={onSelect} onAddChild={onAddChild} onEditNode={onEditNode}
                    onShowPerson={onShowPerson}
                    canEdit={canEdit} directAssetCount={directAssetCount} parentHex={nodeColor.hex}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!collapsed && subChildren.length > 0 && (
        <ul className="tree-sub" style={{ "--connector-color": connColor }}>
          {subChildren.map((child) => (
            <OrgBranch
              key={child.id} node={child} getChildren={getChildren}
              selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild}
              onEditNode={onEditNode} onExpand={onExpand} onShowPerson={onShowPerson}
              directAssetCount={directAssetCount} canEdit={canEdit} parentHex={nodeColor.hex}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export { OrgBranch, OrgNodeCard };
