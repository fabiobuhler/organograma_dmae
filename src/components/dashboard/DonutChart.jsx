/**
 * DonutChart.jsx
 * Donut chart visual para status de contratos no Dashboard BI.
 * Componente visual puro — recebe stats calculadas via props.
 * Extraído do App.jsx na Fase 9A.
 */
export default function DonutChart({ stats, title }) {
  return (
    <div className="bi-chart-box">
      <div className="bi-chart-container">
        <div className="bi-donut" style={{ background: stats.pieCss }}>
          <div className="bi-donut-hole" />
        </div>
        <div className="bi-total-abs">{stats.total}</div>
      </div>
      <div className="bi-chart-info">
        <h4>{title}</h4>
        <div className="bi-legend-item"><span className="dot" style={{ background: "#10b981" }} /> Ativos: <b>{stats.active}</b></div>
        <div className="bi-legend-item"><span className="dot" style={{ background: "#f97316" }} /> A Vencer: <b>{stats.expiring}</b></div>
        <div className="bi-legend-item"><span className="dot" style={{ background: "#ef4444" }} /> Vencidos: <b>{stats.expired}</b></div>
      </div>
    </div>
  );
}
