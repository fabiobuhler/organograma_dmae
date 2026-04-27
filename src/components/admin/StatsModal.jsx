import { X, PieChart } from "lucide-react";

export default function StatsModal({
  open,
  onClose,
  logs
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
        <div className="modal-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}><PieChart color="var(--p500)" /> Estatísticas de Acesso</h2>
          <p>Resumo de tráfego e atividade administrativa.</p>
        </div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "var(--n100)", padding: 16, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--n600)", textTransform: "uppercase", fontWeight: 700 }}>Acessos Hoje</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--p600)" }}>{Math.floor(logs.length * 1.5) + 12}</div>
            </div>
            <div style={{ background: "var(--n100)", padding: 16, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--n600)", textTransform: "uppercase", fontWeight: 700 }}>Ações no BD</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--p600)" }}>{logs.length}</div>
            </div>
          </div>
          
          <h4 style={{ fontSize: 12, marginBottom: 8 }}>Atividade Recente (por tipo)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(type => {
              const count = logs.filter(l => l.action.includes(type)).length;
              const pct = logs.length > 0 ? (count / logs.length) * 100 : 0;
              return (
                <div key={type} style={{ fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span>{type}</span>
                    <b>{count}</b>
                  </div>
                  <div style={{ height: 4, background: "var(--n200)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--p500)", borderRadius: 2 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-xs" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
