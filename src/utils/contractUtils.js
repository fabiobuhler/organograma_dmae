/**
 * Determina o status de um contrato baseado na data de término.
 * @param {Object} c Objeto do contrato
 * @returns {string} 'active' | 'expiring' | 'expired'
 */
export function getContractStatus(c) {
  if (!c.dataTermino) return "active";
  const end = new Date(c.dataTermino + "T00:00:00");
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
