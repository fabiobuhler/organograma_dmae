import { ChevronLeft, PieChart, FileText, Download } from "lucide-react";

/**
 * DashboardHeader.jsx
 * Cabeçalho do Dashboard de Governança e BI.
 * Componente visual puro extraído da Fase 9C.
 */
export default function DashboardHeader({
  dashboardView,
  setDashboardView,
  dNodeName,
  subUnitsCount,
  onExportExcel,
  onExportPdf
}) {
  return (
    <div className="modal-header bi-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {dashboardView !== "summary" ? (
          <button className="btn btn-outline btn-icon btn-sm no-print" onClick={() => setDashboardView("summary")} title="Voltar para Resumo">
            <ChevronLeft size={18} />
          </button>
        ) : (
          <PieChart size={28} color="var(--p600)" />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            {dashboardView === "emergencyMaintenanceAssets" ? "Ativos de Contingência Inoperantes" :
              dashboardView === "allAssets" ? "Inventário Geral de Ativos" :
              dashboardView === "emergencyAssets" ? "Inventário de Contingência" :
              "Dashboard de Governança e BI"}
          </h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
            Unidade: <b>{dNodeName}</b> {subUnitsCount > 0 && `(+ ${subUnitsCount} subunidades)`}
          </p>
        </div>
      </div>
      <div className="bi-header-actions no-print" style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-outline btn-xs" onClick={onExportExcel}><FileText size={14} /> Exportar Excel</button>
        <button className="btn btn-primary btn-xs" onClick={onExportPdf}><Download size={14} /> Exportar PDF</button>
      </div>
    </div>
  );
}
