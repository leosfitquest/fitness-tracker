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