/**
 * Agrupa ativos contratados por empresa e por número de contrato.
 * Útil para renderização de relatórios e dashboards.
 * @param {Array} list Lista de ativos
 * @returns {Object} { [empresa]: { [contrato]: [ativos] } }
 */
export function groupAssetsByContract(list) {
  const byEmpresa = {};
  list.forEach(a => {
    // Apenas ativos contratados são agrupados desta forma
    if (a.tipoVinculo !== "Contratado") return;

    const emp = a.empresaContratada || "Empresa não informada";
    const ctt = a.numeroContrato    || "Contrato não informado";
    
    if (!byEmpresa[emp]) byEmpresa[emp] = {};
    if (!byEmpresa[emp][ctt]) byEmpresa[emp][ctt] = [];
    byEmpresa[emp][ctt].push(a);
  });
  return byEmpresa;
}

/**
 * Retorna o status de um ativo baseado em flags de manutenção e contingência.
 * @param {Object} a Objeto do ativo
 * @returns {string} 'maintenance' | 'emergency' | 'normal'
 */
export function getAssetStatus(a) {
  if (a.isMaintenance) return "maintenance";
  if (a.isEmergency) return "emergency";
  return "normal";
}

/**
 * Verifica se o ativo é estratégico para contingência.
 */
export function isEmergencyAsset(a) {
  return Boolean(a?.isEmergency);
}

/**
 * Normaliza um objeto de ativo para garantir campos básicos.
 */
export function normalizeAsset(a) {
  return {
    ...a,
    tipoVinculo: a.tipoVinculo || "Próprio",
    isEmergency: Boolean(a.isEmergency),
    isMaintenance: Boolean(a.isMaintenance)
  };
}
