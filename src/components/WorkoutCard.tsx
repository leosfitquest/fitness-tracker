interface WorkoutCardProps {
  id: string;
  name: string;
  description?: string;
  exercises: number;
  estimatedDuration?: number; // Minuten
  lastPerformed?: string;     // z.B. "2025-12-18"
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({
  id,
  name,
  description,
  exercises,
  estimatedDuration,
  lastPerformed,
  onStart,
  onEdit,
  onDelete,
}: WorkoutCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-right">
          <button
            onClick={() => onEdit(id)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(id)}
            className="text-xs text-red-500 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>{exercises} exercises</span>
        {estimatedDuration && <span>{estimatedDuration} min</span>}
        {lastPerformed && (
          <span className="text-slate-500">
            Last performed: {lastPerformed}
          </span>
        )}
      </div>

      <div className="mt-2">
        <button
          onClick={() => onStart(id)}
          className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Start workout
        </button>
      </div>
    </div>
  );
}
