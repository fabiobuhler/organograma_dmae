import { Package, AlertCircle } from "lucide-react";
import AssetBadges from "../assets/AssetBadges";
import AssetContactActions from "../assets/AssetContactActions";
import { getContractStatus } from "../../utils/contractUtils";

/**
 * DashboardAssetTable.jsx
 * Tabela de ativos reutilizável no Dashboard de Governança e BI.
 */
export default function DashboardAssetTable({ list, title, nodeMap, contracts = [] }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <h3 style={{ fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "var(--n700)" }}>
        <Package size={16} /> {title} ({list.length})
      </h3>
      <div style={{ border: "1px solid var(--n200)", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead style={{ background: "var(--n50)" }}>
            <tr>
              <th style={{ padding: 10, textAlign: "left" }}>Ativo</th>
              <th style={{ padding: 10, textAlign: "left" }}>Categoria / Modelo</th>
              <th style={{ padding: 10, textAlign: "left" }}>Unidade</th>
              <th style={{ padding: 10, textAlign: "left" }}>Patrimônio / Placa</th>
              <th style={{ padding: 10, textAlign: "left" }}>Contingência</th>
              <th style={{ padding: 10, textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? list.map(a => {
              // Verifica se o contrato existe e seu status
              const contract = contracts.find(c => c.sei === a.numeroContrato);
              const isContractMissing = a.tipoVinculo === "Contratado" && a.numeroContrato && !contract;
              const isContractExpired = contract && getContractStatus(contract) === "expired";
              const isDiscontinued = isContractMissing || isContractExpired;

              const rowStyle = isDiscontinued ? { textDecoration: "line-through", opacity: 0.6, background: "#fef2f2" } : {};

              return (
                <tr key={a.id} style={{ borderTop: "1px solid var(--n100)", ...rowStyle }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>{a.name}</div>
                    {a.tipoVinculo === "Contratado" && (
                      <div style={{ fontSize: 9, color: isDiscontinued ? "#ef4444" : "#0369a1", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        {isContractMissing ? (
                          <span style={{ border: "1px solid #ef4444", padding: "1px 4px", borderRadius: 4, background: "#fee2e2", textDecoration: "none" }}>
                            contrato descontinuado
                          </span>
                        ) : (
                          <>
                            {a.empresaContratada || "Contratado"}
                            {isContractExpired && (
                              <span title="Fora de operação por contrato vencido" style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#fee2e2", color: "#ef4444", padding: "1px 4px", borderRadius: 4, textDecoration: "none" }}>
                                <AlertCircle size={10} /> Contrato vencido
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    {a.category || "—"} / {a.model || "—"}
                  </td>
                  <td style={{ padding: 10 }}>{nodeMap?.get(a.nodeId)?.name || "—"}</td>
                  <td style={{ padding: 10 }}>
                    {a.patrimonio || "—"} / {a.plate || "—"}
                  </td>
                  <td style={{ padding: 10 }}>
                    {a.isEmergency ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                        <AssetBadges asset={a} compact showText={false} />
                        <AssetContactActions phone={a.contatoAcionamento} responsible={a.contatoResponsavel} />
                      </div>
                    ) : <span style={{ color: "var(--n400)" }}>Não</span>}
                  </td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    {isDiscontinued ? (
                      <span className="badge badge-danger" style={{ fontSize: 9, padding: "2px 6px", textDecoration: "none" }}>Indisponível</span>
                    ) : a.isMaintenance ? (
                      <span className="badge badge-danger" style={{ fontSize: 9, padding: "2px 6px" }}>Em Manutenção</span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 6px" }}>Operacional</span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--n400)" }}>Nenhum ativo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
