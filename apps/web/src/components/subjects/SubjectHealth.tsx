import React from "react";
import {
  HEALTH_LABEL,
  type HealthLevel,
  type SubjectHealth as Health,
} from "@dashboard/shared-types";
import { StatusBadge } from "../ui/StatusBadge";

const VARIANT = { ok: "success", attention: "warning", risk: "danger" } as const;

/** El nivel va siempre con texto, nunca solo por color. */
export const HealthBadge: React.FC<{ level: HealthLevel; empty?: boolean }> = ({
  level,
  empty,
}) => (
  <StatusBadge variant={empty ? "info" : VARIANT[level]}>
    {empty ? "Sin datos" : HEALTH_LABEL[level]}
  </StatusBadge>
);

/** Las razones que explican el nivel ("Qué mirar ahora"). */
export const HealthReasons: React.FC<{ health: Health<unknown>; className?: string }> = ({
  health,
  className = "",
}) => {
  if (!health.reasons.length) return null;
  return (
    <ul
      className={`list-none m-0 p-0 flex flex-col gap-1 ${className}`}
      aria-label="Qué mirar ahora"
    >
      {health.reasons.map((r) => (
        <li
          key={r.signal}
          className={`text-sm ${r.level === "risk" ? "text-theme-danger font-medium" : "text-theme-text-muted"}`}
        >
          {r.text}
        </li>
      ))}
    </ul>
  );
};
