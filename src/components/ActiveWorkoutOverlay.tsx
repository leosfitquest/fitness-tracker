import { useState } from 'react';
import { ActiveWorkoutCard } from './ActiveWorkoutCard';
import { formatTime } from "../utils/math";
import { checkSetPR } from "../utils/PRTracker";
import type { SetPR } from "../utils/PRTracker";
import type { Workout, WorkoutExercise, ActiveSet, Exercise } from "../types";

interface ActiveWorkoutOverlayProps {
    workout: Workout;
    workoutExercises: WorkoutExercise[];
    workoutExercisesData: any;
    activeSets: ActiveSet[];
    workoutStartTime: number | null;
    workoutElapsedSeconds: number;
    workoutStarted: boolean;
    onSetWorkoutStarted: (started: boolean) => void;
    onSetWorkoutStartTime: (time: number) => void;
    onCompleteWorkout: () => void;
    onDiscardWorkout: () => void;
    onMinimize?: () => void;
    isMinimized?: boolean;
    // Actions
    onSetChange: (exerciseId: string, sets: ActiveSet[]) => void; // Wrapped handler
    onRemoveExercise: (id: string) => void;
    onMoveExercise: (from: number, to: number) => void;
    onSaveExercise: (exerciseId: string) => void; // Trigger save/PR check
    selectedExerciseId: string | null;
    onSelectExercise: (id: string | null) => void;

    // Settings
    showRPE: boolean;
    show1RM: boolean;
    showPlateCalculator: boolean;
    isDeload: boolean;

    // Data
    allExercises: Exercise[];
    historicalPRData: SetPR[];

    // UI Actions
    onAddExercise: () => void;
}

