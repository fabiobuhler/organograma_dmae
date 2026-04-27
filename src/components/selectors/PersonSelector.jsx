import { useState } from "react";
import { X, Search } from "lucide-react";

/**
 * PersonSelector - Componente para seleção de pessoas com busca e validação de ocupação.
 */
export default function PersonSelector({
  label,
  valueId,
  persons,
  nodes = [],
  onSelect,
  onClear,
  onAddNew,
  currentNodeId = "",
  enforceNodeOccupation = true
}) {
  const [q, setQ] = useState("");
  const person = persons.find(p => p.id === valueId);

  const getOccupation = (pid) => {
    if (!enforceNodeOccupation) return null;
    return nodes.find((n) => n.personId === pid && n.id !== currentNodeId);
  };

  return (
    <div className="fg" style={{ position: "relative" }}>
      <label className="fl">{label}</label>
      {person ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--n50)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--n200)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{person.name}</div>
              <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {person.matricula} • {person.cargo}</div>
          </div>
          <button type="button" className="btn btn-outline btn-xs btn-icon" onClick={onClear} title="Remover"><X size={10} /></button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input 
            className="fi" 
            placeholder="Buscar por nome ou matrícula..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--n400)" }}>
            <Search size={12} />
          </div>
          {q.length > 1 && (
            <div className="search-drop" style={{ top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 100 }}>
              {(() => {
                const filtered = persons.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.matricula.includes(q)).slice(0, 10);
                return (
                  <>
                    {filtered.map(p => {
                      const occupiedNode = getOccupation(p.id);
                      const occupied = Boolean(occupiedNode);
                      return (
                          <button
                            key={p.id}
                            type="button"
                            className="search-item"
                            disabled={occupied}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (occupied) return;
                              onSelect(p.id);
                              setQ("");
                            }}
                            style={{
                              opacity: occupied ? 0.45 : 1,
                              cursor: occupied ? "not-allowed" : "pointer",
                              border: occupied ? "1px solid #fecaca" : "none"
                            }}
                          >
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                              <div style={{ fontSize: 9, color: "var(--n500)" }}>Mat: {p.matricula} • {p.cargo}</div>
                            </div>
                            {occupied && (
                              <span
                                style={{
                                  fontSize: 8,
                                  fontWeight: 800,
                                  color: "#ef4444",
                                  textTransform: "uppercase"
                                }}
                              >
                                Ocupado em {occupiedNode?.name || "outra caixa"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); setQ(""); onAddNew(q); }} className="search-item" style={{ color: "var(--primary)", justifyContent: "center", borderTop: "1px solid var(--n200)" }}>
                        <b>Pessoa não encontrada. Clique aqui para cadastrar &quot;{q}&quot;</b>
                      </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
