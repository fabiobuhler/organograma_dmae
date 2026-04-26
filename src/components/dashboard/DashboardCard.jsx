/**
 * DashboardCard.jsx
 * Card de indicador/KPI do Dashboard de Governança e BI.
 * Componente visual puro — recebe todos os dados via props.
 * Extraído do App.jsx na Fase 9A.
 */
export default function DashboardCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  valueColor,
  borderColor,
  className = "",
  onClick,
  style = {}
}) {
  return (
    <div
      className={`bi-card ${className}`}
      style={{ ...style, borderColor: borderColor || undefined, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <div
        className="bi-card-icon"
        style={{ background: iconBg || "#e2e8f0", color: iconColor || "#475569" }}
      >
        {Icon && <Icon size={18} />}
      </div>
      <div className="bi-card-data">
        <div className="bi-card-label">{label}</div>
        <div className="bi-card-main" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
        {subtitle && <div className="bi-card-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
