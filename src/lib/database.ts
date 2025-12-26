import { supabase } from './supabase'

// ============= WORKOUTS =============

export async function loadWorkouts(userId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function saveWorkout(workout: any, userId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: workout.name,
      description: workout.description,
      estimated_duration: workout.estimatedDuration,
      exercise_count: workout.exerciseCount || 0,
      exercises: workout.exercises || [],
      last_performed: workout.lastPerformed
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateWorkout(workoutId: string, updates: any) {
  const { data, error } = await supabase
    .from('workouts')
    .update({
      name: updates.name,
      description: updates.description,
      estimated_duration: updates.estimatedDuration,
      exercise_count: updates.exerciseCount,
      exercises: updates.exercises,
      last_performed: updates.lastPerformed,
      updated_at: new Date().toISOString()
    })
    .eq('id', workoutId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteWorkout(workoutId: string) {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
  
  if (error) throw error
}

// ============= SESSIONS =============

export async function saveSessionLog(log: any, userId: string) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_id: log.workoutId,
      workout_name: log.workoutName,
      started_at: log.startedAt,
      ended_at: log.endedAt,
      duration_minutes: log.durationMinutes,
      duration_seconds: log.durationSeconds,
      total_volume: log.totalVolume,
      total_sets_completed: log.totalSetsCompleted,
      is_deload: log.isDeload || false,
      notes: log.notes,
      exercises: log.exercises || []
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function loadSessionLogs(userId: string) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data || []
}

// ============= EXERCISE RECORDS =============

export async function upsertExerciseRecord(record: any, userId: string) {
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

export async function loadExerciseRecords(userId: string) {
  const { data, error } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data || []
}
