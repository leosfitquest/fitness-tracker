import { supabase } from './supabase';
import type { MovementPattern, DailySteps } from '../types.ts';

// ============= CYCLE ROTATION =============

export async function loadMovementPatterns(userId: string): Promise<MovementPattern[]> {
  const { data, error } = await supabase
    .from('movement_patterns')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  
  return (data || []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    patternType: r.pattern_type,
    exerciseIds: r.exercise_ids,
    activeIndex: r.active_index,
    cycleHistory: r.cycle_history || []
  }));
}

export async function upsertMovementPattern(userId: string, pattern: Partial<MovementPattern> & { name: string, patternType: string }): Promise<MovementPattern> {
  const { data, error } = await supabase
    .from('movement_patterns')
    .upsert({
      id: pattern.id,
      user_id: userId,
      name: pattern.name,
      pattern_type: pattern.patternType,
      exercise_ids: pattern.exerciseIds || [],
      active_index: pattern.activeIndex || 0,
      cycle_history: pattern.cycleHistory || []
    }, { onConflict: 'user_id,name' })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    patternType: data.pattern_type,
    exerciseIds: data.exercise_ids,
    activeIndex: data.active_index,
    cycleHistory: data.cycle_history
  };
}

// ============= DAILY STEPS =============

export async function loadDailySteps(userId: string, date: string): Promise<DailySteps | null> {
  const { data, error } = await supabase
    .from('daily_steps')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    steps: data.steps,
    goal: data.goal,
    source: data.source as any
  };
}

export async function saveDailySteps(userId: string, stepsData: Partial<DailySteps> & { date: string, steps: number }): Promise<DailySteps> {
  const { data, error } = await supabase
    .from('daily_steps')
    .upsert({
      user_id: userId,
      date: stepsData.date,
      steps: stepsData.steps,
      goal: stepsData.goal || 10000,
      source: stepsData.source || 'manual'
    }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    steps: data.steps,
    goal: data.goal,
    source: data.source as any
  };
}

export async function loadRecentStepsHistory(userId: string, limit: number = 30): Promise<DailySteps[]> {
  const { data, error } = await supabase
    .from('daily_steps')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return (data || []).reverse().map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    steps: r.steps,
    goal: r.goal,
    source: r.source as any
  }));
}
