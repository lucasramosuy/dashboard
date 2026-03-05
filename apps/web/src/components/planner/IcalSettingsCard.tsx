import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateIcalConfig, useSyncIcal } from "../../hooks/useDashboardQueries";
import { useToast } from "../../hooks/useToast";
import { Toast } from '../ui/Toast';

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent disabled:opacity-60 disabled:cursor-not-allowed";

const btnPrimary =
  "px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed";

const btnOutline =
  "px-5 py-2.5 rounded-lg font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed";

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
      await refreshMe();
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
    <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <p className="text-theme-text-muted text-sm">
        Ingresa tu enlace privado Webcal de Schoology para sincronizar automáticamente tus tareas.
      </p>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <input
            className={inputCls}
            type="url"
            placeholder="webcal://cfe.schoology.com/calendar/feed/ical/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isSaving}
          />
          <div className="flex gap-2 mt-2">
            <button
              className={btnPrimary}
              onClick={handleSave}
              disabled={isSaving || !urlInput.trim()}
            >
              {isSaving ? "Guardando..." : "Guardar URL"}
            </button>
            {user.ical_url && (
              <button
                className={btnOutline}
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
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <button className={btnPrimary} onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
            </button>
            <button className={btnOutline} onClick={() => setIsEditing(true)}>
              Editar URL
            </button>
          </div>
          {user.last_ical_sync && (
            <small className="text-theme-text-muted">
              Última sincronización: {new Date(user.last_ical_sync).toLocaleString("es-UY")}
            </small>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};
