import type { ActiveSet, MovementPattern, CycleRotationSuggestion, Exercise } from '../types.ts';

export const MOVEMENT_PATTERN_DEFAULTS = [
  { type: 'horizontal_push', name: 'Horizontal Push (Chest)' },
  { type: 'vertical_push', name: 'Vertical Push (Shoulders)' },
  { type: 'horizontal_pull', name: 'Horizontal Pull (Rows)' },
  { type: 'vertical_pull', name: 'Vertical Pull (Lats)' },
  { type: 'squat', name: 'Knee Dominant (Quads/Glutes)' },
  { type: 'hinge', name: 'Hip Dominant (Hamstrings/Lower Back)' },
  { type: 'isolation_biceps', name: 'Biceps Isolation' },
  { type: 'isolation_triceps', name: 'Triceps Isolation' }
];

/**
 * Checks if the first set of an exercise indicates the user should rotate exercises.
 * The trigger condition is completing a first set with fewer than 4 reps (≤ 3).
 * This indicates lifting near max intensity, which is a good time to rotate.
 */
export function shouldSuggestRotation(sets: ActiveSet[]): boolean {
  if (!sets || sets.length === 0) return false;
  
  const firstSet = sets[0];
  
  // Need valid data on the first set
  if (!firstSet.completed || firstSet.reps === null || firstSet.weight === null) return false;
  
  // Condition: ≤ 3 reps on the first set
  return firstSet.reps <= 3;
}

/**
 * Given a pattern, determines the next exercise in the cycle.
 */
export function getCycleRotationSuggestion(
  currentExerciseId: string, 
  pattern: MovementPattern,
  allAppExercises: Exercise[]
): CycleRotationSuggestion | null {
  if (!pattern || !pattern.exerciseIds || pattern.exerciseIds.length <= 1) return null;
  
  const currentIdx = pattern.exerciseIds.indexOf(currentExerciseId);
  if (currentIdx === -1) return null;
  
  const nextIdx = (currentIdx + 1) % pattern.exerciseIds.length;
  const nextExerciseId = pattern.exerciseIds[nextIdx];
  
  if (!nextExerciseId) return null;
  
  // Find exercise details for UI
  const nextExercise = allAppExercises.find(e => e.id === nextExerciseId);
  if (!nextExercise) return null;
  
  // Look up history for the next exercise to tell user what they lifted last time
  const historyEntry = pattern.cycleHistory.find(h => h.exerciseId === nextExerciseId);
  
  return {
    patternId: pattern.id,
    patternName: pattern.name,
    currentExerciseId,
    nextExerciseId,
    nextExerciseName: nextExercise.name,
    lastWeight: historyEntry?.endWeight
  };
}
