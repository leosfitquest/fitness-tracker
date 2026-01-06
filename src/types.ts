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
    userId: string;
    name: string;
    description?: string;
    exerciseCount: number;
    estimatedDuration?: number;
    lastPerformed?: string;
    createdAt?: string;
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

// --- Social Features ---

export type UserProfile = {
    id: string; // references auth.users.id
    username: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
    created_at: string;
};

export type Follow = {
    follower_id: string;
    following_id: string;
    created_at: string;
};

export type SessionLike = {
    id: string;
    user_id: string;
    session_id: string;
    created_at: string;
};

export type SessionComment = {
    id: string;
    user_id: string;
    session_id: string;
    content: string;
    created_at: string;
    user?: UserProfile; // Joined data
};

// A "Feed Item" is essentially a WorkoutSessionLog with extra social data
export type FeedItem = WorkoutSessionLog & {
    user: UserProfile; // The creator
    likes_count: number;
    comments_count: number;
    has_liked: boolean; // Computed for current user
    latest_comments?: SessionComment[];
};

export type Notification = {
    id: string;
    user_id: string; // Recipient
    actor_id: string; // Who triggered it
    type: 'follow' | 'like' | 'comment';
    entity_id?: string; // session_id, etc.
    is_read: boolean;
    created_at: string;
    actor?: UserProfile; // Joined data
};
