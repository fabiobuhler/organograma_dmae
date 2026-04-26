import DonutChart from "./DonutChart";

/**
 * DashboardContractStatusPanel.jsx
 * Painel visual dos donuts/status de contratos.
 * Componente visual puro extraído da Fase 9C.
 */
export default function DashboardContractStatusPanel({ dStats, cStats }) {
  return (
    <div className="bi-row" style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid var(--n200)" }}>
        <h3 className="bi-section-title" style={{ marginBottom: 15, fontSize: 14 }}>Status dos Contratos (Diretos)</h3>
        <DonutChart stats={dStats} title="Foco: Unidade Atual" />
      </div>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid var(--n200)" }}>
        <h3 className="bi-section-title" style={{ marginBottom: 15, fontSize: 14 }}>Status dos Contratos (Subordinados)</h3>
        <DonutChart stats={cStats} title="Foco: Hierarquia Abaixo" />
      </div>
    </div>
  );
}
