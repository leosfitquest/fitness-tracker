export interface SetPR {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  date: string;
}

export interface PRComparison {
  isPR: boolean;
  improvement: 'weight' | 'reps' | 'both' | 'none';
  previousBest?: SetPR;
  difference?: {
    weight: number;
    reps: number;
  };
}

// Check if current set is a PR compared to previous sessions
export function checkSetPR(
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  previousSessions: SetPR[]
): PRComparison {
  // Find all previous sets for this exercise at this set number
  const relevantSets = previousSessions.filter(
    s => s.exerciseId === exerciseId && s.setNumber === setNumber
  );

  if (relevantSets.length === 0) {
    return { isPR: true, improvement: 'both' }; // First time doing this exercise
  }

  // Find best previous set (by volume = weight * reps, then by weight)
  const previousBest = relevantSets.reduce((best, current) => {
    const currentVolume = current.weight * current.reps;
    const bestVolume = best.weight * best.reps;
    
    if (currentVolume > bestVolume) return current;
    if (currentVolume === bestVolume && current.weight > best.weight) return current;
    return best;
  });

  const currentVolume = weight * reps;
  const previousVolume = previousBest.weight * previousBest.reps;

  // Check if it's a PR
  const isPR = currentVolume > previousVolume || 
               (currentVolume === previousVolume && weight > previousBest.weight);

  if (!isPR) {
    return { isPR: false, improvement: 'none', previousBest };
  }

  // Determine type of improvement
  let improvement: 'weight' | 'reps' | 'both' | 'none' = 'none';
  
  if (weight > previousBest.weight && reps > previousBest.reps) {
    improvement = 'both';
  } else if (weight > previousBest.weight) {
    improvement = 'weight';
  } else if (reps > previousBest.reps) {
    improvement = 'reps';
  }

  return {
    isPR: true,
    improvement,
    previousBest,
    difference: {
      weight: weight - previousBest.weight,
      reps: reps - previousBest.reps,
    },
  };
}

// Calculate all PRs for a workout session
export function calculateSessionPRs(
  exercises: Array<{
    exerciseId: string;
    sets: Array<{ setNumber: number; weight: number; reps: number; completed: boolean }>;
  }>,
  previousSessions: SetPR[]
): Map<string, PRComparison[]> {
  const prMap = new Map<string, PRComparison[]>();

  exercises.forEach(exercise => {
    const exercisePRs: PRComparison[] = [];
    
    exercise.sets.forEach(set => {
      if (set.completed && set.weight && set.reps) {
        const pr = checkSetPR(
          exercise.exerciseId,
          set.setNumber,
          set.weight,
          set.reps,
          previousSessions
        );
        exercisePRs.push(pr);
      } else {
        exercisePRs.push({ isPR: false, improvement: 'none' });
      }
    });

    prMap.set(exercise.exerciseId, exercisePRs);
  });

  return prMap;
}

// Get PR summary for display
export function getPRSummary(prComparisons: PRComparison[]): {
  totalPRs: number;
  byType: { weight: number; reps: number; both: number };
} {
  const summary = {
    totalPRs: 0,
    byType: { weight: 0, reps: 0, both: 0 },
  };

  prComparisons.forEach(pr => {
    if (pr.isPR) {
      summary.totalPRs++;
      if (pr.improvement === 'weight') summary.byType.weight++;
      if (pr.improvement === 'reps') summary.byType.reps++;
      if (pr.improvement === 'both') summary.byType.both++;
    }
  });

  return summary;
}
