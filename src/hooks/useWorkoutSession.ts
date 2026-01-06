import { useState, useEffect } from 'react';
import type { Workout, WorkoutExercise, ExerciseSessionData, ActiveSet } from '../types.ts';

export function useWorkoutSession() {
  // UI Mode + selection state
  const [mode, setMode] = useState<'overview' | 'active'>('overview');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Session State
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isDeload, setIsDeload] = useState(false);
  const [sessionPRs, setSessionPRs] = useState<any[]>([]);

  // Data State
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [workoutExercisesData, setWorkoutExercisesData] = useState<Record<string, ExerciseSessionData>>({});
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([]);

  // Timer for duration
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);

  // Auto-update elapsed time
  useEffect(() => {
    let interval: number;
    if (workoutStarted && workoutStartTime) {
      interval = window.setInterval(() => {
        setWorkoutElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workoutStarted, workoutStartTime]);

  // Start a new session from a workout template
  const startSession = (workout: Workout) => {
    // setWorkoutStarted(true); // Don't auto-start
    setActiveWorkoutId(workout.id);
    setSelectedWorkoutId(workout.id);
    setSessionStart(new Date().toISOString());
    setWorkoutStartTime(Date.now()); // This might need to be reset when actually starting?
    setWorkoutExercises(workout.exercises.map(ex => ({
      ...ex,
      exerciseId: ex.id,
      targetSets: ex.sets,
      targetReps: ex.reps?.toString(),
    })));

    // Initialize data for each exercise
    const initialData: Record<string, ExerciseSessionData> = {};
    workout.exercises.forEach(ex => {
      initialData[ex.id] = {
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: Array(ex.sets || 3).fill(null).map((_, i) => ({
          setNumber: i + 1,
          weight: null,
          reps: null,
          rpe: null,
          completed: false
        })),
        volume: 0
      };
    });
    setWorkoutExercisesData(initialData);
  };

  const restoreSession = (state: any) => {
    setActiveWorkoutId(state.selectedWorkoutId);
    setWorkoutExercises(state.workoutExercises || []);
    setWorkoutExercisesData(state.workoutExercisesData || {});
    setSessionStart(state.sessionStart);
    setSessionNotes(state.sessionNotes || "");
    setIsDeload(state.isDeload || false);
    setWorkoutStartTime(state.workoutStartTime);
    setWorkoutStarted(state.workoutStarted || false);
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof ActiveSet, value: any) => {
    setWorkoutExercisesData(prev => {
      const exerciseData = { ...prev[exerciseId] };
      const sets = [...exerciseData.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };

      // Calculate volume if completed
      if (field === 'completed' && value === true) {
        // This logic might need to be more complex if we want to recalc volume dynamically
      }

      return {
        ...prev,
        [exerciseId]: {
          ...exerciseData,
          sets
        }
      };
    });
  };

  const addSet = (exerciseId: string) => {
    setWorkoutExercisesData(prev => {
      const exerciseData = prev[exerciseId];
      const newSetNumber = exerciseData.sets.length + 1;
      // Copy previous set values if available for convenience
      const lastSet = exerciseData.sets[exerciseData.sets.length - 1];

      return {
        ...prev,
        [exerciseId]: {
          ...exerciseData,
          sets: [
            ...exerciseData.sets,
            {
              setNumber: newSetNumber,
              weight: lastSet ? lastSet.weight : null,
              reps: lastSet ? lastSet.reps : null,
              rpe: null,
              completed: false
            }
          ]
        }
      };
    });
  };

  const addExercises = (newExercises: WorkoutExercise[]) => {
    setWorkoutExercises(prev => [...prev, ...newExercises]);

    // Initialize data for new exercises
    setWorkoutExercisesData(prev => {
      const newData = { ...prev };
      newExercises.forEach(ex => {
        if (!newData[ex.id]) {
          newData[ex.id] = {
            exerciseId: ex.id,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: Array(ex.targetSets || 3).fill(null).map((_, i) => ({
              setNumber: i + 1,
              weight: null,
              reps: null,
              rpe: null,
              completed: false
            })),
            volume: 0
          };
        }
      });
      return newData;
    });
  };

  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setWorkoutExercisesData(prev => {
      const newData = { ...prev };
      delete newData[exerciseId];
      return newData;
    });
  };

  const moveExercise = (from: number, to: number) => {
    setWorkoutExercises(prev => {
      const exercises = [...prev];
      if (to < 0 || to >= exercises.length) return prev;
      const [moved] = exercises.splice(from, 1);
      exercises.splice(to, 0, moved);
      return exercises;
    });
  };

  const toggleSuperset = (exerciseId1: string, exerciseId2: string) => {
    setWorkoutExercises(prev => {
      const newExercises = [...prev];
      const idx1 = newExercises.findIndex(ex => ex.id === exerciseId1);
      const idx2 = newExercises.findIndex(ex => ex.id === exerciseId2);

      if (idx1 === -1 || idx2 === -1) return prev;

      const alreadySuperset = newExercises[idx1].supersetWith === exerciseId2;

      if (alreadySuperset) {
        newExercises[idx1].supersetWith = undefined;
        newExercises[idx1].supersetGroup = undefined;
        newExercises[idx2].supersetWith = undefined;
        newExercises[idx2].supersetGroup = undefined;
      } else {
        const supersetId = `superset-${Date.now()}`;
        newExercises[idx1].supersetWith = exerciseId2;
        newExercises[idx1].supersetGroup = supersetId;
        newExercises[idx2].supersetWith = exerciseId1;
        newExercises[idx2].supersetGroup = supersetId;
      }
      return newExercises;
    });
  };

  const saveExerciseData = (exerciseId: string, data: Partial<ExerciseSessionData>) => {
    setWorkoutExercisesData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        ...data
      }
    }));
  };

  const cancelSession = () => {
    setWorkoutStarted(false);
    setActiveWorkoutId(null);
    setSessionStart(null);
    setWorkoutExercises([]);
    setWorkoutExercisesData({});
    setWorkoutStartTime(null);
    setWorkoutElapsedSeconds(0);
  };

  return {
    // State values
    mode,
    selectedWorkoutId,
    selectedExerciseId,
    workoutExercises,
    workoutExercisesData,
    activeSets,
    sessionStart,
    sessionNotes,
    isDeload,
    workoutStartTime,
    workoutElapsedSeconds,
    sessionPRs,

    // ⭐ SETTERS
    setMode,
    setSelectedWorkoutId,
    setSelectedExerciseId,
    setWorkoutExercises,
    setWorkoutExercisesData,
    setActiveSets,
    setSessionStart,
    setSessionNotes,
    setIsDeload,
    setWorkoutStartTime,
    setWorkoutElapsedSeconds,
    setSessionPRs,

    // Original states (for backwards compat)
    workoutStarted,
    setWorkoutStarted,
    activeWorkoutId,

    // Functions (aliases + original)
    startWorkout: startSession,
    completeWorkout: cancelSession,
    selectExercise: (id: string) => setSelectedExerciseId(id),
    saveExercise: saveExerciseData,
    removeExercise,
    moveExercise,
    toggleSuperset,
    addExercisesToWorkout: addExercises,
    applyTemplate: () => {
      // Placeholder: callers should map template -> WorkoutExercise[] and call addExercisesToWorkout
      return;
    },

    // Low-level helpers
    startSession,
    updateSet,
    addSet,
    addExercises,
    // removeExercise, // Already exposed above
    // moveExercise,   // Already exposed above
    // toggleSuperset, // Already exposed above
    // saveExerciseData, // Also exposed as saveExercise
    cancelSession,
    restoreSession,
  };
}
