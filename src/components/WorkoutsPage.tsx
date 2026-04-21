import { useState } from 'react';
import type { Workout } from '../types.ts';
import { WorkoutCard } from './WorkoutCard';
import { Dumbbell, Plus, Sparkles } from 'lucide-react';

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
        <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Dumbbell className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Your Workouts</h1>
                        <p className="text-slate-500 text-xs">
                            {workouts.length} routine{workouts.length !== 1 ? 's' : ''} created
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mb-24">
                {workouts.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mx-auto mb-4 animate-float">
                            <Sparkles className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No Workouts Yet</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                            Create your first workout routine to start tracking your gains
                        </p>
                        <button
                            onClick={onQuickCreate}
                            className="px-8 py-3 bg-gradient-primary text-black font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity press-effect"
                        >
                            Create Workout
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 stagger-children">
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
                                    className="animate-fade-in-up"
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
                            className="w-full py-5 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-800/20 hover:bg-emerald-950/10 text-slate-400 hover:text-emerald-400 font-semibold text-sm transition-all flex items-center justify-center gap-2 press-effect group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                            <span>Create New Workout</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
