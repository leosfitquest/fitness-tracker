import { useState } from 'react';
import { SetEntryRow } from './SetEntryRow';
import { ExerciseInstructionsModal } from './ExerciseInstructionsModal';
import type { ActiveSet, Exercise } from '../App';

interface ActiveWorkoutCardProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
  note?: string;
  // Superset Props
  isSupersetWith?: string; // Name of other exercise
  supersetGroup?: string;
  onToggleSuperset?: () => void;
  
  onSetChange: (index: number, field: string, value: any) => void;
  onAddSet: () => void;
  onStartRest: (seconds: number) => void;
  onNoteChange: (note: string) => void;
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
  isDeload,
  showRPE,
  show1RM,
  showPlateCalculator,
  allExercises,
  isSupersetWith,
  supersetGroup,
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header mit großem Bild */}
        <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
          {currentExercise?.imageUrl && (
            <>
              <img
                src={currentExercise.imageUrl}
                alt={exerciseName}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
            </>
          )}
          
          {/* Exercise Info Overlay */}
          <div className="relative h-full flex items-end p-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{exerciseName}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-full text-xs font-bold uppercase">
                  {muscleGroup}
                </span>
                {isDeload && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-full text-xs font-bold">
                    DELOAD
                  </span>
                )}
              </div>
            </div>

            {/* Info Button */}
            <button
              onClick={() => setShowInstructions(true)}
              className="p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-xl text-white transition-all hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Superset Badge */}
        {isSupersetWith && (
          <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold text-sm">🔗 SUPERSET WITH:</span>
              <span className="text-white text-sm">{isSupersetWith}</span>
            </div>
            {onToggleSuperset && (
              <button
                onClick={onToggleSuperset}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-all"
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
            className="grid gap-2 px-2 pb-2 text-xs font-bold text-slate-400 uppercase"
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
              weight={set.weight}
              reps={set.reps}
              rpe={set.rpe}
              completed={set.completed}
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
            className="w-full py-3 mt-2 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 font-medium transition-all hover:bg-slate-800/50"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
                rows={3}
              />
              <button
                onClick={() => setShowNoteInput(false)}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Hide notes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full py-2 text-sm text-slate-400 hover:text-emerald-400 transition-all"
            >
              {note ? '📝 Edit notes' : '+ Add notes'}
            </button>
          )}
        </div>

        {/* Stats Footer */}
        <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 flex justify-between text-sm">
          <div>
            <span className="text-slate-400">Total Volume:</span>
            <span className="ml-2 text-emerald-400 font-bold">
              {sets.reduce((sum, set) => 
                set.completed && set.weight && set.reps 
                  ? sum + (set.weight * set.reps) 
                  : sum, 0
              )}kg
            </span>
          </div>
          <div>
            <span className="text-slate-400">Completed:</span>
            <span className="ml-2 text-white font-bold">
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
