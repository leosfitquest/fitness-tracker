import { useState } from 'react';
import { ActiveWorkoutCard } from './ActiveWorkoutCard';
import { formatTime } from "../utils/math";
import type { Workout, WorkoutExercise, ActiveSet, Exercise } from "../types";
import { useToast } from './Toast';
import { useGlobalTimer } from '../hooks/GlobalTimerContext';
import { shouldSuggestRotation, getCycleRotationSuggestion } from '../utils/cycleRotation';
import { CycleRotationModal } from './CycleRotationModal';
import type { MovementPattern, CycleRotationSuggestion } from '../types';

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
    onReplaceExercise: (oldId: string, newExercise: Exercise) => void;
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
    // historicalPRData is no longer needed here — PR detection happens in App.tsx

    // UI Actions
    onAddExercise: () => void;
    onOpenSettings: () => void;

    showSupersetOptions?: boolean;
    onToggleSuperset?: (id1: string, id2: string) => void;
    availablePlates?: number[];

    // Cycle Rotation
    movementPatterns?: MovementPattern[];
    onUpdateMovementPatterns?: (patterns: MovementPattern[]) => void;
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
    onReplaceExercise,
    onMoveExercise,
    onSaveExercise,
    selectedExerciseId,
    onSelectExercise,
    showRPE,
    show1RM,
    showPlateCalculator,
    isDeload,
    allExercises,
    onAddExercise,
    onOpenSettings,
    showSupersetOptions,
    onToggleSuperset,
    availablePlates,
    movementPatterns = [],
}: ActiveWorkoutOverlayProps) {
    if (!workout) return null;

    const [isExpanded, setIsExpanded] = useState(true);
    const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
    const { showToast } = useToast();
    const { startRestTimer } = useGlobalTimer();
    const [rotationSuggestion, setRotationSuggestion] = useState<CycleRotationSuggestion | null>(null);

    // Auto-start timer when workout opens
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 text-slate-400 hover:text-white"
                        title="Minimize"
                    >
                        ▼
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-slate-400 hover:text-white"
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>

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
                            className="px-4 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-sm"
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
                            exerciseId={workoutExercises.find(e => e.id === selectedExerciseId)?.exerciseId || ""}
                            exerciseName={workoutExercises.find(e => e.id === selectedExerciseId)?.name || ""}
                            muscleGroup={workoutExercises.find(e => e.id === selectedExerciseId)?.muscleGroup || ""}
                            sets={activeSets}
                            note={workoutExercises.find(e => e.id === selectedExerciseId)?.notes}
                            isSupersetWith={(() => {
                                const current = workoutExercises.find(e => e.id === selectedExerciseId);
                                if (!current?.supersetWith) return undefined;
                                const partner = workoutExercises.find(e => e.id === current.supersetWith);
                                return partner?.name;
                            })()}
                            onToggleSuperset={() => {
                                const current = workoutExercises.find(e => e.id === selectedExerciseId);
                                if (current?.supersetWith && onToggleSuperset) {
                                    onToggleSuperset(current.id, current.supersetWith);
                                }
                            }}
                            onSetChange={(index, field, value) => {
                                const newSets = [...activeSets];
                                newSets[index] = { ...newSets[index], [field]: value };

                                // Check for Cycle Rotation if completing first set
                                if (field === 'completed' && value === true) {
                                    if (index === 0 && selectedExerciseId && movementPatterns.length > 0) {
                                        if (shouldSuggestRotation(newSets)) {
                                            const activeExerciseId = workoutExercises.find(e => e.id === selectedExerciseId)?.exerciseId;
                                            if (activeExerciseId) {
                                                const pattern = movementPatterns.find(p => p.exerciseIds.includes(activeExerciseId));
                                                if (pattern) {
                                                    const suggestion = getCycleRotationSuggestion(activeExerciseId, pattern, allExercises);
                                                    if (suggestion) {
                                                        suggestion.lastWeight = newSets[0].weight || suggestion.lastWeight;
                                                        setRotationSuggestion(suggestion);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                onSetChange(selectedExerciseId, newSets);
                            }}
                            onAddSet={() => {
                                const newSets = [...activeSets, { setNumber: activeSets.length + 1, completed: false, weight: null, reps: null, rpe: null }];
                                onSetChange(selectedExerciseId, newSets);
                            }}
                            onStartRest={() => {
                                // Default rest time is 90 seconds
                                startRestTimer(90);
                            }}
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
                            availablePlates={availablePlates}
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
                                ${ex.supersetGroup ? 'border-l-4 border-l-blue-500' : ''}
                            `}
                                >
                                    {/* Drag Handle */}
                                    <div className="text-slate-600 cursor-move py-2">⋮⋮</div>

                                    <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800`}>
                                        {ex.imageUrl ? (
                                            <img src={ex.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold uppercase">
                                                {(ex.muscleGroup || '').slice(0, 2)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold text-base truncate ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                                {ex.name}
                                            </h3>
                                            {ex.supersetGroup && (
                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                    LINKED
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="uppercase">{ex.muscleGroup}</span>
                                            {isCompleted && <span>• {workoutExercisesData[ex.id]?.sets?.length} Sets</span>}
                                        </div>
                                    </div>

                                    {/* Superset Link Button (Only if option enabled) */}
                                    {showSupersetOptions && onToggleSuperset && index < workoutExercises.length - 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const nextEx = workoutExercises[index + 1];
                                                onToggleSuperset(ex.id, nextEx.id);
                                            }}
                                            className={`
                                            p-2 rounded-lg transition-all
                                            ${ex.supersetWith === workoutExercises[index + 1].id
                                                    ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30'
                                                    : 'text-slate-600 hover:text-blue-400 hover:bg-slate-800'
                                                }
                                        `}
                                            title={ex.supersetWith === workoutExercises[index + 1].id ? "Unlink Superset" : "Link with next exercise"}
                                        >
                                            🔗
                                        </button>
                                    )}

                                    {/* Checkmark */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
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

            {/* CYCLE ROTATION MODAL */}
            {rotationSuggestion && (
                <CycleRotationModal
                    suggestion={rotationSuggestion}
                    onAccept={() => {
                        const newEx = allExercises.find(e => e.id === rotationSuggestion.nextExerciseId);
                        if (newEx) {
                            onReplaceExercise(rotationSuggestion.currentExerciseId, newEx);
                            showToast(`Switched rotation to ${rotationSuggestion.nextExerciseName}`, 'success');
                        }
                        setRotationSuggestion(null);
                    }}
                    onDecline={() => setRotationSuggestion(null)}
                />
            )}
        </div>
    );
}
