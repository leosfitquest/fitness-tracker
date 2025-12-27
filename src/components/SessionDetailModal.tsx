import type { WorkoutSessionLog, ExerciseSessionData, ActiveSet } from '../App';

interface SessionDetailModalProps {
  session: WorkoutSessionLog | null;
  onClose: () => void;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  if (!session) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-emerald-400">{session.workoutName}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(session.startedAt).toLocaleDateString()} · {session.durationMinutes} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-950/50">
          <div className="text-center">
            <div className="text-xs text-slate-400">Volume</div>
            <div className="text-lg font-bold text-emerald-400">
              {session.totalVolume.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">kg·reps</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Sets</div>
            <div className="text-lg font-bold">{session.totalSetsCompleted}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Duration</div>
            <div className="text-lg font-bold">{session.durationMinutes} min</div>
          </div>
        </div>

        {/* Exercises */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Exercises</h3>
          {session.exercises.map((ex: ExerciseSessionData, idx: number) => (
            <div key={idx} className="bg-slate-950 rounded-lg border border-slate-800 p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{ex.name}</h4>
                  <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full inline-block mt-1">
                    {ex.muscleGroup}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Volume</div>
                  <div className="font-bold text-emerald-400">{ex.volume.toLocaleString()}</div>
                </div>
              </div>

              {/* Sets Table */}
              <div className="mt-3 space-y-1">
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 font-semibold px-2">
                  <div>Set</div>
                  <div>Weight</div>
                  <div>Reps</div>
                  <div>RPE</div>
                </div>
                {ex.sets
                  .filter((s: ActiveSet) => s.completed)
                  .map((set: ActiveSet, setIdx: number) => (
                    <div 
                      key={setIdx}
                      className="grid grid-cols-4 gap-2 text-sm bg-slate-900/50 rounded px-2 py-1.5"
                    >
                      <div className="text-slate-400">{set.setNumber}</div>
                      <div className="font-mono">{set.weight || '-'} kg</div>
                      <div className="font-mono">{set.reps || '-'}</div>
                      <div className="font-mono text-amber-400">{set.rpe || '-'}</div>
                    </div>
                  ))}
              </div>

              {ex.note && (
                <div className="mt-2 text-xs text-slate-400 italic border-t border-slate-800 pt-2">
                  💬 {ex.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="p-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Session Notes</h3>
            <p className="text-sm text-slate-400 bg-slate-950/50 rounded p-3">{session.notes}</p>
          </div>
        )}

        {session.isDeload && (
          <div className="p-4 border-t border-slate-700">
            <span className="px-3 py-1.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 font-medium">
              🔻 Deload Week
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
