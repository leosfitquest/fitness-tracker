import { X, Clock, Dumbbell, TrendingUp, Trophy } from 'lucide-react';
import type { WorkoutSessionLog, ExerciseSessionData, ActiveSet } from "../types.ts";

interface SessionDetailModalProps {
  session: WorkoutSessionLog | null;
  onClose: () => void;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  if (!session) return null;

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

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const calculateExerciseStats = (exercise: ExerciseSessionData) => {
    const sets = exercise?.sets || [];
    const completedSets = sets.filter((s: ActiveSet) => s?.completed);
    const volumeSets = completedSets.filter((s: ActiveSet) => s?.setType !== 'warmup');
    const totalVolume = volumeSets.reduce((sum: number, set: ActiveSet) => {
      return sum + ((set?.weight || 0) * (set?.reps || 0));
    }, 0);
    const weights = volumeSets.map((s: ActiveSet) => s?.weight || 0);
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

    return {
      completedSets: completedSets.length,
      totalSets: sets.length,
      totalVolume,
      maxWeight
    };
  };

  const exercises = session.exercises || [];
  const hasExercises = exercises.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{session.workoutName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(session.startedAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                icon: <Clock className="w-4 h-4" />,
                value: session.durationSeconds ? formatTime(session.durationSeconds) : `${session.durationMinutes}m`,
                label: 'Duration'
              },
              {
                icon: <TrendingUp className="w-4 h-4" />,
                value: session.totalVolume > 0 ? `${(session.totalVolume / 1000).toFixed(1)}k` : '0',
                label: 'Vol (kg)'
              },
              {
                icon: <Dumbbell className="w-4 h-4" />,
                value: String(session.totalSetsCompleted || 0),
                label: 'Sets'
              },
              {
                icon: <Dumbbell className="w-4 h-4" />,
                value: String(exercises.length),
                label: 'Exercises'
              },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/40 rounded-xl p-2.5 text-center">
                <div className="text-emerald-400 flex justify-center mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {session.isDeload && (
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold">
                🔥 Deload
              </span>
            )}
            {session.newPRs && session.newPRs.length > 0 && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold">
                🎉 {session.newPRs.length} PR{session.newPRs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* PRs Section */}
          {session.newPRs && session.newPRs.length > 0 && (
            <div className="bg-gradient-to-br from-amber-950/30 to-orange-950/30 border border-amber-500/20 rounded-xl p-4">
              <h3 className="font-bold text-amber-400 mb-3 flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4" />
                Personal Records
              </h3>
              <div className="space-y-2">
                {session.newPRs.map((pr: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2.5 bg-black/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{pr.exerciseName}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{pr.type}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-slate-500">{pr.oldValue}</span>
                      <span className="mx-1.5 text-emerald-400">→</span>
                      <span className="text-amber-400 font-bold">{pr.newValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises Section */}
          {hasExercises ? (
            <div>
              <h3 className="font-bold text-sm mb-3 text-white">Exercises</h3>
              <div className="space-y-3">
                {exercises.map((exercise: ExerciseSessionData, exIndex: number) => {
                  const stats = calculateExerciseStats(exercise);
                  const sets = exercise?.sets || [];

                  return (
                    <div
                      key={exIndex}
                      className="bg-slate-800/30 border border-white/5 rounded-xl p-3"
                    >
                      {/* Exercise Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-slate-600">#{exIndex + 1}</span>
                            <h4 className="font-bold text-white text-sm truncate">{exercise.name}</h4>
                          </div>
                          <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded text-[10px] uppercase">
                            {exercise.muscleGroup}
                          </span>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm font-bold text-emerald-400">
                            {stats.totalVolume > 0 ? stats.totalVolume.toLocaleString() : 0} kg
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {stats.completedSets}/{stats.totalSets} sets
                          </div>
                        </div>
                      </div>

                      {/* Sets Table */}
                      {sets.length > 0 && (
                        <div className="overflow-x-auto mt-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="text-left py-1.5 px-1.5 text-slate-500 font-medium">Set</th>
                                <th className="text-center py-1.5 px-1.5 text-slate-500 font-medium">kg</th>
                                <th className="text-center py-1.5 px-1.5 text-slate-500 font-medium">Reps</th>
                                <th className="text-center py-1.5 px-1.5 text-slate-500 font-medium">RPE</th>
                                <th className="text-center py-1.5 px-1.5 text-slate-500 font-medium">Vol</th>
                                <th className="text-center py-1.5 px-1.5 text-slate-500 font-medium">✓</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sets.map((set: ActiveSet, setIndex: number) => {
                                const volume = (set?.weight && set?.reps) ? set.weight * set.reps : 0;
                                return (
                                  <tr
                                    key={setIndex}
                                    className={`border-b border-white/3 ${
                                      set?.completed ? 'bg-emerald-500/5' : 'opacity-40'
                                    }`}
                                  >
                                    <td className="py-1.5 px-1.5 font-mono text-slate-500">
                                      {set?.setNumber ?? setIndex + 1}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center font-bold text-white">
                                      {set?.weight || '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center font-bold text-white">
                                      {set?.reps || '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center">
                                      {set?.rpe ? (
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">
                                          {set.rpe}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center text-emerald-400 font-medium">
                                      {volume > 0 ? volume.toLocaleString() : '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center">
                                      {set?.completed ? (
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No exercise data recorded</p>
            </div>
          )}

          {/* Session Notes */}
          {session.notes && (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3">
              <h3 className="font-bold text-sm mb-1.5 text-white">Notes</h3>
              <p className="text-xs text-slate-400 italic">"{session.notes}"</p>
            </div>
          )}

          {/* Timing */}
          <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3">
            <h3 className="font-bold text-sm mb-2 text-white">Timing</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500 text-[10px] mb-0.5">Started</p>
                <p className="font-medium text-slate-300">{formatDateTime(session.startedAt)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] mb-0.5">Ended</p>
                <p className="font-medium text-slate-300">{formatDateTime(session.endedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-white font-semibold text-sm transition-all press-effect"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
