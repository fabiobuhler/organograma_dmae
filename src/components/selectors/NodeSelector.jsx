import React, { useState, useEffect } from "react";

/**
 * NodeSelector - Typeahead para seleção de Unidade Vinculada (Estrutura)
 */
export default function NodeSelector({ value, nodes, onChange }) {
  const currentNode = nodes.find(n => n.id === value);
  const [search, setSearch] = useState(currentNode?.name || "");
  const [open, setOpen] = useState(false);

  const filtered = nodes
    .filter(n => n.tipo === "estrutura")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .filter(n => !search || n.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 12);

  useEffect(() => {
    const node = nodes.find(n => n.id === value);
    if (node && !open) setSearch(node.name);
    if (!value && !open) setSearch("");
  }, [value, nodes, open]);

  return (
    <div style={{ position: "relative" }}>
      <input
        className="fi"
        value={search}
        placeholder="Buscar unidade..."
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--n200)", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", zIndex: 200, maxHeight: 220, overflowY: "auto" }}>
          <button type="button" onMouseDown={() => { onChange(""); setSearch(""); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "var(--n400)", borderBottom: "1px solid var(--n100)" }}>
            (Nenhuma)
          </button>
          {filtered.map(n => (
            <button key={n.id} type="button"
              onMouseDown={() => { onChange(n.id); setSearch(n.name); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: value === n.id ? "var(--n100)" : "none", cursor: "pointer", fontSize: 12, fontWeight: value === n.id ? 700 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--n50)"}
              onMouseLeave={e => e.currentTarget.style.background = value === n.id ? "var(--n100)" : "none"}
            >{n.name}</button>
          ))}
          {filtered.length === 0 && <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--n400)" }}>Nenhuma unidade encontrada</div>}
        </div>
      )}
    </div>
  );
}
