import { useId, useState } from "react";
import { Button } from "../ui/Button";
import { preparePlannerMove } from "../../lib/planner";
export function PlannerMoveForm({
  date,
  pending,
  onMove,
}: {
  date: string;
  pending: boolean;
  onMove: (date: string) => void;
}) {
  const [value, setValue] = useState(date);
  const [error, setError] = useState("");
  const id = useId();
  return (
    <form
      className="mt-5 border-t border-theme-border pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          preparePlannerMove("preview", value);
          setError("");
          onMove(value);
        } catch {
          setError("Elegí una fecha válida.");
        }
      }}
    >
      <label htmlFor={id} className="block mb-2 text-sm text-theme-text-muted">
        Mover a otra fecha
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id={id}
          type="date"
          required
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-11 min-w-0 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text px-3"
        />
        <Button type="submit" isLoading={pending}>
          Mover tarea
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-theme-danger text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
