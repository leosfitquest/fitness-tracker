import type { WorkoutSessionLog } from "../App";

interface SessionDetailModalProps {
  session: WorkoutSessionLog | null;
  onClose: () => void;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-900/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{session.workoutName}</h2>
            <div className="text-sm text-slate-400 mt-1 flex gap-3">
              <span>📅 {new Date(session.startedAt).toLocaleDateString()}</span>
              <span>⏱️ {session.durationMinutes} min</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase">Volume</div>
              <div className="text-lg font-bold text-emerald-400">{session.totalVolume.toLocaleString()} kg</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase">Sets</div>
              <div className="text-lg font-bold text-blue-400">{session.totalSetsCompleted}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase">PRs</div>
              <div className="text-lg font-bold text-purple-400">
                {/* PR Logik könnte hier erweitert werden, wenn im Log gespeichert */}
                -
              </div>
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-4">
            {session.exercises.map((ex, i) => (
              <div key={i} className="bg-slate-950/50 rounded-lg border border-slate-800 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-200">{ex.name}</h3>
                  <span className="text-xs px-2 py-1 bg-slate-900 rounded-full text-slate-500">{ex.muscleGroup}</span>
                </div>
                
                {/* Sets Table */}
                <div className="grid grid-cols-4 text-xs text-slate-500 mb-2 px-2">
                  <div>SET</div>
                  <div className="text-center">KG</div>
                  <div className="text-center">REPS</div>
                  <div className="text-right">RPE</div>
                </div>
                <div className="space-y-1">
                  {ex.sets.filter(s => s.completed).map((set, idx) => (
                    <div key={idx} className="grid grid-cols-4 text-sm px-2 py-1 border-b border-slate-800/50 last:border-0 text-slate-300">
                      <div className="font-mono text-slate-500">{set.setNumber}</div>
                      <div className="text-center font-mono">{set.weight}</div>
                      <div className="text-center font-mono">{set.reps}</div>
                      <div className="text-right font-mono text-slate-500">{set.rpe || "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {session.notes && (
            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-amber-500 uppercase mb-1">Session Notes</h4>
              <p className="text-sm text-amber-200/80 italic">"{session.notes}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}