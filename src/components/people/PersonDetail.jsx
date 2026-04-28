import { 
  X, Mail, MapPin, ShieldCheck, Network
} from "lucide-react";
import WhatsAppButton from "../common/WhatsAppButton";
import WhatsAppQrButton from "../common/WhatsAppQrButton";
import { initials } from "../../utils/helpers";

/**
 * Componente de visualização detalhada de uma pessoa.
 * Extraído do App.jsx na Fase 5A.
 */
export default function PersonDetail({
  person,
  nodes = [],
  contracts = [],
  isProtected = false,
  canEdit = false,
  onClose,
  onEdit,
  onSelectNode,
  resolveAddress
}) {
  if (!person) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 5600 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content wide">
        <button className="modal-close" onClick={onClose}><X size={12} /></button>
        
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="av av-lg" style={{ width: 64, height: 64, minWidth: 64 }}>
              {person.foto ? (
                <img src={person.foto} alt="" />
              ) : (
                <span className="av-fb" style={{ fontSize: 20 }}>{initials(person.name)}</span>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, lineHeight: 1.2 }}>{person.name}</h2>
              <p style={{ margin: 0, color: "var(--n500)" }}>{person.cargo} • Matrícula {person.matricula}</p>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-grid" style={{ padding: 0, gridTemplateColumns: "1fr 1fr 1fr" }}>
            {(isProtected || canEdit) ? (
              <>
                <div className="dg-item">
                  <div className="dg-label">E-mail</div>
                  <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.email || "—"}</span>
                    {person.email && (
                      <a href={`mailto:${person.email}`} className="btn-icon-xs" title="Enviar E-mail">
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="dg-item">
                  <div className="dg-label">Telefone</div>
                  <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {person.telefone || "—"}
                    {person.telefone && (
                      <>
                        <WhatsAppButton phone={person.telefone} label="" />
                        <WhatsAppQrButton 
                          phone={person.telefone} 
                          responsible={person.name} 
                          label="" 
                          title="QR Code WhatsApp" 
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="dg-item"><div className="dg-label">Ramal</div><div className="dg-val">{person.ramal || "—"}</div></div>
                <div className="dg-item"><div className="dg-label">Regime</div><div className="dg-val">{person.regime || "—"}</div></div>
                <div className="dg-item"><div className="dg-label">Vínculo</div><div className="dg-val">{person.vinculo || "—"}</div></div>
                <div className="dg-item" style={{ gridColumn: "span 3" }}>
                  <div className="dg-label">Endereço de Lotação (Herdado da Caixa)</div>
                  <div className="dg-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(() => {
                      const pNode = nodes.find(n => n.personId === person.id);
                      const addr = resolveAddress ? resolveAddress(pNode?.id) : { lotacao: "Não definida", complemento: "" };
                      const full = `${addr.lotacao}${addr.complemento ? `, ${addr.complemento}` : ""}`;
                      return (
                        <>
                          <span style={{ fontSize: 11 }}>{full}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.lotacao)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-xs"
                            title="Ver no Google Maps"
                            style={{ padding: "1px 4px", minHeight: "auto", height: 18, display: "inline-flex", alignItems: "center" }}
                          >
                            <MapPin size={10} color="#ef4444" />
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="dg-item" style={{ gridColumn: "span 3", background: "var(--n50)", padding: 12, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--n600)" }}>
                  🔒 <b>Dados Privados</b>. Para visualizar e-mail, telefone e localização, faça login com sua matrícula.
                </div>
              </div>
            )}
          </div>

          {(isProtected || canEdit) && (
            <div className="asset-section" style={{ padding: 0, marginTop: 12 }}>
              <div className="asset-section-title"><ShieldCheck size={14} /> Contratos Vinculados (Gestor/Fiscal)</div>
              {(() => {
                const pContracts = contracts.filter(c =>
                  c.gestor.titularId === person.id || c.gestor.suplenteId === person.id ||
                  (c.fiscaisContrato || []).some(f => f.titularId === person.id || f.suplenteId === person.id) ||
                  (c.fiscaisServico || []).some(f => f.titularId === person.id || f.suplenteId === person.id)
                );
                return pContracts.length > 0 ? pContracts.map((c) => (
                  <div key={c.id} className="asset-mini" style={{ background: "var(--n50)" }}>
                    <div className="asset-mini-name">
                      {c.sei} 
                      <span className="badge badge-sec" style={{ marginLeft: "auto", fontSize: 9 }}>
                        {c.gestor.titularId === person.id || c.gestor.suplenteId === person.id ? "Gestor" :
                          (c.fiscaisContrato || []).some(f => f.titularId === person.id || f.suplenteId === person.id) ? "Fiscal Contrato" : "Fiscal Serviço"}
                      </span>
                    </div>
                    <div className="asset-mini-meta"><b>Objeto:</b> {c.objeto}</div>
                    <div className="asset-mini-meta"><b>Papel:</b> {
                      c.gestor.titularId === person.id ? "Titular (Gestor)" :
                        c.gestor.suplenteId === person.id ? "Suplente (Gestor)" :
                          (c.fiscaisContrato || []).some(f => f.titularId === person.id) ? "Titular (Fiscal Contrato)" :
                            (c.fiscaisContrato || []).some(f => f.suplenteId === person.id) ? "Suplente (Fiscal Contrato)" :
                              (c.fiscaisServico || []).some(f => f.titularId === person.id) ? "Titular (Fiscal Serviço)" :
                                "Suplente (Fiscal Serviço)"
                    }</div>
                  </div>
                )) : <p style={{ fontSize: 12, color: "var(--n400)" }}>Nenhum contrato vinculado.</p>;
              })()}
            </div>
          )}

          <div className="asset-section" style={{ padding: 0, marginTop: 12 }}>
            <div className="asset-section-title"><Network size={14} /> Atuação no Organograma</div>
            {nodes.filter(n => n.personId === person.id).map(n => (
              <div 
                key={n.id} 
                className="asset-mini" 
                style={{ cursor: "pointer" }} 
                onClick={() => onSelectNode && onSelectNode(n.id)}
              >
                <div className="asset-mini-name">{n.name}</div>
                <div className="asset-mini-meta"><b>Função:</b> {n.funcao || n.description || n.cargo || "—"}</div>
                {n.description && n.description !== n.name && n.description !== n.funcao && (
                  <div className="asset-mini-meta" style={{ opacity: 0.7 }}>{n.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {canEdit && !isProtected && (
              <button className="btn btn-outline btn-xs" onClick={() => onEdit && onEdit(person)}>Editar Dados</button>
            )}
          </div>
          <button className="btn btn-primary btn-xs" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
