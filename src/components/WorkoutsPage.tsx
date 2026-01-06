import { useState } from 'react';
import type { Workout } from '../types.ts';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutsPageProps {
    workouts: Workout[];
    onStart: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (from: number, to: number) => void;
    onQuickCreate: () => void;
}

export function WorkoutsPage({ workouts, onStart, onEdit, onDelete, onReorder, onQuickCreate }: WorkoutsPageProps) {
    const [draggedWorkoutIndex, setDraggedWorkoutIndex] = useState<number | null>(null);

    return (
        <>
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-4xl font-bold mb-2">Your Workouts</h1>
                <p className="text-slate-400 text-sm">Create and manage your training routines</p>
            </div>

            <div className="max-w-4xl mx-auto mb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {workouts.map((w, index) => (
                        <div
                            key={w.id}
                            draggable
                            onDragStart={() => setDraggedWorkoutIndex(index)}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={() => {
                                if (draggedWorkoutIndex !== null) onReorder(draggedWorkoutIndex, index);
                                setDraggedWorkoutIndex(null);
                            }}
                            className={`rounded-xl border transition-all cursor-move ${index === 0 ? "border-emerald-500/50 bg-emerald-950/10" : "border-slate-800 bg-slate-900 hover:border-slate-700"
                                }`}
                        >
                            <WorkoutCard
                                id={w.id}
                                name={w.name}
                                description={w.description}
                                exercises={w.exerciseCount}
                                estimatedDuration={w.estimatedDuration}
                                lastPerformed={w.lastPerformed}
                                onStart={onStart}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </div>
                    ))}
                </div>

                {/* ADD WORKOUT BUTTON */}
                <button
                    onClick={onQuickCreate}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 font-bold text-lg transition-all flex items-center justify-center gap-3"
                >
                    <span className="text-2xl">+</span>
                    <span>Create New Workout</span>
                </button>
            </div>
        </>
    );
}
