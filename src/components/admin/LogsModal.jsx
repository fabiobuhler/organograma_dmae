import { X, FileText, Download } from "lucide-react";

function formatLogDetails(log) {
  if (!log) return "—";
  if (log.target) return log.target;
  if (log.entity_name) return log.entity_name;
  if (log.details?.target) return log.details.target;
  if (log.details?.name) return log.details.name;
  if (log.details?.nome) return log.details.nome;
  if (log.entity_type) return log.entity_type;
  return "—";
}
export default function LogsModal({
  open,
  onClose,
  logFilterStart,
  setLogFilterStart,
  logFilterEnd,
  setLogFilterEnd,
  filteredLogs,
  exportLogsCsv,
  generateDirectPdf,
  exportLogsPdf
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content wide">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div><h2 style={{ lineHeight: 1.2 }}>Histórico de Modificações</h2><p>Registro de auditoria.</p></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--n50)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--n200)" }}>
              <label className="fl" style={{ margin: 0 }}>De:</label><input className="fi" type="date" value={logFilterStart} onChange={(e) => setLogFilterStart(e.target.value)} style={{ padding: "4px 8px", height: 28, width: 110 }} />
              <label className="fl" style={{ margin: 0, marginLeft: 4 }}>Até:</label><input className="fi" type="date" value={logFilterEnd} onChange={(e) => setLogFilterEnd(e.target.value)} style={{ padding: "4px 8px", height: 28, width: 110 }} />
            </div>
            {filteredLogs.length > 0 && (
              <>
                <button className="btn btn-outline btn-xs" onClick={() => exportLogsCsv(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }} /> CSV</button>
                <button className="btn btn-outline btn-xs" onClick={() => generateDirectPdf(filteredLogs)} style={{ height: 32 }}><Download size={12} style={{ marginRight: 4 }} /> Baixar PDF</button>
                <button className="btn btn-outline btn-xs" onClick={() => exportLogsPdf(filteredLogs)} style={{ height: 32 }}><FileText size={12} style={{ marginRight: 4 }} /> Imprimir</button>
              </>
            )}
          </div>
        </div>
        <div className="modal-body">
          {filteredLogs.length === 0 ? <p style={{ color: "var(--n500)" }}>Nenhuma modificação registrada neste período.</p> : (
            <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--n200)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--n100)" }}>
                  <tr><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Data</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Usuário</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Ação</th><th style={{ padding: "8px 12px", borderBottom: "1px solid var(--n200)" }}>Detalhes</th></tr>
                </thead>
                <tbody>
                  {filteredLogs.map(lg => (
                    <tr key={lg.id} style={{ borderBottom: "1px solid var(--n100)" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{lg.timestamp}</td>
                      <td style={{ padding: "8px 12px" }}><b>{lg.user}</b></td>
                      <td style={{ padding: "8px 12px" }}><span className="badge badge-sec" style={{ fontSize: 10, fontWeight: 700 }}>{lg.action}</span></td>
                      <td style={{ padding: "8px 12px", width: "100%" }}>{formatLogDetails(lg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-xs" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
