import { supabase } from './supabase'
import type { Workout, WorkoutSessionLog, ExerciseRecord, WorkoutExercise, RunSession, ExerciseSessionData, ActiveSet } from '../types.ts';
import { calculateSessionXP, calculateNewStreak, calculateLevel } from '../utils/gamification';
import { queueMutation, isOnline, setCacheItem, getCacheItem } from './offlineStore';

// ============= OFFLINE HELPER =============

/** Try a Supabase operation. If offline/fails, queue the mutation and return null. */
async function tryOrQueue<T>(
  operation: () => Promise<T>,
  fallbackQueue?: { table: string; operation: 'insert' | 'update' | 'upsert' | 'delete'; data: any; userId?: string }
): Promise<T | null> {
  try {
    return await operation();
  } catch (err: any) {
    // Network error or fetch failure = offline
    if (!isOnline() || err?.message?.includes('fetch') || err?.message?.includes('network') || err?.code === 'PGRST000') {
      if (fallbackQueue) {
        await queueMutation(fallbackQueue);
        console.info('[Offline] Queued mutation for', fallbackQueue.table);
      }
      return null;
    }
    throw err; // Real DB error, re-throw
  }
}

// ============= WORKOUTS =============

export async function loadWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    // Try cache if offline
    if (!isOnline()) {
      const cached = await getCacheItem<Workout[]>(`workouts-${userId}`);
      return cached || [];
    }
    throw error;
  }

  const workouts = (data || []).map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    name: w.name,
    description: w.description,
    exerciseCount: w.exercise_count,
    estimatedDuration: w.estimated_duration,
    lastPerformed: w.last_performed,
    exercises: normalizeWorkoutExercises(w.exercises)
  }));

  // Cache for offline use
  await setCacheItem(`workouts-${userId}`, workouts).catch(() => {});
  return workouts;
}

/** Safely normalize exercises from DB — handles both old Exercise[] and new WorkoutExercise[] shapes */
function normalizeWorkoutExercises(exercises: any): WorkoutExercise[] {
  if (!exercises || !Array.isArray(exercises)) return [];
  return exercises.map((ex: any) => ({
    id: ex.id || ex.exerciseId || crypto.randomUUID(),
    exerciseId: ex.exerciseId || ex.id || '',
    name: ex.name || 'Unknown Exercise',
    muscleGroup: ex.muscleGroup || 'core',
    imageUrl: ex.imageUrl,
    targetSets: ex.targetSets ?? ex.sets ?? 3,
    targetReps: ex.targetReps ?? (ex.reps ? String(ex.reps) : undefined),
    notes: ex.notes || ex.note,
    note: ex.note || ex.notes,
    supersetWith: ex.supersetWith,
    supersetGroup: ex.supersetGroup,
  }));
}

export async function saveWorkout(workout: Omit<Workout, 'id' | 'exerciseCount' | 'lastPerformed'>, userId: string): Promise<Workout> {
  const normalizedExercises = normalizeWorkoutExercises(workout.exercises);
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: workout.name,
      description: workout.description,
      estimated_duration: workout.estimatedDuration,
      exercise_count: normalizedExercises.length || 0,
      exercises: normalizedExercises,
    })
    .select()
    .single()

  if (error) throw error;
  // Map back through same mapper as loadWorkouts for consistency
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    exerciseCount: data.exercise_count,
    estimatedDuration: data.estimated_duration,
    lastPerformed: data.last_performed,
    exercises: normalizeWorkoutExercises(data.exercises),
  };
}

export async function updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<Workout> {
  // Build clean payload for Supabase (snake_case)
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.exercises !== undefined) payload.exercises = updates.exercises;
  if (updates.exerciseCount !== undefined) payload.exercise_count = updates.exerciseCount;
  if (updates.lastPerformed !== undefined) payload.last_performed = updates.lastPerformed;
  if (updates.estimatedDuration !== undefined) payload.estimated_duration = updates.estimatedDuration;

  const { data, error } = await supabase
    .from('workouts')
    .update(payload)
    .eq('id', workoutId)
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    exerciseCount: data.exercise_count,
    estimatedDuration: data.estimated_duration,
    lastPerformed: data.last_performed,
    exercises: normalizeWorkoutExercises(data.exercises),
  };
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)

  if (error) throw error
}

// ============= SESSIONS =============

