import type { WorkoutSessionLog } from '../types.ts';

interface DashboardPageProps {
    sessionLogs: WorkoutSessionLog[];
    onSelectSession: (log: WorkoutSessionLog) => void;
}

export function DashboardPage({ sessionLogs, onSelectSession }: DashboardPageProps) {
    return (
        <>
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
            </div>

            {sessionLogs.length > 0 ? (
                <div className="max-w-4xl mx-auto mb-8">
                    <h2 className="text-2xl font-bold mb-4">Recent sessions</h2>
                    <div className="space-y-2">
                        {sessionLogs.map((log) => (
                            <button
                                key={log.id}
                                onClick={() => onSelectSession(log)}
                                className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg p-4 transition-all text-left"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold">{log.workoutName}</h3>
                                        <p className="text-xs text-slate-400">
                                            {new Date(log.startedAt).toLocaleDateString()} · {log.durationMinutes} min · {log.totalSetsCompleted} sets
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-bold text-lg">{log.totalVolume.toLocaleString()} kg</div>
                                        {log.isDeload && <span className="text-xs text-amber-400">Deload</span>}
                                        {log.newPRs && log.newPRs.length > 0 && (
                                            <span className="text-xs text-orange-400 ml-2">🎉 {log.newPRs.length} PR{log.newPRs.length > 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto mb-8 text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-slate-400 mb-4">No sessions yet.</p>
                    <p className="text-sm text-slate-500">Create a workout and start training!</p>
                </div>
            )}
        </>
    );
}
