import React from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, hasValidPhone } from "../../utils/phone";

export default function WhatsAppButton({ phone, label = "WhatsApp" }) {
  if (!hasValidPhone(phone)) return null;

  const whatsappUrl = buildWhatsAppUrl(phone);
  if (!whatsappUrl) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline btn-xs whatsapp-btn"
      title="Abrir no WhatsApp"
      onClick={(event) => event.stopPropagation()}
      style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle" }}
    >
      <MessageCircle size={12} />
      {label}
    </a>
  );
}