/** Normalize exercise session data for clean DB storage */
function normalizeExercisesForStorage(exercises: ExerciseSessionData[]): any[] {
  return exercises.map(ex => ({
    exerciseId: ex.exerciseId,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    note: ex.note || '',
    volume: ex.volume || 0,
    sets: (ex.sets || []).map((s: ActiveSet) => ({
      setNumber: s.setNumber,
      weight: s.weight ?? null,
      reps: s.reps ?? null,
      rpe: s.rpe ?? null,
      completed: s.completed ?? false,
      setType: s.setType || 'normal',
      isPR: s.isPR || false,
      prType: s.prType || 'none',
    })),
  }));
}

/** Reconstruct ExerciseSessionData from stored JSONB */
function deserializeExercises(raw: any[]): ExerciseSessionData[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((ex: any) => ({
    exerciseId: ex.exerciseId || ex.exercise_id || '',
    name: ex.name || 'Unknown',
    muscleGroup: ex.muscleGroup || ex.muscle_group || 'core',
    note: ex.note || ex.notes || '',
    volume: ex.volume ?? 0,
    sets: (ex.sets || []).map((s: any, i: number) => ({
      setNumber: s.setNumber ?? s.set_number ?? (i + 1),
      weight: s.weight ?? null,
      reps: s.reps ?? null,
      rpe: s.rpe ?? null,
      completed: s.completed ?? false,
      setType: s.setType ?? s.set_type ?? 'normal',
      isPR: s.isPR ?? s.is_pr ?? false,
      prType: s.prType ?? s.pr_type ?? 'none',
    })),
  }));
}

export async function saveSessionLog(log: WorkoutSessionLog, userId: string): Promise<WorkoutSessionLog> {
  // Normalize exercises for clean storage
  const normalizedExercises = normalizeExercisesForStorage(log.exercises);

  const sessionData: any = {
    user_id: userId,
    workout_id: log.workoutId,
    workout_name: log.workoutName,
    started_at: log.startedAt,
    ended_at: log.endedAt,
    duration_minutes: log.durationMinutes,
    total_volume: log.totalVolume,
    total_sets: log.totalSetsCompleted,
    is_deload: log.isDeload,
    notes: log.notes,
    exercises: normalizedExercises,
  };

  if (log.durationSeconds) sessionData.duration_seconds = log.durationSeconds;
  if (log.newPRs && log.newPRs.length > 0) sessionData.new_prs = log.newPRs;

  const result = await tryOrQueue(
    async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert(sessionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    { table: 'workout_sessions', operation: 'insert', data: sessionData, userId }
  );

  // --- Gamification Logic ---
  try {
    const { totalXP } = calculateSessionXP(log);
    const profile = await getProfile(userId);
    if (!profile) throw new Error('Profile not found');

    // Streak Logic
    let newStreak = calculateNewStreak(
      profile.current_streak || 0,
      profile.last_workout_date,
      new Date(log.endedAt)
    );

    // Freeze Consumption Logic
    let streakFreezes = profile.streak_freezes !== undefined ? profile.streak_freezes : 2;

    const last = profile.last_workout_date ? new Date(profile.last_workout_date) : null;
    if (last) {
      const current = new Date(log.endedAt);
      const diffTime = Math.abs(current.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (newStreak === 1 && (profile.current_streak || 0) > 0 && diffDays > 7) {
        if (streakFreezes > 0) {
          streakFreezes--;
          newStreak = (profile.current_streak || 0) + 1;
        }
      }
    }

    const newTotalXP = (profile.xp || 0) + totalXP;
    const newLevel = calculateLevel(newTotalXP);
    const longestStreak = Math.max(profile.longest_streak || 0, newStreak);

    await updateProfile(userId, {
      xp: newTotalXP,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_workout_date: log.endedAt,
      streak_freezes: streakFreezes
    });

  } catch (err) {
    console.error("Failed to update gamification stats:", err);
  }

  // Return reconstructed log
  if (result) {
    return {
      ...log,
      id: result.id,
    };
  }

  // Offline: return with local ID
  return { ...log, id: log.id || crypto.randomUUID() };
}

export async function loadSessionLogs(userId: string): Promise<WorkoutSessionLog[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) {
    if (!isOnline()) {
      const cached = await getCacheItem<WorkoutSessionLog[]>(`sessions-${userId}`);
      return cached || [];
    }
    throw error;
  }

  const sessions = (data || []).map((l: any) => ({
    id: l.id,
    workoutId: l.workout_id,
    workoutName: l.workout_name,
    startedAt: l.started_at,
    endedAt: l.ended_at,
    durationMinutes: l.duration_minutes,
    durationSeconds: l.duration_seconds,
    totalVolume: Number(l.total_volume),
    totalSetsCompleted: l.total_sets,
    isDeload: l.is_deload,
    notes: l.notes,
    exercises: deserializeExercises(l.exercises),
    newPRs: l.new_prs || []
  }));

  // Cache for offline
  await setCacheItem(`sessions-${userId}`, sessions).catch(() => {});
  return sessions;
}

// ============= EXERCISE RECORDS =============

export async function upsertExerciseRecord(record: ExerciseRecord, userId: string): Promise<ExerciseRecord> {
  const payload = {
    user_id: userId,
    exercise_id: record.exerciseId,
    exercise_name: record.exerciseName,
    best_volume: record.bestVolume,
    best_set: record.bestSet,
    estimated_1rm: record.estimated1RM,
    updated_at: new Date().toISOString()
  };

  const result = await tryOrQueue(
    async () => {
      const { data, error } = await supabase
        .from('exercise_records')
        .upsert(payload, { onConflict: 'user_id,exercise_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    { table: 'exercise_records', operation: 'upsert', data: payload, userId }
  );

  return result || record;
}

export async function loadExerciseRecords(userId: string): Promise<Record<string, ExerciseRecord>> {
  const { data, error } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    if (!isOnline()) {
      const cached = await getCacheItem<Record<string, ExerciseRecord>>(`records-${userId}`);
      return cached || {};
    }
    throw error;
  }

  const recordsMap: Record<string, ExerciseRecord> = {};
  (data || []).forEach((r: any) => {
    recordsMap[r.exercise_id] = {
      exerciseId: r.exercise_id,
      exerciseName: r.exercise_name,
      bestVolume: Number(r.best_volume),
      bestSet: r.best_set,
      estimated1RM: Number(r.estimated_1rm)
    };
  });

  await setCacheItem(`records-${userId}`, recordsMap).catch(() => {});
  return recordsMap;
}

// ============= SOCIAL FEATURES =============

// --- Profiles ---

export async function getProfile(userId: string): Promise<import('../types.ts').UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    if (!isOnline()) {
      return getCacheItem<import('../types.ts').UserProfile>(`profile-${userId}`);
    }
    throw error;
  }

  if (data) {
    await setCacheItem(`profile-${userId}`, data).catch(() => {});
  }
  return data || null;
}

export async function updateProfile(userId: string, updates: Partial<import('../types.ts').UserProfile>): Promise<import('../types.ts').UserProfile> {
  // Strip undefined values — Supabase sends them as null which can violate NOT NULL constraints
  const cleanUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      cleanUpdates[key] = value;
    }
  }

  // Try UPDATE first (works for existing profiles)
  const { data: updateData, error: updateError } = await supabase
    .from('user_profiles')
    .update(cleanUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (updateData) return updateData;

  // If update found no row (PGRST116 = no rows), INSERT instead (new user)
  if (updateError?.code === 'PGRST116') {
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({ id: userId, ...cleanUpdates })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertData;
  }

  if (updateError) throw updateError;
  throw new Error('Unexpected profile update state');
}

