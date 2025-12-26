import { useState } from "react";

interface SetEntryRowProps {
  setNumber: number;
  targetReps?: number;
  previousWeight?: number;
  previousReps?: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isPersonalRecord?: boolean;
  onWeightChange: (weight: number | null) => void;
  onRepsChange: (reps: number | null) => void;
  onCompletedChange: (completed: boolean) => void;
}

export function SetEntryRow({
  setNumber,
  targetReps,
  previousWeight,
  previousReps,
  weight,
  reps,
  completed,
  isPersonalRecord = false,
  onWeightChange,
  onRepsChange,
  onCompletedChange,
}: SetEntryRowProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleWeightChange = (value: string) => {
    const num = value === "" ? null : Number(value);
    onWeightChange(Number.isNaN(num) ? null : num);
  };

  const handleRepsChange = (value: string) => {
    const num = value === "" ? null : Number(value);
    onRepsChange(Number.isNaN(num) ? null : num);
  };

  return (
    <div
      className={`grid grid-cols-[auto,1fr,1fr,auto] items-center gap-3 rounded-md border px-3 py-2 text-sm ${
        completed ? "border-emerald-500 bg-emerald-500/5" : "border-slate-800 bg-slate-900"
      } ${isFocused ? "ring-1 ring-emerald-500" : ""}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => onCompletedChange(e.target.checked)}
        />
        <span className="text-xs text-slate-400">Set {setNumber}</span>
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] text-slate-500">Weight (kg)</label>
        <input
          type="number"
          value={weight ?? ""}
          onChange={(e) => handleWeightChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        />
        {previousWeight !== undefined && (
          <span className="mt-0.5 text-[10px] text-slate-500">
            Prev: {previousWeight} kg
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] text-slate-500">Reps</label>
        <input
          type="number"
          value={reps ?? ""}
          onChange={(e) => handleRepsChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        />
        {(targetReps || previousReps) && (
          <span className="mt-0.5 text-[10px] text-slate-500">
            {targetReps && <>Target: {targetReps} · </>}
            {previousReps && <>Prev: {previousReps}</>}
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {isPersonalRecord && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            PR
          </span>
        )}
      </div>
    </div>
  );
}
