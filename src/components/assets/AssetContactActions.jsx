import WhatsAppButton from "../common/WhatsAppButton";
import WhatsAppQrButton from "../common/WhatsAppQrButton";

/**
 * AssetContactActions - Par WhatsApp + QR Code para contato de ativo.
 * Usado em listas e detalhes de ativos de contingência.
 */
export default function AssetContactActions({
  phone,
  responsible,
  label = "",
  qrLabel = "",
  title = "QR Code para Acionamento de Contingência",
  className = ""
}) {
  if (!phone) return null;

  return (
    <span className={`asset-contact-actions${className ? " " + className : ""}`}>
      <WhatsAppButton phone={phone} label={label} />
      <WhatsAppQrButton
        phone={phone}
        responsible={responsible}
        label={qrLabel}
        title={title}
      />
    </span>
  );
}
