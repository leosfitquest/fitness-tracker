import type { WorkoutSessionLog } from "../types.ts";

interface SessionDetailModalProps {
  session: WorkoutSessionLog | null;
  onClose: () => void;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  if (!session) return null;

  // 🆕 NEU: Helper für Zeit-Formatierung
  const formatTime = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🆕 NEU: Helper für Datum-Formatierung
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🆕 NEU: Berechne Stats für jede Übung
  const calculateExerciseStats = (exercise: any) => {
    const completedSets = exercise.sets.filter((s: any) => s.completed);
    const volumeSets = completedSets.filter((s: any) => s.setType !== 'warmup');
    const totalVolume = volumeSets.reduce((sum: number, set: any) => {
      return sum + (set.weight || 0) * (set.reps || 0);
    }, 0);
    const maxWeight = Math.max(...volumeSets.map((s: any) => s.weight || 0), 0);

    return {
      completedSets: completedSets.length,
      totalSets: exercise.sets.length,
      totalVolume,
      maxWeight
    };
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{session.workoutName}</h2>
              <p className="text-sm text-slate-400">
                {formatDateTime(session.startedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {session.durationSeconds ? formatTime(session.durationSeconds) : `${session.durationMinutes}m`}
              </div>
              <div className="text-xs text-slate-400 mt-1">Duration</div>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {(session.totalVolume / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-slate-400 mt-1">Volume (kg)</div>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {session.totalSetsCompleted}
              </div>
              <div className="text-xs text-slate-400 mt-1">Sets</div>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {session.exercises.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Exercises</div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-3">
            {session.isDeload && (
              <span className="px-3 py-1 bg-amber-900/20 border border-amber-500/50 text-amber-400 rounded-full text-xs font-medium">
                🔥 Deload
              </span>
            )}
            {session.newPRs && session.newPRs.length > 0 && (
              <span className="px-3 py-1 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/50 text-amber-400 rounded-full text-xs font-medium">
                🎉 {session.newPRs.length} PR{session.newPRs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 🆕 NEU: Personal Records Section */}
          {session.newPRs && session.newPRs.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-xl p-4">
              <h3 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                Personal Records Achieved
              </h3>
              <div className="space-y-2">
                {session.newPRs.map((pr, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{pr.exerciseName}</p>
                      <p className="text-xs text-slate-400 uppercase">{pr.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-slate-500">{pr.oldValue}</span>
                        <span className="mx-2 text-emerald-400">→</span>
                        <span className="text-amber-400 font-bold">{pr.newValue}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🆕 NEU: Exercises Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Exercises</h3>
            <div className="space-y-4">
              {session.exercises.map((exercise, exIndex) => {
                const stats = calculateExerciseStats(exercise);

                return (
                  <div 
                    key={exIndex}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                  >
                    {/* Exercise Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-slate-500">#{exIndex + 1}</span>
                          <h4 className="font-bold text-white">{exercise.name}</h4>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs uppercase">
                            {exercise.muscleGroup}
                          </span>
                        </div>
                        {exercise.note && (
                          <p className="text-xs text-slate-400 italic mt-1">"{exercise.note}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">
                          {stats.totalVolume.toLocaleString()} kg
                        </div>
                        <div className="text-xs text-slate-400">
                          {stats.completedSets}/{stats.totalSets} sets · Max: {stats.maxWeight}kg
                        </div>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left py-2 px-2 text-slate-400 font-medium text-xs">Set</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">Weight (kg)</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">Reps</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">RPE</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">Volume</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set: any, setIndex: number) => {
                            const volume = set.weight && set.reps ? set.weight * set.reps : 0;

                            return (
                              <tr 
                                key={setIndex}
                                className={`border-b border-slate-800/50 ${
                                  set.completed ? 'bg-emerald-900/10' : 'opacity-50'
                                }`}
                              >
                                <td className="py-2 px-2 font-mono text-slate-500">
                                  {set.setNumber}
                                </td>
                                <td className="py-2 px-2 text-center font-bold">
                                  {set.weight || '-'}
                                </td>
                                <td className="py-2 px-2 text-center font-bold">
                                  {set.reps || '-'}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {set.rpe ? (
                                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">
                                      {set.rpe}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center text-emerald-400 font-medium">
                                  {volume > 0 ? volume.toLocaleString() : '-'}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {set.completed ? (
                                    <span className="text-emerald-400">✓</span>
                                  ) : (
                                    <span className="text-slate-600">○</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🆕 NEU: Session Notes */}
          {session.notes && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold mb-2">Session Notes</h3>
              <p className="text-sm text-slate-300 italic">"{session.notes}"</p>
            </div>
          )}

          {/* 🆕 NEU: Timing Information */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold mb-3">Timing Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Started At</p>
                <p className="font-medium">{formatDateTime(session.startedAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Ended At</p>
                <p className="font-medium">{formatDateTime(session.endedAt)}</p>
              </div>
              {session.durationSeconds && (
                <>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Total Duration</p>
                    <p className="font-medium font-mono text-emerald-400">
                      {formatTime(session.durationSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Avg Time per Set</p>
                    <p className="font-medium">
                      {session.totalSetsCompleted > 0 
                        ? Math.round(session.durationSeconds / session.totalSetsCompleted)
                        : 0}s
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
