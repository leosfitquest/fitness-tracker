import type { ActiveSet } from '../types';

interface HistoryEntry {
    date: string;
    sets: ActiveSet[];
    volume: number;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    history: HistoryEntry[];
}

export function HistoryModal({ isOpen, onClose, exerciseName, history }: HistoryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-card-foreground">{exerciseName} - History</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>

                <div className="space-y-4">
                    {history.map((s, i) => (
                        <div key={i} className="bg-secondary/50 border border-border rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground text-sm">
                                    {new Date(s.date).toLocaleDateString(undefined, {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="text-primary font-bold">{s.volume.toLocaleString()} kg</span>
                            </div>
                            <div className="space-y-1">
                                {s.sets.map((set, si) => (
                                    <div key={si} className="text-sm bg-background px-3 py-1.5 rounded flex justify-between border border-border/50">
                                        <span className="text-card-foreground">Set {set.setNumber}</span>
                                        <span className="text-card-foreground font-mono">
                                            {set.weight}kg × {set.reps}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {history.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">No history found for this exercise.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
