import { useState } from 'react';
import { SetEntryRow } from './SetEntryRow';
import { ExerciseInstructionsModal } from './ExerciseInstructionsModal';
import { ExerciseGif } from './ExerciseGif';
import type { ActiveSet, Exercise, MuscleGroup } from '../types.ts';

interface ActiveWorkoutCardProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
  note?: string;
  // Superset Props
  isSupersetWith?: string;
  // supersetGroup?: string;
  onToggleSuperset?: () => void;

  onSetChange: (index: number, field: string, value: any) => void;
  onAddSet: () => void;
  onStartRest: (seconds: number) => void;
  onNoteChange: (note: string) => void;
  onOpenHistory?: () => void;
  isDeload: boolean;
  showRPE: boolean;
  show1RM: boolean;
  showPlateCalculator: boolean;
  availablePlates?: number[];
  allExercises: Exercise[];
  historicalPRData?: import('../utils/PRTracker').SetPR[];
}

export function ActiveWorkoutCard({
  exerciseId,
  exerciseName,
  muscleGroup,
  sets,
  note,
  onSetChange,
  onAddSet,
  onStartRest,
  onNoteChange,
  onOpenHistory,
  isDeload,
  showRPE,
  show1RM,
  showPlateCalculator,
  availablePlates,
  allExercises,
  isSupersetWith,
  onToggleSuperset,
  historicalPRData,
}: ActiveWorkoutCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const currentExercise = allExercises.find(ex => ex.id === exerciseId) 
                         || allExercises.find(ex => ex.name === exerciseName);

  const handleCompleteSet = (index: number) => {
    const set = sets[index];
    if (!set.completed && set.weight && set.reps) {
      onSetChange(index, 'completed', true);
      // Auto-start rest timer
      onStartRest(90); // Default 90s
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header with animated exercise GIF */}
        <div className="relative h-40 bg-slate-900 overflow-hidden">
          {currentExercise?.images && currentExercise.images.length > 0 ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <ExerciseGif
                  images={currentExercise.images}
                  muscleGroup={muscleGroup as MuscleGroup}
                  size="lg"
                  className="w-full h-full"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            </>
          ) : currentExercise?.imageUrl ? (
            <>
              <img
                src={currentExercise.imageUrl}
                alt={exerciseName}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 to-slate-900" />
          )}

          {/* Exercise Info Overlay */}
          <div className="relative h-full flex items-end p-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1 truncate">{exerciseName}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase">
                  {muscleGroup}
                </span>
                {isDeload && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full text-xs font-bold">
                    DELOAD
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-xl text-white transition-all press-effect"
                  title="View History"
                >
                  <span className="text-sm">📊</span>
                </button>
              )}
              <button
                onClick={() => setShowInstructions(true)}
                className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-xl text-white transition-all press-effect"
                title="Instructions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Superset Badge */}
        {isSupersetWith && (
          <div className="px-4 py-2 bg-accent/20 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-sm">🔗 SUPERSET WITH:</span>
              <span className="text-card-foreground text-sm">{isSupersetWith}</span>
            </div>
            {onToggleSuperset && (
              <button
                onClick={onToggleSuperset}
                className="text-xs text-destructive hover:text-destructive-foreground px-2 py-1 rounded hover:bg-destructive transition-all"
              >
                Remove Superset
              </button>
            )}
          </div>
        )}

        {/* Sets */}
        <div className="p-4 space-y-2">
          {/* Column Headers */}
          <div
            className="grid gap-2 px-2 pb-2 text-xs font-bold text-slate-500 uppercase"
            style={{ gridTemplateColumns: showRPE ? '40px 1fr 1fr 50px 40px' : '40px 1fr 1fr 40px' }}
          >
            <div className="text-center">Set</div>
            <div>Weight</div>
            <div>Reps</div>
            {showRPE && <div className="text-center">RPE</div>}
            <div className="text-center">✓</div>
          </div>

          {sets.map((set, index) => {
            const previousSetInfo = historicalPRData?.find(s => s.exerciseId === exerciseId && s.setNumber === set.setNumber);
            return (
              <SetEntryRow
                key={index}
                setNumber={set.setNumber}
                weight={set.weight ?? undefined}
                reps={set.reps ?? undefined}
                previousWeight={previousSetInfo?.weight}
                previousReps={previousSetInfo?.reps}
                rpe={set.rpe ?? undefined}
                completed={set.completed}
                isPR={set.isPR}
                prType={set.prType}
              previousBest={undefined}
              setType={set.setType}
              onSetTypeChange={(type) => onSetChange(index, 'setType', type)}
              onWeightChange={(weight) => onSetChange(index, 'weight', weight)}
              onRepsChange={(reps) => onSetChange(index, 'reps', reps)}
              onRPEChange={(rpe) => onSetChange(index, 'rpe', rpe)}
              onCompletedChange={(completed) => {
                if (completed && set.weight && set.reps) {
                  // Only trigger once — handleCompleteSet calls onSetChange internally
                  handleCompleteSet(index);
                } else {
                  onSetChange(index, 'completed', completed);
                }
              }}
              showRPE={showRPE}
              show1RM={show1RM}
              showPlateCalculator={showPlateCalculator}
              availablePlates={availablePlates}
            />
          );
        })}

          {/* Add Set Button */}
          <button
            onClick={onAddSet}
            className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 text-slate-500 hover:text-emerald-400 font-medium transition-all hover:bg-emerald-950/10 press-effect"
          >
            + Add Set
          </button>
        </div>

        {/* Notes Section */}
        <div className="px-4 pb-4">
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea
                value={note || ''}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Add notes about this exercise..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none"
                rows={3}
              />
              <button
                onClick={() => setShowNoteInput(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide notes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-primary transition-all"
            >
              {note ? '📝 Edit notes' : '+ Add notes'}
            </button>
          )}
        </div>

        {/* Stats Footer */}
        <div className="px-4 py-3 bg-slate-800/30 border-t border-white/5 flex justify-between text-sm">
          <div>
            <span className="text-slate-500">Volume:</span>
            <span className="ml-1.5 text-emerald-400 font-bold">
              {sets.reduce((sum, set) =>
                set.completed && set.weight && set.reps && set.setType !== 'warmup'
                  ? sum + (set.weight * set.reps)
                  : sum, 0
              ).toLocaleString()} kg
            </span>
          </div>
          <div>
            <span className="text-slate-500">Sets:</span>
            <span className="ml-1.5 text-white font-bold">
              {sets.filter(s => s.completed).length}/{sets.length}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      <ExerciseInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        exerciseName={exerciseName}
        instructions={currentExercise?.instructions}
        imageUrl={currentExercise?.imageUrl}
        equipment={currentExercise?.equipment}
        primaryMuscles={currentExercise?.primaryMuscles}
        secondaryMuscles={currentExercise?.secondaryMuscles}
      />
    </>
  );
}
