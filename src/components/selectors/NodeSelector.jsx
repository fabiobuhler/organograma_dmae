import { useState, useEffect, useMemo } from "react";

/**
 * NodeSelector - Seletor hierárquico para Unidades (Estruturas)
 */
export default function NodeSelector({ value, nodes, onChange }) {
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  
  const currentNode = nodes.find(n => n.id === value);
  const [search, setSearch] = useState(currentNode?.name || "");
  const [open, setOpen] = useState(false);

  // Gera a lista hierárquica (Pre-order traversal) com caminhos completos
  const hierarchicalNodes = useMemo(() => {
    const structures = nodes.filter(n => n.tipo === "estrutura");
    const map = new Map();
    structures.forEach(s => {
      const k = s.parentId || "root";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });

    const result = [];
    const walk = (parentId, depth, pathArr = []) => {
      const children = map.get(parentId) || [];
      // Ordena alfabeticamente os irmãos
      children.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      
      children.forEach(node => {
        const currentPath = [...pathArr, node.name];
        result.push({ 
          ...node, 
          depth, 
          breadcrumb: pathArr.length > 0 ? pathArr.join(" > ") : "" 
        });
        walk(node.id, depth + 1, currentPath);
      });
    };

    walk("root", 0);
    return result;
  }, [nodes]);

  const filtered = hierarchicalNodes
    .filter(n => !search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.breadcrumb && n.breadcrumb.toLowerCase().includes(search.toLowerCase())))
    .slice(0, search ? 50 : 200);

  useEffect(() => {
    const node = nodes.find(n => n.id === value);
    if (node && !open) setSearch(node.name);
    if (!value && !open) setSearch("");
  }, [value, nodes, open]);

  return (
    <div className="node-selector" style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          className="fi"
          value={search}
          placeholder="Selecionar unidade superior..."
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          style={{ paddingRight: 30 }}
        />
        <div style={{ position: "absolute", right: 10, pointerEvents: "none", opacity: 0.5, fontSize: 10 }}>
          {open ? "▲" : "▼"}
        </div>
      </div>
      
      {open && (
        <div style={{ 
          position: "absolute", 
          top: "100%", 
          left: 0, 
          right: 0, 
          background: "#fff", 
          border: "1px solid var(--n200)", 
          borderRadius: 10, 
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)", 
          zIndex: 2000, 
          maxHeight: 300, 
          overflowY: "auto",
          marginTop: 4
        }}>
          <button type="button" onMouseDown={() => { onChange(""); setSearch(""); setOpen(false); }}
            style={{ 
              display: "block", 
              width: "100%", 
              textAlign: "left", 
              padding: "10px 12px", 
              border: "none", 
              background: "none", 
              cursor: "pointer", 
              fontSize: 11, 
              color: "var(--n500)", 
              borderBottom: "1px solid var(--n100)",
              fontStyle: "italic"
            }}>
            (Nenhuma - Tornar Raiz)
          </button>
          
          {filtered.map(n => (
            <button key={n.id} type="button"
              onMouseDown={() => { onChange(n.id); setSearch(n.name); setOpen(false); }}
              style={{ 
                display: "block", 
                width: "100%", 
                textAlign: "left", 
                padding: search ? "8px 12px" : `8px 12px 8px ${12 + (n.depth * 16)}px`, 
                border: "none", 
                background: value === n.id ? "var(--n100)" : "none", 
                cursor: "pointer", 
                fontSize: 12, 
                fontWeight: value === n.id ? 700 : 400,
                borderLeft: (!search && n.depth > 0) ? "1px solid var(--n100)" : "none",
                marginLeft: (!search && n.depth > 0) ? 8 : 0,
                transition: "background 0.1s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--n50)"}
              onMouseLeave={e => e.currentTarget.style.background = value === n.id ? "var(--n100)" : "none"}
            >
              {!search && <span style={{ opacity: 0.4, marginRight: 6 }}>{n.depth > 0 ? "└─" : "•"}</span>}
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700 }}>{n.name}</span>
                  {n.description && <span style={{ fontSize: 10, color: "var(--n400)", fontWeight: 400 }}>— {n.description}</span>}
                </div>
                {n.breadcrumb && (
                   <div style={{ fontSize: 9, color: "var(--n400)", marginTop: 1, opacity: 0.8 }}>
                     {n.breadcrumb}
                   </div>
                )}
              </div>
            </button>
          ))}
          
          {filtered.length === 0 && (
            <div style={{ padding: "12px", fontSize: 12, color: "var(--n400)", textAlign: "center" }}>
              Nenhuma unidade encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
