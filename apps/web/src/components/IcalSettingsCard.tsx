import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUpdateIcalConfig, useSyncIcal } from "../hooks/useDashboardQueries";
import { useToast } from "../hooks/useToast";
import { Toast } from "./Toast";

export const IcalSettingsCard: React.FC = () => {
  const { user, refreshMe } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [urlInput, setUrlInput] = useState(user?.ical_url || "");
  const [isEditing, setIsEditing] = useState(!user?.ical_url);

  useEffect(() => {
    if (user?.ical_url !== undefined) {
      setUrlInput(user.ical_url || "");
      setIsEditing(!user.ical_url);
    }
  }, [user?.ical_url]);

  const { mutateAsync: saveConfig, isPending: isSaving } = useUpdateIcalConfig();
  const { mutateAsync: runSync, isPending: isSyncing } = useSyncIcal();

  const handleSave = async () => {
    try {
      await saveConfig(urlInput);
      await refreshMe(); // Para que el provider refleje user.ical_url
      setIsEditing(false);
      showToast("URL de calendario guardada correctamente", "success");
    } catch (error: any) {
      showToast(error.message || "Error al guardar configuración", "error");
    }
  };

  const handleSync = async () => {
    try {
      const result = await runSync();
      showToast(
        `Sincronización exitosa. ${result.syncedCount} eventos nuevos o actualizados.`,
        "success",
      );
    } catch (error: any) {
      showToast(error.message || "Error al sincronizar feed", "error");
    }
  };

  if (!user) return null;

  return (
    <div className="oat-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p className="oat-text-secondary" style={{ fontSize: "0.875rem" }}>
        Ingresa tu enlace privado Webcal de Schoology para sincronizar automáticamente tus tareas.
      </p>

      {isEditing ? (
        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
          <input
            className="oat-input"
            type="url"
            placeholder="webcal://cfe.schoology.com/calendar/feed/ical/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isSaving}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              className="oat-btn"
              onClick={handleSave}
              disabled={isSaving || !urlInput.trim()}
            >
              {isSaving ? "Guardando..." : "Guardar URL"}
            </button>
            {user.ical_url && (
              <button
                className="oat-btn oat-btn-outline"
                onClick={() => {
                  setUrlInput(user.ical_url!);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="oat-btn" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
            </button>
            <button className="oat-btn oat-btn-outline" onClick={() => setIsEditing(true)}>
              Editar URL
            </button>
          </div>
          {user.last_ical_sync && (
            <small className="oat-text-secondary">
              Última sincronización: {new Date(user.last_ical_sync).toLocaleString("es-UY")}
            </small>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};
