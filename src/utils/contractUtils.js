/**
 * Obtém a data de término efetiva do contrato, considerando o último aditivo válido.
 * Regra: se houver aditivos com data final válida, usar a data final mais recente.
 * Caso contrário, usar a data final do contrato principal.
 * @param {Object} c Objeto do contrato
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function getContractEffectiveEndDate(c) {
  let effectiveEnd = c.dataTermino || "";

  if (Array.isArray(c.aditivos) && c.aditivos.length > 0) {
    c.aditivos.forEach(ad => {
      if (ad.aditivoTermino && (!effectiveEnd || ad.aditivoTermino > effectiveEnd)) {
        effectiveEnd = ad.aditivoTermino;
      }
    });
  }

  return effectiveEnd;
}

/**
 * Determina o status de um contrato baseado na data de término efetiva.
 * @param {Object} c Objeto do contrato
 * @returns {string} 'active' | 'expiring' | 'expired'
 */
export function getContractStatus(c) {
  const dataFimEfetiva = getContractEffectiveEndDate(c);
  if (!dataFimEfetiva) return "active";

  const end = new Date(dataFimEfetiva + "T00:00:00");
  const diffDays = (end - new Date()) / (1000 * 3600 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "active";
}

/**
 * Calcula estatísticas de status para uma lista de contratos.
 * @param {Array} contractList Lista de contratos
 * @returns {Object} Objeto com contadores e CSS para gráfico de rosca
 */
export function getDashboardStats(contractList) {
  let active = 0, expiring = 0, expired = 0;
  contractList.forEach(c => {
    const status = getContractStatus(c);
    if (status === "expired") expired++;
    else if (status === "expiring") expiring++;
    else active++;
  });
  const total = active + expiring + expired;
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const expiringPct = total > 0 ? (expiring / total) * 100 : 0;

  const pieCss = total > 0
    ? `conic-gradient(#10b981 0% ${activePct}%, #f97316 ${activePct}% ${activePct + expiringPct}%, #ef4444 ${activePct + expiringPct}% 100%)`
    : `conic-gradient(#e5e7eb 0% 100%)`;

  return { active, expiring, expired, total, pieCss };
}

/**
 * Normaliza um objeto de cargo (gestor/fiscal).
 */
export function cleanRole(role) {
  return {
    titularId: role?.titularId || "",
    suplenteId: role?.suplenteId || ""
  };
}

/**
 * Normaliza um array de objetos de cargo.
 */
export function cleanRoleArray(list) {
  return (Array.isArray(list) ? list : [])
    .map(cleanRole)
    .filter((item) => item.titularId || item.suplenteId);
}
