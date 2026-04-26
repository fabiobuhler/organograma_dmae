import React from "react";
import { AlertTriangle, ShieldCheck, Info } from "lucide-react";

export default function SystemAlertModal({ alert, onClose }) {
  if (!alert) return null;

  const isError = alert.type === "error";
  const isSuccess = alert.type === "success";

  return (
    <div className="modal-overlay" style={{ zIndex: 5000 }}>
      <div className="modal-content narrow system-alert-modal">
        <div className="modal-header">
          <h2>
            {isError ? "Erro" : isSuccess ? "Concluído" : alert.title || "Atenção"}
          </h2>
          <p>
            {isError
              ? "Não foi possível concluir a operação."
              : isSuccess
                ? "Operação concluída."
                : "Verifique as informações abaixo antes de continuar."}
          </p>
        </div>

        <div className="modal-body">
          <div className={`system-alert-box ${isError ? "error" : isSuccess ? "success" : "warning"}`}>
            <div className="system-alert-icon">
              {isError ? <AlertTriangle size={22} /> : isSuccess ? <ShieldCheck size={22} /> : <Info size={22} />}
            </div>

            <div className="system-alert-text">
              <div className="system-alert-title">
                {alert.title || (isError ? "Erro" : isSuccess ? "Concluído" : "Atenção")}
              </div>

              <div className="system-alert-message">
                {String(alert.message || "")
                  .split("\n")
                  .map((line, idx) => (
                    <p key={idx} style={{ margin: "0 0 6px" }}>{line}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            autoFocus
          >
            {alert.confirmText || "OK, entendi"}
          </button>
        </div>
      </div>
    </div>
  );
}
