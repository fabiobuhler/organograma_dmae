import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, ChevronsDown, Plus, Pencil, Undo2, PieChart, Siren } from "lucide-react";
import { initials, computeNodeColor, connectorColor } from "../utils/helpers";

/* ──── Individual Card ──── */
const OrgNodeCard = ({
  node, person, selected, childCount, assetCount, emergencyCount,
  onSelect, onAddChild, onEditNode, onShowPerson, canEdit, isProtected,
  bgColor, borderColor, collapsed, onToggleCollapse, onExpand, onExpandAll, onOpenDashboard,
}) => {
  const isApoio = node.subtipo === "apoio";
  const displayPhoto = person?.foto || node.foto;
  const showSensitive = canEdit || isProtected;

  return (
    <div className="org-card-wrap">
      <div
        role="button"
        tabIndex={0}
        data-node-id={node.id}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); if (onExpand) onExpand(node.id); }}
        className={`org-card ${selected ? "selected" : ""} ${isApoio ? "apoio-card" : ""} ${node.isDark ? "dark" : ""}`}
        style={{ cursor: "pointer", backgroundColor: bgColor, borderColor: selected ? "var(--n800)" : borderColor, color: node.isDark ? "#fff" : "inherit" }}
      >
        <div className="org-card-top">
          <div
            className="av"
            style={{ cursor: displayPhoto ? "zoom-in" : "default" }}
            onClick={(e) => { if (displayPhoto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-photo", { detail: displayPhoto })); } }}
          >
            {displayPhoto ? <img src={displayPhoto} alt={node.name} /> : <span className="av-fb">{initials(node.name)}</span>}
          </div>
          <div className="org-card-info">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4, minWidth: 0 }}>
              <span className="oc-name" title={node.name}>{node.name}</span>
              {showSensitive && <span className="dot" style={{ marginTop: 5, flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {node.description && <div className="oc-cargo" title={node.description}>{node.description}</div>}
            </div>
          </div>
        </div>
        {node.tipo !== "pessoa" && (node.responsavel || (showSensitive && node.matricula)) ? (
          <div className="oc-resp">
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div className="oc-resp-name" title={node.responsavel}>{node.responsavel || "\u2014"}</div>
              <div className="oc-resp-mat" title={`${node.funcao || ""} ${node.matricula && showSensitive ? `Mat: ${node.matricula}` : ""}`}>
                {node.funcao || ""} {node.matricula && showSensitive && `Mat: ${node.matricula}`}
              </div>
            </div>
          </div>
        ) : node.tipo !== "pessoa" ? (
          <div style={{ height: 4 }} />
        ) : null}
        {node.tipo === "pessoa" && node.matricula && showSensitive && (
          <div className="oc-resp" style={{ paddingTop: 2 }}>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div className="oc-resp-mat" title={`Mat: ${node.matricula}`}>Mat: {node.matricula}</div>
            </div>
          </div>
        )}
        {showSensitive && (
          <div className="oc-badges">
            <span className={`badge ${isApoio ? "badge-apoio" : "badge-sec"}`}>{isApoio ? "apoio" : node.tipo}</span>
            {emergencyCount > 0 && <span className="badge" style={{ background: "rgba(0,0,0,0.05)", color: "#ef4444", border: "2px solid #fbbf24", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "relative" }} title="Ativo de Emergência disponível"><Siren size={24} strokeWidth={3} fill="#ef4444" fillOpacity={0.1} style={{ transform: "scale(1.8)", transformOrigin: "center" }} /></span>}
            {assetCount > 0 && <span className="badge badge-out">{assetCount} ativos</span>}
          </div>
        )}
      </div>

      {/* Edit button */}
      {canEdit && (
        <button type="button" className="card-edit-btn" onClick={(e) => { e.stopPropagation(); onEditNode(node.id); }} title="Editar Caixinha">
          <Pencil size={10} />
        </button>
      )}
      {/* Add child button */}
      {canEdit && (
        <button type="button" className="add-btn" onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }} title="Adicionar Subordinado">
          <Plus size={12} />
        </button>
      )}

      {/* Collapse/expand single level */}
      {childCount > 0 && typeof onToggleCollapse === "function" && (
        <button
          className="coll-btn"
          onClick={(e) => {
            e.stopPropagation();
            const next = !collapsed;
            onToggleCollapse(next);
            if (!next && onExpand) onExpand(node.id);
          }}
          title={collapsed ? "Expandir pr\u00f3ximo n\u00edvel" : "Recolher"}
        >
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      )}

      {/* Expand ALL descendants button — only visible when collapsed and has children */}
      {childCount > 0 && collapsed && typeof onExpandAll === "function" && (
        <button
          className="expand-all-btn"
          onClick={(e) => {
            e.stopPropagation();
            onExpandAll(node.id);
          }}
          title="Expandir todos os n\u00edveis abaixo"
        >
          <ChevronsDown size={12} />
        </button>
      )}
    </div>
  );
};

