import { supabase } from './supabase'
import type { Workout, WorkoutSessionLog, ExerciseRecord } from '../types.ts';

// ============= WORKOUTS =============

export async function loadWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error;

  return (data || []).map((w: any) => ({
    id: w.id,
    userId: w.user_id,
    name: w.name,
    description: w.description,
    exerciseCount: w.exercise_count,
    estimatedDuration: w.estimated_duration,
    lastPerformed: w.last_performed,
    exercises: w.exercises || []
  }));
}

export async function saveWorkout(workout: Omit<Workout, 'id' | 'exerciseCount' | 'lastPerformed'>, userId: string): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: workout.name,
      description: workout.description,
      estimated_duration: workout.estimatedDuration,
      exercise_count: workout.exercises.length || 0,
      exercises: workout.exercises || [],
    })
    .select()
    .single()

  if (error) throw error
  return data;
}

export async function updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', workoutId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)

  if (error) throw error
}

// ============= SESSIONS =============

export async function saveSessionLog(log: WorkoutSessionLog, userId: string): Promise<WorkoutSessionLog> {
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
    exercises: log.exercises
  };

  if (log.durationSeconds) sessionData.duration_seconds = log.durationSeconds;
  if (log.newPRs) sessionData.new_prs = log.newPRs;

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadSessionLogs(userId: string): Promise<WorkoutSessionLog[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) throw error;

  return (data || []).map((l: any) => ({
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
    exercises: l.exercises || [],
    newPRs: l.new_prs || []
  }));
}

// ============= EXERCISE RECORDS =============

export async function upsertExerciseRecord(record: ExerciseRecord, userId: string): Promise<ExerciseRecord> {
  const { data, error } = await supabase
    .from('exercise_records')
    .upsert({
      user_id: userId,
      exercise_id: record.exerciseId,
      exercise_name: record.exerciseName,
      best_volume: record.bestVolume,
      best_set: record.bestSet,
      estimated_1rm: record.estimated1RM,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,exercise_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadExerciseRecords(userId: string): Promise<Record<string, ExerciseRecord>> {
  const { data, error } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error;

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

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
  return data || null;
}

export async function updateProfile(userId: string, updates: Partial<import('../types.ts').UserProfile>): Promise<import('../types.ts').UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
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
  // In this simple implementation, acts of saving are enough, but we might toggle a "public" flag
  // For now, let's assume all saved sessions are potentially feed items if user is public.
  // We could add a 'shared_at' timestamp to the session log if we want explicit sharing.
  const { error } = await supabase
    .from('workout_sessions')
    .update({ is_public: true, shared_at: new Date().toISOString() }) // Assuming we added these columns or use simple logic
    .eq('id', sessionId);

  if (error) {
    // If columns don't exist, we might just ignore for phase 1 or rely on query logic
    console.warn("Could not set shared_at. Ensure DB schema has is_public/shared_at columns.");
  }
}

export async function getUserFeed(userId: string): Promise<import('../types.ts').FeedItem[]> {
  // 1. Get who we follow
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (following || []).map(f => f.following_id);
  followingIds.push(userId); // Include self

  // 2. Fetch sessions from these users
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      user:user_profiles(*),
      likes:session_likes(count),
      comments:session_comments(count)
    `)
    .in('user_id', followingIds)
    .order('ended_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  // 3. Check if *we* liked them
  // (Optimization: fetch our likes for these session IDs in one go)
  const sessionIds = sessions.map((s: any) => s.id);
  const { data: myLikes } = await supabase
    .from('session_likes')
    .select('session_id')
    .eq('user_id', userId)
    .in('session_id', sessionIds);

  const myLikedIds = new Set((myLikes || []).map((l: any) => l.session_id));

  // 4. Map to FeedItem type
  return sessions.map((s: any) => ({
    ...s,
    // Map snake_case to camelCase for the base WorkoutSessionLog part?
    // Actually our types use camelCase but DB returns snake_case.
    // We need to map manually like in loadSessionLogs.
    workoutId: s.workout_id,
    workoutName: s.workout_name,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    durationMinutes: s.duration_minutes,
    totalVolume: s.total_volume,
    totalSetsCompleted: s.total_sets,
    isDeload: s.is_deload,
    exercises: s.exercises, // JSONB usually comes as is
    newPRs: s.new_prs || [],

    // Social specific
    user: s.user, // Joined profile
    likes_count: s.likes?.[0]?.count || 0,
    comments_count: s.comments?.[0]?.count || 0,
    has_liked: myLikedIds.has(s.id)
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
    .insert({ user_id: userId, session_id: sessionId, content })
    .select('*, user:user_profiles(*)')
    .single();

  if (error) throw error;
  return data;
}