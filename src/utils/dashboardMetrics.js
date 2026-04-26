/**
 * dashboardMetrics.js
 * Funções puras para cálculos e agregações do Dashboard/BI.
 * Extraído na Fase 9B.
 */

/**
 * Retorna as listas de pessoas (diretas e subordinadas) baseadas nos nodes e escopo.
 */
export function getPersonsInScope(nodes = [], persons = [], nodeId, descIds = []) {
  const direct = nodes
    .filter(n => n.id === nodeId && n.personId)
    .map(n => persons.find(p => p.id === n.personId))
    .filter(Boolean);
    
  const sub = nodes
    .filter(n => descIds.includes(n.id) && n.personId)
    .map(n => persons.find(p => p.id === n.personId))
    .filter(Boolean);
    
  return { direct, sub };
}

/**
 * Retorna as listas de ativos (diretos e subordinados) baseadas no escopo.
 */
export function getAssetsInScope(assets = [], nodeId, descIds = []) {
  const direct = assets.filter(a => a.nodeId === nodeId);
  const sub = assets.filter(a => descIds.includes(a.nodeId));
  return { direct, sub };
}

/**
 * Retorna as listas de contratos (diretos e subordinados) baseadas no escopo.
 */
export function getContractsInScope(contracts = [], nodeId, descIds = []) {
  const direct = contracts.filter(c => c.nodeId === nodeId);
  const sub = contracts.filter(c => descIds.includes(c.nodeId));
  return { direct, sub };
}

/**
 * Retorna as listas de estruturas/subunidades (diretas e subordinadas).
 */
export function getStructuresInScope(nodes = [], nodeId, descIds = [], getChildren) {
  const direct = getChildren ? getChildren(nodeId) : nodes.filter(n => n.parentId === nodeId);
  const sub = nodes.filter(n => descIds.includes(n.id));
  return { direct, sub };
}

/**
 * Calcula as estatísticas de contingência e manutenção dos ativos do escopo.
 */
export function getAssetEmergencyStats(dAssets = [], sAssets = []) {
  return {
    dEmergency: dAssets.filter(a => a.isEmergency).length,
    sEmergency: sAssets.filter(a => a.isEmergency).length,
    dEmergencyMaintenance: dAssets.filter(a => a.isEmergency && a.isMaintenance).length,
    sEmergencyMaintenance: sAssets.filter(a => a.isEmergency && a.isMaintenance).length
  };
}