/* ─€─€─€ Apoio Branch (recursive) ─€─€─€ */
const ApoioBranch = ({
  node, getChildren, personMap, selectedId, onSelect, onAddChild, onEditNode,
  onShowPerson, onExpand, onExpandAll, canEdit, isProtected, directAssetCount, directEmergencyCount, parentHex, depth = 0, expandedSet, onOpenDashboard
}) => {
  const [collapsed, setCollapsed] = useState(depth >= 1);
  const childCh = getChildren(node.id);
  const nodeColor = computeNodeColor(node, parentHex);
  const connColor = connectorColor(nodeColor.baseHex);

  useEffect(() => {
    if (expandedSet?.has(node.id)) setCollapsed(false);
  }, [expandedSet, node.id]);

  return (
    <li className="apoio-card-box">
      <div style={{ position: "relative" }}>
        <OrgNodeCard
          node={{ ...node, isDark: nodeColor.isDark }}
          person={personMap?.get(node.personId)}
          selected={selectedId === node.id}
          childCount={childCh.length}
          assetCount={directAssetCount(node.id)}
          emergencyCount={directEmergencyCount(node.id)}
          onSelect={onSelect} onAddChild={onAddChild} onEditNode={onEditNode}
          onShowPerson={onShowPerson} canEdit={canEdit} isProtected={isProtected}
          bgColor={nodeColor.bg} borderColor={nodeColor.baseHex}
          collapsed={collapsed} onToggleCollapse={setCollapsed}
          onExpand={onExpand} onExpandAll={onExpandAll} onOpenDashboard={onOpenDashboard}
        />
      </div>
      {!collapsed && childCh.length > 0 && (
        <ul className="tree tree-apoio" style={{ "--connector-color": connColor }}>
          {childCh.map((child) => (
            <OrgBranch
              key={child.id} node={child} getChildren={getChildren} personMap={personMap}
              selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild}
              onEditNode={onEditNode} onShowPerson={onShowPerson}
              onExpand={onExpand} onExpandAll={onExpandAll}
              depth={depth + 1} canEdit={canEdit} isProtected={isProtected}
              directAssetCount={directAssetCount} 
              directEmergencyCount={directEmergencyCount}
              parentHex={nodeColor.hex}
              expandedSet={expandedSet} onOpenDashboard={onOpenDashboard}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ─€─€─€ Main Branch (recursive) ─€─€─€ */
const OrgBranch = ({
  node, getChildren, personMap, selectedId, onSelect, onAddChild, onEditNode,
  onExpand, onExpandAll, onShowPerson, directAssetCount, directEmergencyCount, canEdit, isProtected, parentHex,
  depth = 0, isFocusRoot, onReturnFromFocus, expandedSet, onOpenDashboard
}) => {
  const [collapsed, setCollapsed] = useState(depth >= 3
  );
  const allChildren = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const apoioChildren = useMemo(() => allChildren.filter((c) => c.subtipo === "apoio"), [allChildren]);
  const subChildren = useMemo(() => allChildren.filter((c) => c.subtipo !== "apoio"), [allChildren]);
  const nodeColor = computeNodeColor(node, parentHex);
  const connColor = connectorColor(nodeColor.baseHex);

  useEffect(() => {
    if (expandedSet?.has(node.id)) setCollapsed(false);
  }, [expandedSet, node.id]);

  return (
    <li className={selectedId === node.id ? "node-selected" : ""}>
      <div className="org-card-container">

        <OrgNodeCard
          node={{ ...node, isDark: nodeColor.isDark }}
          person={personMap?.get(node.personId)}
          selected={selectedId === node.id}
          childCount={allChildren.length}
          assetCount={directAssetCount(node.id)}
          emergencyCount={directEmergencyCount(node.id)}
          onSelect={onSelect} onAddChild={onAddChild} onEditNode={onEditNode}
          onShowPerson={onShowPerson} canEdit={canEdit} isProtected={isProtected}
          bgColor={nodeColor.bg} borderColor={nodeColor.baseHex}
          collapsed={collapsed} onToggleCollapse={setCollapsed}
          onExpand={onExpand} onExpandAll={onExpandAll} onOpenDashboard={onOpenDashboard}
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
                    key={child.id} node={child} getChildren={getChildren} personMap={personMap}
                    selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild}
                    onEditNode={onEditNode} onShowPerson={onShowPerson}
                    onExpand={onExpand} onExpandAll={onExpandAll}
                    depth={depth + 1} canEdit={canEdit} isProtected={isProtected}
                    directAssetCount={directAssetCount} 
                    directEmergencyCount={directEmergencyCount}
                    parentHex={nodeColor.hex}
                    expandedSet={expandedSet} onOpenDashboard={onOpenDashboard}
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
              key={child.id} node={child} getChildren={getChildren} personMap={personMap}
              selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild}
              onEditNode={onEditNode} onExpand={onExpand} onExpandAll={onExpandAll}
              onShowPerson={onShowPerson} depth={depth + 1}
              directAssetCount={directAssetCount} 
              directEmergencyCount={directEmergencyCount}
              canEdit={canEdit} isProtected={isProtected} parentHex={nodeColor.hex}
              expandedSet={expandedSet} onOpenDashboard={onOpenDashboard}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export { OrgBranch, OrgNodeCard };