export async function searchUsers(query: string): Promise<import('../types.ts').UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// --- Following ---

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function getFollowers(userId: string): Promise<import('../types.ts').UserProfile[]> {
  // Get IDs first
  const { data: follows, error: followError } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', userId);

  if (followError) throw followError;
  if (!follows || follows.length === 0) return [];

  const ids = follows.map(f => f.follower_id);
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', ids);

  if (profileError) throw profileError;
  return profiles || [];
}

export async function getFollowing(userId: string): Promise<import('../types.ts').UserProfile[]> {
  const { data: follows, error: followError } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followError) throw followError;
  if (!follows || follows.length === 0) return [];

  const ids = follows.map(f => f.following_id);
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', ids);

  if (profileError) throw profileError;
  return profiles || [];
}

// --- Feed & Interaction ---

export async function shareSessionToFeed(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ is_shared: true }) // SQL uses is_shared
    .eq('id', sessionId);

  if (error) {
    console.warn("Could not set is_shared.", error);
  }
}

export async function getUserFeed(userId: string, limit = 20, offset = 0): Promise<import('../types.ts').FeedItem[]> {
  const { data, error } = await supabase
    .rpc('get_user_feed', { user_id_param: userId, limit_param: limit, offset_param: offset });

  if (error) throw error;

  return (data || []).map((s: any) => ({
    id: s.session_id,
    workoutId: s.workout_name,
    workoutName: s.workout_name,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    durationMinutes: s.duration_minutes,
    totalVolume: s.total_volume,
    totalSetsCompleted: s.total_sets,
    isDeload: s.is_deload,
    exercises: deserializeExercises(s.exercises),
    newPRs: s.new_prs,

    // Social
    user: {
      id: s.user_id,
      username: s.username,
      avatar_url: s.avatar_url
    } as import('../types.ts').UserProfile,
    likes_count: s.likes_count,
    comments_count: s.comments_count,
    has_liked: s.user_has_liked
  }));
}

