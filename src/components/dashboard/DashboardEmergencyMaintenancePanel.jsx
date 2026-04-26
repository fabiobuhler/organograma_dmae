import { Siren } from "lucide-react";
import AssetBadges from "../assets/AssetBadges";
import AssetContactActions from "../assets/AssetContactActions";

/**
 * DashboardEmergencyMaintenancePanel.jsx
 * Painel visual de Ativos de Contingência Inoperantes.
 * Componente visual puro extraído da Fase 9C.
 */
export default function DashboardEmergencyMaintenancePanel({ list, nodes }) {
  return (
    <div className="bi-list-view">
      <div className="bi-alert-critical" style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: 12, borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#b91c1c" }}>
        <Siren size={20} />
        <div style={{ fontSize: 13, fontWeight: 700 }}>ATENÇÃO: Existem ativos estratégicos fora de operação nesta ramificação.</div>
      </div>

      <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ background: "var(--n50)" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>Ativo</th>
              <th style={{ padding: 12, textAlign: "left" }}>Tipo</th>
              <th style={{ padding: 12, textAlign: "left" }}>Unidade</th>
              <th style={{ padding: 12, textAlign: "left" }}>Responsável pela Contingência</th>
              <th style={{ padding: 12, textAlign: "left" }}>Telefone de Emergência</th>
              <th style={{ padding: 12, textAlign: "left" }}>Observação da Manutenção</th>
              <th style={{ padding: 12, textAlign: "center" }}>Desde</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? (
              list.map(a => (
                <tr key={a.id} style={{ borderTop: "1px solid var(--n100)" }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700, color: "#b91c1c" }}>{a.name}</div>
                  </td>
                  <td style={{ padding: 12 }}>{a.type || "—"}</td>
                  <td style={{ padding: 12 }}>{nodes.find(n => n.id === a.nodeId)?.name || "—"}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{a.contatoResponsavel || "—"}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{a.contatoAcionamento || "—"}</span>
                      {a.contatoAcionamento && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <AssetBadges asset={a} compact showText={false} />
                          <AssetContactActions phone={a.contatoAcionamento} responsible={a.contatoResponsavel} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 12, fontSize: 10 }}>{a.maintenanceNotes || "—"}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    {a.maintenanceSince ? new Date(a.maintenanceSince).toLocaleDateString('pt-BR') : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "var(--n400)" }}>Nenhum ativo de contingência em manutenção.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
