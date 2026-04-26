/**
 * Utilitários para validação e máscara de CNPJ.
 */

export function onlyDigitsCnpj(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function maskCnpj(value = "") {
  const digits = onlyDigitsCnpj(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function isValidCnpj(value = "") {
  const cnpj = onlyDigitsCnpj(value);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base) => {
    let size = base.length;
    let numbers = base;
    let pos = size - 7;
    let sum = 0;

    for (let i = size; i >= 1; i -= 1) {
      sum += Number(numbers.charAt(size - i)) * pos;
      pos -= 1;
      if (pos < 2) pos = 9;
    }

    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return String(result);
  };

  const base12 = cnpj.slice(0, 12);
  const digit1 = calcDigit(base12);
  const digit2 = calcDigit(base12 + digit1);

  return cnpj === base12 + digit1 + digit2;
}

export function getCnpjValidationMessage(value = "") {
  const digits = onlyDigitsCnpj(value);

  if (!digits) return "";
  if (digits.length < 14) return "CNPJ incompleto.";
  if (!isValidCnpj(value)) return "CNPJ inválido.";
  return "";
}