export async function likeSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('session_likes')
    .insert({ user_id: userId, session_id: sessionId });
  if (error) throw error;
}

export async function unlikeSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('session_likes')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);
  if (error) throw error;
}

export async function getComments(sessionId: string): Promise<import('../types.ts').SessionComment[]> {
  const { data, error } = await supabase
    .from('session_comments')
    .select('*, user:user_profiles(*)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addComment(userId: string, sessionId: string, content: string): Promise<import('../types.ts').SessionComment> {
  const { data, error } = await supabase
    .from('session_comments')
    .insert({ user_id: userId, session_id: sessionId, comment: content }) // SQL uses comment
    .select('*, user:user_profiles(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function getNotifications(userId: string): Promise<import('../types.ts').Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, from_user:user_profiles!from_user_id(*)') // Manual join hint might be needed or just relational
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function markNotificationsRead(notificationIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds);

  if (error) throw error;
}

// --- Custom Exercises ---
export async function getCustomExercises(userId: string): Promise<import('../types.ts').CustomExercise[]> {
  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCustomExercise(
  exercise: Omit<import('../types.ts').CustomExercise, 'id' | 'created_at'>
): Promise<import('../types.ts').CustomExercise> {
  const { data, error } = await supabase
    .from('custom_exercises')
    .insert(exercise)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const { error } = await supabase.from('custom_exercises').delete().eq('id', id);
  if (error) throw error;
}

// --- Body Measurements ---
export async function getBodyMeasurements(userId: string): Promise<import('../types.ts').BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBodyMeasurement(
  measurement: Omit<import('../types.ts').BodyMeasurement, 'id'>
): Promise<import('../types.ts').BodyMeasurement> {
  const { data, error } = await supabase
    .from('body_measurements')
    .insert(measurement)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  const { error } = await supabase.from('body_measurements').delete().eq('id', id);
  if (error) throw error;
}

// ============= RUN SESSIONS =============

export async function saveRunSession(session: Omit<RunSession, 'id'>, userId: string): Promise<RunSession> {
  const { data, error } = await supabase
    .from('run_sessions')
    .insert({
      user_id: userId,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      duration_seconds: session.durationSeconds,
      distance_km: session.distanceKm,
      avg_pace_min_km: session.avgPaceMinKm,
      calories_burned: session.caloriesBurned,
      route: session.route,
      notes: session.notes,
      run_type: session.runType,
      elevation_gain: session.elevationGain,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRunSession(data);
}

export async function loadRunSessions(userId: string): Promise<RunSession[]> {
  const { data, error } = await supabase
    .from('run_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []).map(mapRunSession);
}

export async function deleteRunSession(id: string): Promise<void> {
  const { error } = await supabase.from('run_sessions').delete().eq('id', id);
  if (error) throw error;
}

function mapRunSession(r: any): RunSession {
  return {
    id: r.id,
    userId: r.user_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
    distanceKm: Number(r.distance_km),
    avgPaceMinKm: Number(r.avg_pace_min_km),
    caloriesBurned: r.calories_burned ? Number(r.calories_burned) : undefined,
    route: r.route || [],
    notes: r.notes,
    runType: r.run_type,
    elevationGain: r.elevation_gain ? Number(r.elevation_gain) : undefined,
  };
}

// ============= FRIENDS DAILY STEPS (for leaderboard) =============

export async function getFriendsDailySteps(userId: string, date: string): Promise<{ userId: string; username: string; avatarUrl?: string; steps: number }[]> {
  // Get following IDs
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (!follows || follows.length === 0) return [];

  const ids = follows.map(f => f.following_id);

  // Get their steps for today
  const { data: stepsData } = await supabase
    .from('daily_steps')
    .select('user_id, steps')
    .in('user_id', ids)
    .eq('date', date);

  // Get their profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const stepsMap = new Map((stepsData || []).map(s => [s.user_id, s.steps]));

  return ids.map(id => {
    const profile = profileMap.get(id);
    return {
      userId: id,
      username: profile?.username || 'Unknown',
      avatarUrl: profile?.avatar_url,
      steps: stepsMap.get(id) || 0,
    };
  });
}