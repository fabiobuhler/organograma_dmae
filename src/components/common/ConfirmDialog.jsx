import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  if (!dialog) return null;

  const isDanger = dialog.type === "danger";

  return (
    <div className="modal-overlay" style={{ zIndex: 5200 }}>
      <div className="modal-content narrow system-alert-modal">
        <div className="modal-header">
          <h2>{dialog.title || "Confirmar ação"}</h2>
          <p>{dialog.subtitle || "Confirme antes de continuar."}</p>
        </div>

        <div className="modal-body" style={{ marginTop: 0 }}>
          <div className={`system-alert-box ${isDanger ? "error" : "warning"}`} style={{ border: "none", background: "none", padding: 0 }}>
            <div className="system-alert-icon" style={{ background: isDanger ? "#fee2e2" : "#fefce8", color: isDanger ? "#ef4444" : "#eab308" }}>
              {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
            </div>

            <div className="system-alert-text">
              <div className="system-alert-title" style={{ color: "var(--n800)" }}>
                {dialog.title || "Confirmar ação"}
              </div>

              <div className="system-alert-message" style={{ color: "var(--n600)" }}>
                {String(dialog.message || "")
                  .split("\n")
                  .map((line, idx) => (
                    <p key={idx} style={{ marginBottom: 4 }}>{line}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--n100)", paddingTop: 16 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={isDanger ? "btn btn-danger btn-xs" : "btn btn-primary btn-xs"}
            onClick={onConfirm}
            autoFocus
          >
            {dialog.confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
