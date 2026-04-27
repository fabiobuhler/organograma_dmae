import { useMemo } from "react";
import {
  ChevronDown, ChevronRight, ChevronsDown,
  Siren, AlertTriangle
} from "lucide-react";
import { computeNodeColor, getDescendantIds, initials } from "../../utils/helpers";

/**
 * ListNode - Componente recursivo para visualização do organograma em lista.
 */
export default function ListNode({
  node,
  getChildren,
  onSelect,
  directEmergencyCount,
  directMaintenanceCount,
  directEmergencyMaintenanceCount,
  depth = 0,
  isProtected,
  parentHex,
  expandedSet,
  onToggleExpandAll,
  onToggle
}) {
  const nodeColor = computeNodeColor(node, parentHex);

  // O estado 'open' agora é derivado ou do local (se quiser manter agilidade)
  // ou preferencialmente do expandedSet para garantir WYSIWYG no export
  const open = expandedSet?.has(node.id) ?? (depth < 2);

  const ch = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const hasChildren = ch.length > 0;
  const isApoio = node.subtipo === "apoio";

  const emergencyCount = directEmergencyCount(node.id);
  const maintenanceCount = directMaintenanceCount ? directMaintenanceCount(node.id) : 0;
  const emergencyMaintenanceCount = directEmergencyMaintenanceCount ? directEmergencyMaintenanceCount(node.id) : 0;
  const availableEmergencyCount = emergencyCount - emergencyMaintenanceCount;

  return (
    <div className={`list-node ${open ? "expanded" : ""}`} style={{
      marginLeft: depth > 0 ? 16 : 0,
      borderLeft: `3px solid ${nodeColor.baseHex}`,
      paddingLeft: 8,
      marginBottom: 2
    }}>
      <div className="list-node-header" onClick={() => onSelect(node.id)}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {hasChildren ? (
            <button className="list-collapse-icon" onClick={(e) => { e.stopPropagation(); onToggle?.(node.id); }} title={open ? "Recolher" : "Expandir"}>
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : <div style={{ width: 20 }} />}

          {hasChildren && !open && (
             <button className="list-collapse-icon" style={{ opacity: 0.6 }} onClick={(e) => {
               e.stopPropagation();
               const ids = getDescendantIds(node.id, getChildren);
               onToggleExpandAll(ids);
             }} title="Expandir Tudo Abaixo">
               <ChevronsDown size={12} />
             </button>
          )}
        </div>
        <div className="av" style={{ width: 28, height: 28, minWidth: 28, borderRadius: 6, cursor: node.foto ? "zoom-in" : "default" }} onClick={(e) => { if (node.foto) { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-photo', { detail: node.foto })); } }}>
          {node.foto ? <img src={node.foto} alt="" /> : <span className="av-fb" style={{ fontSize: 9 }}>{initials(node.name)}</span>}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{node.name}</div>
          <div style={{ fontSize: 10, color: "var(--n500)" }}>
            {node.description && <span style={{ display: "block", marginBottom: 2 }}>{node.description}</span>}
            <span style={{ opacity: 0.8 }}>{node.responsavel || node.cargo}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {isProtected && availableEmergencyCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)", flexShrink: 0 }} title="Ativos de Contingência disponíveis">
              <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
            </div>
          )}
          {isProtected && maintenanceCount > 0 && (
            <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", flexShrink: 0, color: "#d97706" }} title="Ativos em Manutenção/Inoperantes">
              <AlertTriangle size={12} strokeWidth={3} />
            </div>
          )}
          {isProtected && emergencyMaintenanceCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #ef4444", background: "#fee2e2", boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)", flexShrink: 0 }} title="Contingência Inoperante">
              <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.2} />
            </div>
          )}
          <span className={`badge ${isApoio ? "badge-apoio" : "badge-sec"}`} style={{ flexShrink: 0 }}>
            {isApoio ? "apoio" : node.tipo}
          </span>
        </div>
        {hasChildren && <span className="badge badge-out">{ch.length}</span>}
      </div>
      {open && hasChildren && (
        <div className="list-children">
          {ch.map((c) => (
            <ListNode
              key={c.id}
              node={c}
              getChildren={getChildren}
              onSelect={onSelect}
              directEmergencyCount={directEmergencyCount}
              directMaintenanceCount={directMaintenanceCount}
              directEmergencyMaintenanceCount={directEmergencyMaintenanceCount}
              depth={depth + 1}
              isProtected={isProtected}
              parentHex={nodeColor.baseHex}
              expandedSet={expandedSet}
              onToggleExpandAll={onToggleExpandAll}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