export function ActiveWorkoutOverlay({
    workout,
    workoutExercises,
    workoutExercisesData,
    activeSets,
    workoutStartTime,
    workoutElapsedSeconds,
    workoutStarted,
    onSetWorkoutStarted,
    onSetWorkoutStartTime,
    onCompleteWorkout,
    onDiscardWorkout,
    onSetChange,
    onRemoveExercise,
    onMoveExercise,
    onSaveExercise,
    selectedExerciseId,
    onSelectExercise,
    showRPE,
    show1RM,
    showPlateCalculator,
    isDeload,
    allExercises,
    historicalPRData,
    onAddExercise
}: ActiveWorkoutOverlayProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);

    // Auto-collapse if user navigates away? No, we want persistence.
    // But we default to expanded when a workout starts.

    const handleStart = () => {
        onSetWorkoutStarted(true);
        if (!workoutStartTime) onSetWorkoutStartTime(Date.now());
    };



    // Minimized View (Bottom Bar)
    if (!isExpanded) {
        return (
            <div className="fixed bottom-[80px] left-4 right-4 z-50">
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-3 flex items-center justify-between"
                    onClick={() => setIsExpanded(true)}>

                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/50">
                            {workoutStarted ? 'GO' : '⏱️'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm truncate">{workout.name}</div>
                            <div className="text-emerald-400 font-mono text-xs">
                                {workoutStarted ? formatTime(workoutElapsedSeconds) : "Not Started"}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                        className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                        ▲
                    </button>
                </div>
            </div>
        );
    }

    // Expanded View (Full Overlay)
    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto pb-20 animate-in fade-in slide-in-from-bottom-10 duration-200">

            {/* Header Bar */}
            <div className="sticky top-0 bg-background/95 border-b border-white/5 px-4 py-3 flex items-center justify-between z-10 backdrop-blur-md">
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    ▼ Minimize
                </button>

                <div className="font-mono font-bold text-emerald-400 text-lg">
                    {workoutStarted ? formatTime(workoutElapsedSeconds) : "00:00"}
                </div>

                <div className="flex gap-2">
                    {!workoutStarted ? (
                        <button
                            onClick={handleStart}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm"
                        >
                            START
                        </button>
                    ) : (
                        <button
                            onClick={onCompleteWorkout}
                            disabled={Object.keys(workoutExercisesData).length === 0}
                            className="px-4 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
                        >
                            FINISH
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {/* Workout Info */}
                <div className="text-center space-y-1 py-2">
                    <h1 className="text-2xl font-bold text-white">{workout.name}</h1>
                    <p className="text-slate-400 text-sm">
                        {workoutExercises.length} Exercises • {Object.keys(workoutExercisesData).length} Completed
                    </p>
                </div>

                {/* Selected Exercise View (Active Card) */}
                {selectedExerciseId ? (
                    <div className="animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => onSelectExercise(null)}
                            className="mb-4 text-sm text-slate-400 hover:text-white flex items-center gap-1"
                        >
                            <span>← Back to List</span>
                        </button>

                        <ActiveWorkoutCard
                            exerciseId={selectedExerciseId}
                            exerciseName={workoutExercises.find(e => e.id === selectedExerciseId)?.name || ""}
                            muscleGroup={workoutExercises.find(e => e.id === selectedExerciseId)?.muscleGroup || ""}
                            sets={activeSets}
                            note={workoutExercises.find(e => e.id === selectedExerciseId)?.notes}
                            isSupersetWith={undefined} // TODO: Pass superset info if needed
                            onSetChange={(index, field, value) => {
                                const newSets = [...activeSets];
                                newSets[index] = { ...newSets[index], [field]: value };

                                // Check for PR if completed
                                if (field === 'completed' && value === true) {
                                    const s = newSets[index];
                                    if (s.weight && s.reps) {
                                        const pr = checkSetPR(selectedExerciseId, s.setNumber, s.weight, s.reps, historicalPRData);
                                        if (pr.isPR) {
                                            newSets[index] = { ...newSets[index], isPR: true, prType: pr.improvement || 'both' };
                                            alert(`🔥 NEW PR! Set ${s.setNumber}: ${s.weight}kg × ${s.reps} reps`);
                                        }
                                    }
                                }
                                onSetChange(selectedExerciseId, newSets);
                            }}
                            onAddSet={() => {
                                const newSets = [...activeSets, { setNumber: activeSets.length + 1, completed: false, weight: null, reps: null, rpe: null }];
                                onSetChange(selectedExerciseId, newSets);
                            }}
                            onStartRest={() => { }} // TODO: Hook up rest timer
                            onNoteChange={(_newNote) => {
                                // We need a way to update notes in the parent state
                                // For now, simpler implementation:
                                // onUpdateExercise(selectedExerciseId, { notes: newNote }) 
                                // But let's skip for this iteration or assume autosave on blur
                            }}
                            isDeload={isDeload}
                            showRPE={showRPE}
                            show1RM={show1RM}
                            showPlateCalculator={showPlateCalculator}
                            allExercises={allExercises}
                        />

                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={() => onRemoveExercise(selectedExerciseId)}
                                className="text-red-400 text-sm px-3 py-2 hover:bg-red-950/30 rounded"
                            >
                                Remove Exercise
                            </button>
                            <button
                                onClick={() => onSaveExercise(selectedExerciseId)}
                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 px-6 py-2 rounded-lg font-bold hover:bg-emerald-500/20"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Exercise List */
                    <div className="space-y-3">
                        {workoutExercises.map((ex, index) => {
                            const isCompleted = !!workoutExercisesData[ex.id];
                            return (
                                <div
                                    key={ex.id}
                                    draggable
                                    onDragStart={() => setDraggedExerciseIndex(index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                        if (draggedExerciseIndex !== null) {
                                            onMoveExercise(draggedExerciseIndex, index);
                                            setDraggedExerciseIndex(null);
                                        }
                                    }}
                                    onClick={() => onSelectExercise(ex.id)}
                                    className={`
                                relative p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all
                                ${isCompleted
                                            ? "bg-emerald-950/10 border-emerald-500/30 hover:bg-emerald-950/20"
                                            : "bg-card border-border hover:border-slate-600"
                                        }
                            `}
                                >
                                    {/* Drag Handle */}
                                    <div className="text-slate-600 cursor-move py-2">⋮⋮</div>

                                    {/* Image */}
                                    <div className="w-14 h-14 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                                        {ex.imageUrl ? (
                                            <img src={ex.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base truncate ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                            {ex.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="uppercase">{ex.muscleGroup}</span>
                                            {isCompleted && <span>• {workoutExercisesData[ex.id]?.sets?.length} Sets</span>}
                                        </div>
                                    </div>

                                    {/* Checkmark */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isCompleted ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-slate-600'}
                            `}>
                                        {isCompleted && <span className="text-xs font-bold">✓</span>}
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={onAddExercise}
                            className="w-full py-4 mb-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 flex items-center justify-center gap-2 font-bold transition-all"
                        >
                            <span className="text-xl">+</span> Add Exercise
                        </button>

                        <button
                            onClick={onDiscardWorkout}
                            className="w-full mt-8 py-3 text-red-400/60 hover:text-red-400 text-sm hover:bg-red-950/10 rounded-lg transition-colors"
                        >
                            Cancel Workout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
