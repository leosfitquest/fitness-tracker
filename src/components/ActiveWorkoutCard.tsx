import { useState } from 'react';
import { SetEntryRow } from './SetEntryRow';
import { ExerciseInstructionsModal } from './ExerciseInstructionsModal';
import type { ActiveSet, Exercise } from '../types.ts';

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
  allExercises: Exercise[];
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
  allExercises,
  isSupersetWith,
  // supersetGroup,
  onToggleSuperset,
}: ActiveWorkoutCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const currentExercise = allExercises.find(ex => ex.id === exerciseId);

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
      <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header mit großem Bild */}
        <div className="relative h-32 bg-secondary overflow-hidden">
          {currentExercise?.imageUrl && (
            <>
              <img
                src={currentExercise.imageUrl}
                alt={exerciseName}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </>
          )}

          {/* Exercise Info Overlay */}
          <div className="relative h-full flex items-end p-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-card-foreground mb-1">{exerciseName}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-secondary border border-border text-foreground rounded-full text-xs font-bold uppercase">
                  {muscleGroup}
                </span>
                {isDeload && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-full text-xs font-bold">
                    DELOAD
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {/* History Button */}
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="p-3 bg-secondary/80 hover:bg-secondary backdrop-blur-sm rounded-xl text-primary transition-all hover:scale-105"
                  title="View History"
                >
                  <span className="text-lg">📊</span>
                </button>
              )}

              {/* Info Button */}
              <button
                onClick={() => setShowInstructions(true)}
                className="p-3 bg-secondary/80 hover:bg-secondary backdrop-blur-sm rounded-xl text-primary transition-all hover:scale-105"
                title="Instructions"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="grid gap-2 px-2 pb-2 text-xs font-bold text-muted-foreground uppercase"
            style={{ gridTemplateColumns: showRPE ? '40px 1fr 1fr 50px 40px' : '40px 1fr 1fr 40px' }}
          >
            <div className="text-center">Set</div>
            <div>Weight</div>
            <div>Reps</div>
            {showRPE && <div className="text-center">RPE</div>}
            <div className="text-center">✓</div>
          </div>

          {sets.map((set, index) => (
            <SetEntryRow
              key={index}
              setNumber={set.setNumber}
              weight={set.weight ?? undefined}
              reps={set.reps ?? undefined}
              rpe={set.rpe ?? undefined}
              completed={set.completed}
              isPR={set.isPR}
              prType={set.prType}
              previousBest={undefined}
              onWeightChange={(weight) => onSetChange(index, 'weight', weight)}
              onRepsChange={(reps) => onSetChange(index, 'reps', reps)}
              onRPEChange={(rpe) => onSetChange(index, 'rpe', rpe)}
              onCompletedChange={(completed) => {
                onSetChange(index, 'completed', completed);
                if (completed && set.weight && set.reps) {
                  handleCompleteSet(index);
                }
              }}
              showRPE={showRPE}
              show1RM={show1RM}
              showPlateCalculator={showPlateCalculator}
            />
          ))}

          {/* Add Set Button */}
          <button
            onClick={onAddSet}
            className="w-full py-3 mt-2 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary font-medium transition-all hover:bg-secondary/50"
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
        <div className="px-4 py-3 bg-secondary/30 border-t border-border flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Total Volume:</span>
            <span className="ml-2 text-primary font-bold">
              {sets.reduce((sum, set) =>
                set.completed && set.weight && set.reps
                  ? sum + (set.weight * set.reps)
                  : sum, 0
              )}kg
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Completed:</span>
            <span className="ml-2 text-foreground font-bold">
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
