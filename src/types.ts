export const MUSCLE_GROUPS = [
    "chest", "back", "legs", "shoulders", "arms", "core", "glutes",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Exercise = {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    reps?: number;
    sets?: number;
    imageUrl?: string;
    userImageUrl?: string;
    note?: string;
    instructions?: string[];
    equipment?: string | null;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
};

// WorkoutExercise: entries inside a Workout (supports superset metadata)
export interface WorkoutExercise {
    id: string; // unique id for the workout entry (we use exercise id by default)
    exerciseId: string; // id referencing the base Exercise
    name: string;
    muscleGroup: MuscleGroup;
    imageUrl?: string;
    targetSets?: number;
    targetReps?: string;
    notes?: string;
    note?: string; // legacy alias for compatibility
    // Superset support
    supersetWith?: string; // ID of the exercise to superset with
    supersetGroup?: string; // Unique ID for the superset group (e.g., "superset-1")
}

export type Workout = {
    id: string;
    name: string;
    description?: string;
    exerciseCount: number;
    estimatedDuration?: number;
    lastPerformed?: string;
    exercises: Exercise[];
};

export type ActiveSet = {
    setNumber: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    completed: boolean;
    // PR flags
    isPR?: boolean;
    prType?: 'weight' | 'reps' | 'both' | 'none';
};

export type ExerciseSessionData = {
    exerciseId: string;
    name: string;
    muscleGroup: string;
    note?: string;
    sets: ActiveSet[];
    volume: number;
};

export type PersonalRecord = {
    exerciseId: string;
    exerciseName: string;
    type: 'volume' | '1RM' | 'reps';
    oldValue: number;
    newValue: number;
    achievedAt: string;
};

export type WorkoutSessionLog = {
    id: string;
    workoutId: string;
    workoutName: string;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    durationSeconds?: number;
    totalVolume: number;
    totalSetsCompleted: number;
    isDeload: boolean;
    notes?: string;
    exercises: ExerciseSessionData[];
    newPRs?: PersonalRecord[];
};

export type ExerciseRecord = {
    exerciseId: string;
    exerciseName: string;
    bestVolume: number;
    bestSet: { weight: number; reps: number; date?: string };
    estimated1RM: number;
};

// Session-level set PRs
export type SessionSetPR = {
    setNumber: number;
    weight: number;
    reps: number;
    improvement: 'weight' | 'reps' | 'both' | 'none';
};
