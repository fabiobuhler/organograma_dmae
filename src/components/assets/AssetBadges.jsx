import { Siren, AlertTriangle } from "lucide-react";

/**
 * AssetContingencyBadge - Indicador visual de ativo de contingência.
 */
export function AssetContingencyBadge({
  active,
  showText = true,
  compact = false,
  className = ""
}) {
  if (!active) return null;

  return (
    <span className={`asset-badge asset-badge-contingency${compact ? " compact" : ""}${className ? " " + className : ""}`}>
      <Siren size={compact ? 13 : 16} color="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
      {showText && <span>Contingência</span>}
    </span>
  );
}

/**
 * AssetMaintenanceBadge - Indicador visual de ativo em manutenção.
 */
export function AssetMaintenanceBadge({
  active,
  showText = true,
  compact = false,
  className = ""
}) {
  if (!active) return null;

  return (
    <span className={`asset-badge asset-badge-maintenance${compact ? " compact" : ""}${className ? " " + className : ""}`}>
      <AlertTriangle size={compact ? 13 : 16} strokeWidth={3} />
      {showText && <span>Manutenção</span>}
    </span>
  );
}

/**
 * AssetBadges - Agrupa os badges de contingência e manutenção de um ativo.
 */
export default function AssetBadges({
  asset,
  showText = true,
  compact = false,
  className = ""
}) {
  if (!asset) return null;

  const isContingency = !!(asset.isEmergency || asset.is_emergency);
  const isMaintenance = !!(asset.isMaintenance || asset.is_maintenance);

  if (!isContingency && !isMaintenance) return null;

  return (
    <div className={`asset-badges${compact ? " compact" : ""}${className ? " " + className : ""}`}>
      <AssetContingencyBadge active={isContingency} showText={showText} compact={compact} />
      <AssetMaintenanceBadge active={isMaintenance} showText={showText} compact={compact} />
    </div>
  );
}
