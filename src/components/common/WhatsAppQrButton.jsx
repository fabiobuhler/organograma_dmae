import React, { useState } from "react";
import { QrCode, X, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildWhatsAppUrl, hasValidPhone } from "../../utils/phone";

export default function WhatsAppQrButton({
  phone,
  label = "QR Code",
  title = "QR Code WhatsApp",
  responsible = ""
}) {
  const [open, setOpen] = useState(false);

  if (!hasValidPhone(phone)) return null;

  const whatsappUrl = buildWhatsAppUrl(phone);
  if (!whatsappUrl) return null;

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-xs whatsapp-qr-btn"
        title="Abrir QR Code do WhatsApp"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        style={{ marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <QrCode size={12} />
        {label}
      </button>

      {open && (
        <div className="modal-overlay" style={{ zIndex: 5400 }}>
          <div className="modal-content narrow whatsapp-qr-modal">
            <div className="modal-header">
              <h2>{title}</h2>
              <p>Escaneie o QR Code para abrir a conversa no WhatsApp.</p>

              <button
                type="button"
                className="detail-close"
                onClick={() => setOpen(false)}
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="whatsapp-qr-card">
                <QRCodeSVG
                  value={whatsappUrl}
                  size={220}
                  level="M"
                  includeMargin
                />

                <div className="whatsapp-qr-info">
                  {responsible && (
                    <div>
                      <strong>Responsável:</strong> {responsible}
                    </div>
                  )}

                  <div>
                    <strong>Telefone:</strong> {phone}
                  </div>
                </div>

                <a
                  className="btn btn-primary"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}
                >
                  <MessageCircle size={14} />
                  Abrir WhatsApp
                </a>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
