import {
  X, Siren, AlertTriangle, Car, Wrench, Briefcase,
  Pencil, Trash2, Image
} from "lucide-react";
import AssetContactActions from "./AssetContactActions";
import WhatsAppQrButton from "../common/WhatsAppQrButton";

/**
 * Componente de visualização detalhada de um ativo.
 * Extraído do App.jsx na Fase 5C.
 */
export default function AssetDetail({
  asset,
  nodes = [],
  canEdit = false,
  isProtected = false,
  onClose,
  onEdit,
  onDeleteRequest,
  setExpandedImage
}) {
  if (!asset) return null;

  const node = nodes.find(n => n.id === asset.nodeId);

  const assetIcon = (c) => {
    if (c === "veículo") return <Car size={12} />;
    if (c === "ferramenta") return <Wrench size={12} />;
    return <Briefcase size={12} />;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>

        <div className="modal-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {assetIcon(asset.category)} {asset.name}
            {asset.isEmergency && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #eab308", background: "#fff", boxShadow: "0 0 6px rgba(234, 179, 8, 0.4)" }} title="Contingência">
                <Siren size={12} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} style={{ transform: "scale(1.3)" }} />
              </div>
            )}
            {asset.isMaintenance && (
              <div className="badge-maintenance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "2px solid #d97706", background: "#fff", boxShadow: "0 0 6px rgba(217, 119, 6, 0.4)", color: "#d97706" }} title="Manutenção">
                <AlertTriangle size={12} strokeWidth={3} style={{ transform: "scale(1.3)" }} />
              </div>
            )}
          </h2>
          <p style={{ marginTop: 4 }}>{asset.category} • {asset.type}</p>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Photos Gallery */}
          {(() => {
            const assetPhotos = Array.isArray(asset?.photos) ? asset.photos.filter(Boolean) : [];
            if (assetPhotos.length === 0) return null;

            return (
              <div className="detail-section">
                <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--n600)", fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>
                  <Image size={14} />
                  Fotos do Ativo
                </h4>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 10,
                  marginTop: 4
                }}>
                  {assetPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setExpandedImage?.(photo)}
                      style={{
                        border: "1px solid var(--n200)",
                        borderRadius: 12,
                        padding: 0,
                        overflow: "hidden",
                        background: "#fff",
                        cursor: "zoom-in",
                        aspectRatio: "4 / 3"
                      }}
                      title="Clique para ampliar"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${index + 1} do ativo`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="asset-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="detail-group">
              <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Fabricante / Modelo</label>
              <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{asset.manufacturer || "---"} / {asset.model || "---"}</div>
            </div>
            <div className="detail-group">
              <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Ano / Placa</label>
              <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{asset.year || "---"} / {asset.plate || "---"}</div>
            </div>
            <div className="detail-group">
              <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Patrimônio / OS</label>
              <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{asset.patrimonio || "---"} / {asset.os || "---"}</div>
            </div>
            <div className="detail-group">
              <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Localização (Unidade)</label>
              <div className="detail-val" style={{ fontWeight: 600, fontSize: 13 }}>{node?.name || "---"}</div>
            </div>
          </div>

          {asset.isEmergency && (
            <div className="asset-detail-emergency-box">
              <h3>
                <Siren size={16} />
                Acionamento de Contingência
              </h3>

              <p>
                <strong>Responsável pela Contingência:</strong>{" "}
                {asset.contatoResponsavel || "Não informado"}
              </p>

              <p>
                <strong>Telefone de Emergência / Acionamento:</strong>{" "}
                {asset.contatoAcionamento || "Não informado"}
                {asset.contatoAcionamento && (
                  <AssetContactActions phone={asset.contatoAcionamento} responsible={asset.contatoResponsavel} />
                )}
              </p>

              <p>
                <strong>Contato Geral:</strong>{" "}
                {asset.contatoFone || "Não informado"}
                {asset.contatoFone && (
                  <WhatsAppQrButton
                    phone={asset.contatoFone}
                    label="QR Code"
                    title="QR Code para Contato Geral"
                  />
                )}
              </p>
            </div>
          )}

          {(isProtected || canEdit) && asset.tipoVinculo === "Contratado" && (
            <div style={{ background: "#fefce8", padding: 16, borderRadius: 12, border: "1px solid #fde047" }}>
              <h4 style={{ fontSize: 11, color: "#854d0e", marginBottom: 12, fontWeight: 800 }}>DADOS DO CONTRATO</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="fl" style={{ fontSize: 8 }}>Processo SEI</label>
                  <div className="detail-val" style={{ fontWeight: 700, fontSize: 12 }}>{asset.numeroContrato}</div>
                </div>
                <div>
                  <label className="fl" style={{ fontSize: 8 }}>Empresa</label>
                  <div className="detail-val" style={{ fontSize: 12 }}>{asset.empresaContratada}</div>
                </div>
                <div>
                  <label className="fl" style={{ fontSize: 8 }}>Fiscal Titular</label>
                  <div className="detail-val" style={{ fontSize: 12 }}>{asset.fiscalContrato}</div>
                </div>
                <div>
                  <label className="fl" style={{ fontSize: 8 }}>Contato Empresa</label>
                  <div className="detail-val" style={{ fontSize: 11 }}>{asset.contatoEmpresa || "---"}</div>
                </div>
                <div>
                  <label className="fl" style={{ fontSize: 8 }}>Responsável Direto</label>
                  <div className="detail-val" style={{ fontSize: 11 }}>{asset.responsavelDireto || "---"}</div>
                </div>
              </div>
            </div>
          )}

          {asset.notes && (
            <div className="detail-group">
              <label className="fl" style={{ fontSize: 9, textTransform: "uppercase", color: "var(--n500)" }}>Observações</label>
              <div className="detail-val" style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{asset.notes}</div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-xs" onClick={onClose}>Fechar</button>
            {canEdit && (
              <button className="btn btn-outline btn-xs" style={{ color: "#ef4444" }} onClick={() => onDeleteRequest?.(asset)}>
                <Trash2 size={12} /> Excluir
              </button>
            )}
          </div>
          {canEdit && (
            <button className="btn btn-primary btn-xs" onClick={() => onEdit?.(asset)}>
              <Pencil size={12} /> Editar Cadastro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
