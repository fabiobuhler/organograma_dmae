export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function hasValidPhone(value) {
  const digits = onlyDigits(value);
  return digits.length >= 10;
}

export function normalizePhoneForWhatsApp(value) {
  const digits = onlyDigits(value);

  if (!digits) return "";

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildWhatsAppUrl(value) {
  const phone = normalizePhoneForWhatsApp(value);
  if (!phone) return "";
  return `https://wa.me/${phone}`;
}

export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
