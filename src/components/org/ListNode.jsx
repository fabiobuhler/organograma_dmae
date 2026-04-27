import { useState, useEffect, useMemo } from "react";
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
  depth = 0, 
  isProtected, 
  parentHex, 
  expandedSet, 
  onToggleExpandAll 
}) {
  const nodeColor = computeNodeColor(node, parentHex);
  const [open, setOpen] = useState(depth < 2);

  useEffect(() => {
    if (expandedSet?.has(node.id)) setOpen(true);
  }, [expandedSet, node.id]);

  const ch = useMemo(() => getChildren(node.id), [node.id, getChildren]);
  const hasChildren = ch.length > 0;
  const isApoio = node.subtipo === "apoio";
  const emergencyCount = directEmergencyCount(node.id);

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
            <button className="list-collapse-icon" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} title={open ? "Recolher" : "Expandir"}>
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
          {isProtected && emergencyCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)", flexShrink: 0 }} title="Possui ativos de Contingência">
              <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
            </div>
          )}
          {isProtected && directMaintenanceCount && directMaintenanceCount(node.id) > 0 && (
            <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", flexShrink: 0, color: "#d97706" }} title="Possui ativos em Manutenção">
              <AlertTriangle size={12} strokeWidth={3} />
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
              depth={depth + 1} 
              isProtected={isProtected} 
              parentHex={nodeColor.baseHex} 
              expandedSet={expandedSet} 
              onToggleExpandAll={onToggleExpandAll} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
