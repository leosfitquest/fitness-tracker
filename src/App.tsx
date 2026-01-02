import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Components
import { WorkoutCard } from "./components/WorkoutCard";
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { RestTimer } from "./components/RestTimer";
import { ExerciseDetailModal } from "./components/ExerciseDetailModal";
import { ExerciseSearchModal } from "./components/ExerciseSearchModal";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { BottomNav } from "./components/BottomNav";
import { AccountPage } from "./components/AccountPage";

// Data
import { RAW_EXERCISES } from "./exercises-data";
import type { RawExercise } from "./exercises-data";

// Styles
import './index.css';
import './App.css';

// --- Types ---
const MUSCLE_GROUPS = [
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
};

export type ExerciseSessionData = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  note?: string;
  sets: ActiveSet[];
  volume: number;
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

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  type: 'volume' | '1RM' | 'reps';
  oldValue: number;
  newValue: number;
  achievedAt: string;
};

// --- Helpers ---
const mapPrimaryToMuscleGroup = (primaryMuscles: string[]): MuscleGroup => {
  const m = primaryMuscles[0]?.toLowerCase() || "";
  if (m.includes("chest")) return "chest";
  if (m.includes("back") || m.includes("lats")) return "back";
  if (m.includes("leg") || m.includes("quad") || m.includes("hamstring") || m.includes("calf")) return "legs";
  if (m.includes("shoulder") || m.includes("deltoid")) return "shoulders";
  if (m.includes("bicep") || m.includes("tricep") || m.includes("forearm") || m.includes("arm")) return "arms";
  if (m.includes("abdominals") || m.includes("obliques") || m.includes("core")) return "core";
  if (m.includes("glute")) return "glutes";
  return "core";
};

const GITHUB_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const ALL_EXERCISES: Exercise[] = RAW_EXERCISES.map((ex: RawExercise) => ({
  id: ex.id,
  name: ex.name,
  muscleGroup: mapPrimaryToMuscleGroup(ex.primaryMuscles),
  imageUrl: ex.images && ex.images.length > 0 ? `${GITHUB_IMAGE_BASE}${ex.images[0]}` : undefined,
  instructions: ex.instructions,
  equipment: ex.equipment,
  primaryMuscles: ex.primaryMuscles,
  secondaryMuscles: ex.secondaryMuscles,
}));

// 1RM Calculator mit RPE-Adjustierung
// Basierend auf Strength Level Tabelle + RIR (Reps in Reserve)
const calculate1RM = (weight: number, reps: number, rpe?: number | null): number => {
  if (reps === 1 && (!rpe || rpe === 10)) return weight;
  
  // Strength Level Repetition Percentages
  const repPercentages: Record<number, number> = {
    1: 1.00,   2: 0.97,   3: 0.94,   4: 0.92,   5: 0.89,
    6: 0.86,   7: 0.83,   8: 0.81,   9: 0.78,  10: 0.75,
    11: 0.73, 12: 0.71,  13: 0.70,  14: 0.68,  15: 0.67,
    16: 0.65, 17: 0.64,  18: 0.63,  19: 0.61,  20: 0.60,
    21: 0.59, 22: 0.58,  23: 0.57,  24: 0.56,  25: 0.55,
    26: 0.54, 27: 0.53,  28: 0.52,  29: 0.51,  30: 0.50,
  };
  
  // RPE zu RIR (Reps in Reserve) Konvertierung
  const getRepsInReserve = (rpe: number): number => {
    if (rpe >= 10) return 0;
    if (rpe >= 9.5) return 0.5;
    if (rpe >= 9) return 1;
    if (rpe >= 8.5) return 1.5;
    if (rpe >= 8) return 2;
    if (rpe >= 7.5) return 2.5;
    if (rpe >= 7) return 3;
    if (rpe >= 6.5) return 3.5;
    if (rpe >= 6) return 4;
    return 5; // RPE < 6
  };
  
  // Adjustiere Reps basierend auf RPE
  let adjustedReps = reps;
  if (rpe && rpe < 10) {
    const rir = getRepsInReserve(rpe);
    adjustedReps = Math.round(reps + rir);
  }
  
  // Verwende Prozentsatz aus Tabelle oder fallback für >30 reps
  const percentage = repPercentages[adjustedReps] || (0.50 - (adjustedReps - 30) * 0.01);
  
  // Berechne 1RM: weight / percentage
  return Math.round(weight / percentage);
};

// --- Main Component ---
function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessionLogs, setSessionLogs] = useState<WorkoutSessionLog[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<Record<string, ExerciseRecord>>({});

  // UI State - Overview
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Drag & Drop State
  const [draggedWorkoutIndex, setDraggedWorkoutIndex] = useState<number | null>(null);
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);

  // Active Workout State
  const [mode, setMode] = useState<"overview" | "active">("overview");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [workoutExercisesData, setWorkoutExercisesData] = useState<Record<string, ExerciseSessionData>>({});
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([
    { setNumber: 1, weight: null, reps: null, rpe: null, completed: false },
  ]);

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [customRestSeconds, setCustomRestSeconds] = useState(90);
  const [autoStartRest, setAutoStartRest] = useState(true);
  const [isDeload, setIsDeload] = useState(false);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");

  // Exercise Search Modal State
  const [showExerciseSearchModal, setShowExerciseSearchModal] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Active Workout Stats
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // PR Tracking
  const [sessionPRs, setSessionPRs] = useState<PersonalRecord[]>([]);
  const [showPRNotification, setShowPRNotification] = useState(false);

  // Session Detail Modal
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionLog | null>(null);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'exercises' | 'account'>('dashboard');
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Advanced Features Toggles
  const [showRPE, setShowRPE] = useState(false);
  const [show1RM, setShow1RM] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);

  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<Exercise | null>(null);

  // Workout Mini-Bar collapsed
  const [workoutCollapsed, setWorkoutCollapsed] = useState(false);
  const [showWorkoutSettings, setShowWorkoutSettings] = useState(false);

  // Discard Confirmation Modal
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // --- Effects ---

  // Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      setError(null);

      try {
        const [workoutsResponse, logsResponse, recordsResponse] = await Promise.all([
          supabase.from('workouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(50),
          supabase.from('exercise_records').select('*').eq('user_id', user.id)
        ]);

        if (workoutsResponse.error) throw workoutsResponse.error;
        if (logsResponse.error) throw logsResponse.error;
        if (recordsResponse.error) throw recordsResponse.error;

        const loadedWorkouts: Workout[] = (workoutsResponse.data || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          exerciseCount: w.exercise_count,
          estimatedDuration: w.estimated_duration,
          lastPerformed: w.last_performed,
          exercises: w.exercises || []
        }));
        setWorkouts(loadedWorkouts);

        const loadedLogs: WorkoutSessionLog[] = (logsResponse.data || []).map((l: any) => ({
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
        setSessionLogs(loadedLogs);

        const recordsMap: Record<string, ExerciseRecord> = {};
        (recordsResponse.data || []).forEach((r: any) => {
          recordsMap[r.exercise_id] = {
            exerciseId: r.exercise_id,
            exerciseName: r.exercise_name,
            bestVolume: Number(r.best_volume),
            bestSet: r.best_set,
            estimated1RM: Number(r.estimated_1rm)
          };
        });
        setExerciseRecords(recordsMap);

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Live Timer
  useEffect(() => {
    if (mode === "active" && workoutStartTime && workoutStarted) {
      const interval = setInterval(() => {
        setWorkoutElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, workoutStartTime, workoutStarted]);

  // Save workout state to localStorage
  useEffect(() => {
    if (mode === "active" && selectedWorkoutId) {
      const workoutState = {
        selectedWorkoutId,
        selectedExerciseId,
        workoutExercises,
        workoutExercisesData,
        activeSets,
        sessionStart,
        sessionNotes,
        isDeload,
        workoutStartTime,
        workoutStarted,
        sessionPRs
      };
      localStorage.setItem('activeWorkout', JSON.stringify(workoutState));
    } else {
      localStorage.removeItem('activeWorkout');
    }
  }, [mode, selectedWorkoutId, selectedExerciseId, workoutExercises, workoutExercisesData,
    activeSets, sessionStart, sessionNotes, isDeload, workoutStartTime, workoutStarted, sessionPRs]);

  // Load workout state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('activeWorkout');
    if (savedState && user) {
      try {
        const state = JSON.parse(savedState);
        setMode("active");
        setSelectedWorkoutId(state.selectedWorkoutId);
        setSelectedExerciseId(state.selectedExerciseId);
        setWorkoutExercises(state.workoutExercises || []);
        setWorkoutExercisesData(state.workoutExercisesData || {});
        setActiveSets(state.activeSets || [{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
        setSessionStart(state.sessionStart);
        setSessionNotes(state.sessionNotes || "");
        setIsDeload(state.isDeload || false);
        setWorkoutStartTime(state.workoutStartTime);
        setWorkoutStarted(state.workoutStarted || false);
        setSessionPRs(state.sessionPRs || []);
      } catch (err) {
        console.error('Error restoring workout state:', err);
      }
    }
  }, [user]);

  // Save advanced features to localStorage
  useEffect(() => {
    const settings = {
      showRPE,
      show1RM,
      showPlateCalculator,
      autoStartRest,
      customRestSeconds
    };
    localStorage.setItem('workoutSettings', JSON.stringify(settings));
  }, [showRPE, show1RM, showPlateCalculator, autoStartRest, customRestSeconds]);

  // Load advanced features from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('workoutSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.showRPE !== undefined) setShowRPE(settings.showRPE);
        if (settings.show1RM !== undefined) setShow1RM(settings.show1RM);
        if (settings.showPlateCalculator !== undefined) setShowPlateCalculator(settings.showPlateCalculator);
        if (settings.autoStartRest !== undefined) setAutoStartRest(settings.autoStartRest);
        if (settings.customRestSeconds !== undefined) setCustomRestSeconds(settings.customRestSeconds);
      } catch (err) {
        console.error('Error loading workout settings:', err);
      }
    }
  }, []);

  // --- Logic Methods ---

  const saveWorkoutToDb = async (workout: Workout) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('workouts').update({
        name: workout.name,
        description: workout.description,
        exercises: workout.exercises,
        exercise_count: workout.exercises.length,
        estimated_duration: workout.estimatedDuration,
        updated_at: new Date().toISOString()
      }).eq('id', workout.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating workout:', err);
    }
  };

  const updateExerciseRecord = async (exerciseId: string, exerciseName: string, sets: ActiveSet[], date: string) => {
    if (!user) return;

    let maxVolume = 0;
    let bestSet = { weight: 0, reps: 0 };
    let max1RM = 0;

    for (const set of sets) {
      if (set.weight && set.reps && set.completed) {
        const volume = set.weight * set.reps;
        const estimated1RM = calculate1RM(set.weight, set.reps, set.rpe);

        if (volume > maxVolume) {
          maxVolume = volume;
          bestSet = { weight: set.weight, reps: set.reps };
        }

        if (estimated1RM > max1RM) {
          max1RM = estimated1RM;
        }
      }
    }

    const currentRecord = exerciseRecords[exerciseId];
    const newPRs: PersonalRecord[] = [];

    if (!currentRecord || maxVolume > currentRecord.bestVolume) {
      newPRs.push({
        exerciseId,
        exerciseName,
        type: 'volume',
        oldValue: currentRecord?.bestVolume || 0,
        newValue: maxVolume,
        achievedAt: date
      });
    }

    if (!currentRecord || max1RM > currentRecord.estimated1RM) {
      newPRs.push({
        exerciseId,
        exerciseName,
        type: '1RM',
        oldValue: currentRecord?.estimated1RM || 0,
        newValue: max1RM,
        achievedAt: date
      });
    }

    if (newPRs.length > 0) {
      setSessionPRs(prev => [...prev, ...newPRs]);
      setShowPRNotification(true);
      setTimeout(() => setShowPRNotification(false), 5000);
    }

    if (!currentRecord || maxVolume > currentRecord.bestVolume || max1RM > currentRecord.estimated1RM) {
      const newRecord = {
        exerciseId,
        exerciseName,
        bestVolume: Math.max(currentRecord?.bestVolume || 0, maxVolume),
        bestSet: (!currentRecord || maxVolume > currentRecord.bestVolume) ? { ...bestSet, date } : currentRecord.bestSet,
        estimated1RM: Math.max(currentRecord?.estimated1RM || 0, max1RM),
      };

      setExerciseRecords((prev) => ({ ...prev, [exerciseId]: newRecord }));

      try {
        await supabase.from('exercise_records').upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          best_volume: newRecord.bestVolume,
          best_set: newRecord.bestSet,
          estimated_1rm: newRecord.estimated1RM,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,exercise_id' });
      } catch (err) {
        console.error("Error saving record:", err);
      }
    }
  };

  const handleStartWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    // KEIN ALERT MEHR - Workout kann auch ohne Übungen gestartet werden

    setSelectedWorkoutId(id);
    setSessionPRs([]);

    const lastSession = sessionLogs
      .filter(log => log.workoutId === id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

    let exercises: Exercise[] = [];

    if (lastSession && lastSession.exercises.length > 0) {
      exercises = lastSession.exercises
        .map(ex => ALL_EXERCISES.find(e => e.id === ex.exerciseId))
        .filter((ex): ex is Exercise => ex !== undefined);
    } else if (workout.exercises.length > 0) {
      exercises = workout.exercises;
    }

    setWorkoutExercises(exercises);
    setWorkoutExercisesData({});
    setSelectedExerciseId(null);
    setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    setMode("active");
    setIsDeload(false);
    setSessionStart(new Date().toISOString());
    setSessionNotes("");
    setWorkoutStartTime(Date.now());
    setWorkoutStarted(false);
    setWorkoutElapsedSeconds(0);
    setWorkoutDuration(null);
    setTotalVolume(0);
    setTotalSetsCompleted(0);
    setShowSummary(false);
    setCurrentPage('dashboard');
  };
  const handleQuickCreateWorkout = async () => {
  if (!user) return;

    const workoutName = `Workout ${workouts.length + 1}`;
    
    try {
      const payload = {
        user_id: user.id,
        name: workoutName,
        description: '',
        estimated_duration: undefined,
        exercise_count: 0,
        exercises: []
      };

      const { data, error } = await supabase.from('workouts').insert(payload).select().single();
      if (error || !data) throw error;

      const created: Workout = {
        id: data.id,
        name: data.name,
        description: data.description,
        exerciseCount: 0,
        estimatedDuration: data.estimated_duration,
        lastPerformed: data.last_performed,
        exercises: []
      };

      setWorkouts((prev) => [created, ...prev]);
      
      // Direkt starten
      handleStartWorkout(created.id);
    } catch (err: any) {
      console.error("Error creating workout:", err);
    }
  };


  const handleAddExercisesToWorkout = () => {
    const newExercises = selectedExerciseIds
      .map(id => ALL_EXERCISES.find(ex => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined);

    setWorkoutExercises(prev => [...prev, ...newExercises]);
    setSelectedExerciseIds([]);
    setShowExerciseSearchModal(false);
  };

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);

    if (workoutExercisesData[exerciseId]) {
      setActiveSets(workoutExercisesData[exerciseId].sets);
    } else {
      setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    }
  };

  const handleSaveExercise = () => {
    if (!selectedExerciseId) return;

    const exercise = workoutExercises.find(ex => ex.id === selectedExerciseId);
    if (!exercise) return;

    const volume = activeSets.reduce((sum, set) => {
      if (set.weight && set.reps && set.completed) return sum + set.weight * set.reps;
      return sum;
    }, 0);

    setWorkoutExercisesData(prev => ({
      ...prev,
      [selectedExerciseId]: {
        exerciseId: selectedExerciseId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        note: exercise.note,
        sets: activeSets,
        volume,
      }
    }));

    updateExerciseRecord(selectedExerciseId, exercise.name, activeSets, new Date().toISOString());
    setSelectedExerciseId(null);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setWorkoutExercises(prev => prev.filter(ex => ex.id !== exerciseId));

    setWorkoutExercisesData(prev => {
      const newData = { ...prev };
      delete newData[exerciseId];
      return newData;
    });

    if (selectedExerciseId === exerciseId) {
      setSelectedExerciseId(null);
    }
  };

  const handleMoveExercise = (from: number, to: number) => {
    setWorkoutExercises(prev => {
      const exercises = [...prev];
      if (to < 0 || to >= exercises.length) return prev;

      const [moved] = exercises.splice(from, 1);
      exercises.splice(to, 0, moved);

      return exercises;
    });
  };

  const handleCompleteWorkout = async () => {
    if (!selectedWorkoutId || !sessionStart || !workoutStartTime || !user) return;

    // KEIN ALERT MEHR - auch leere Workouts können beendet werden

    const workout = workouts.find(w => w.id === selectedWorkoutId);
    if (!workout) return;

    const end = new Date().toISOString();
    const durationSeconds = Math.floor((Date.now() - workoutStartTime) / 1000);
    const durationMinutes = Math.round(durationSeconds / 60);

    const allExercises = Object.values(workoutExercisesData);
    const totalVol = allExercises.reduce((sum, ex) => sum + ex.volume, 0);
    const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);

    const log: WorkoutSessionLog = {
      id: crypto.randomUUID(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: sessionStart,
      endedAt: end,
      durationMinutes,
      durationSeconds,
      totalVolume: totalVol,
      totalSetsCompleted: totalSets,
      isDeload,
      notes: sessionNotes,
      exercises: allExercises,
      newPRs: sessionPRs
    };

    setSessionLogs((prev) => [log, ...prev]);

    try {
      const sessionData: any = {
        user_id: user.id,
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

      await supabase.from('workout_sessions').insert(sessionData);

      await supabase.from('workouts').update({
        last_performed: end,
        exercises: workoutExercises,
        exercise_count: workoutExercises.length,
        updated_at: new Date().toISOString()
      }).eq('id', workout.id);

      setWorkouts(prev =>
        prev.map(w =>
          w.id === workout.id ? { ...w, lastPerformed: end, exercises: workoutExercises, exerciseCount: workoutExercises.length } : w
        )
      );

    } catch (err: any) {
      console.error("Error saving workout session:", err);
    }

    setWorkoutDuration(durationSeconds);
    setTotalVolume(totalVol);
    setTotalSetsCompleted(totalSets);
    setShowSummary(true);
  };

  const handleReturnToDashboard = () => {
    if (mode === "active") {
      setShowDiscardConfirm(true);
      return;
    }

    setMode("overview");
    setSelectedWorkoutId(null);
    setSelectedExerciseId(null);
    setWorkoutExercises([]);
    setWorkoutExercisesData({});
    setWorkoutStartTime(null);
    setWorkoutElapsedSeconds(0);
    setSessionPRs([]);
    setWorkoutStarted(false);
    localStorage.removeItem('activeWorkout');
  };

  const handleConfirmDiscard = () => {
    setMode("overview");
    setSelectedWorkoutId(null);
    setSelectedExerciseId(null);
    setWorkoutExercises([]);
    setWorkoutExercisesData({});
    setWorkoutStartTime(null);
    setWorkoutElapsedSeconds(0);
    setSessionPRs([]);
    setWorkoutStarted(false);
    setShowDiscardConfirm(false);
    localStorage.removeItem('activeWorkout');
  };

  const handleCreateWorkout = async () => {
    if (!newName.trim() || !user) return;

    const estimatedDuration = newDuration ? parseInt(newDuration) : undefined;

    try {
      const payload = {
        user_id: user.id,
        name: newName,
        description: newDescription || undefined,
        estimated_duration: estimatedDuration,
        exercise_count: 0,
        exercises: []
      } as any;

      const { data, error } = await supabase.from('workouts').insert(payload).select().single();
      if (error || !data) throw error || new Error('No data returned from DB');

      const created: Workout = {
        id: data.id,
        name: data.name,
        description: data.description,
        exerciseCount: data.exercise_count || 0,
        estimatedDuration: data.estimated_duration,
        lastPerformed: data.last_performed,
        exercises: data.exercises || []
      };

      setWorkouts((prev) => [created, ...prev]);

      setNewName("");
      setNewDescription("");
      setNewDuration("");

    } catch (err: any) {
      console.error("Error creating workout:", err);
      setError('Fehler beim Erstellen des Trainings: ' + (err?.message || 'Unbekannter Fehler'));
    }
  };

  const handleEditWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id);
    if (!workout) return;
    setEditingWorkoutId(id);
    setEditName(workout.name);
    setEditDescription(workout.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingWorkoutId) return;

    let updatedWorkout: Workout | null = null;
    setWorkouts((prev) => prev.map((w) => {
      if (w.id !== editingWorkoutId) return w;
      updatedWorkout = { ...w, name: editName, description: editDescription };
      return updatedWorkout;
    }));

    if (updatedWorkout) {
      await saveWorkoutToDb(updatedWorkout);
    }

    setEditingWorkoutId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDeleteWorkout = async (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));

    if (user) {
      try {
        await supabase.from('workouts').delete().eq('id', id);
      } catch (err) {
        console.error("Error deleting workout:", err);
      }
    }
  };

  const handleMoveWorkout = (from: number, to: number) => {
    setWorkouts((prev) => {
      const workoutsCopy = [...prev];
      if (to < 0 || to >= workoutsCopy.length) return prev;

      const [moved] = workoutsCopy.splice(from, 1);
      workoutsCopy.splice(to, 0, moved);

      return workoutsCopy;
    });
  };

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) || null;
  const selectedExercise = workoutExercises.find(ex => ex.id === selectedExerciseId);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {isLoadingData && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-3 text-sm">Loading...</div>
        </div>
      )}

      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 text-sm">{error}</div>
        </div>
      )}

      {showPRNotification && sessionPRs.length > 0 && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="font-bold text-lg flex items-center gap-2">🎉 NEW PR!</div>
          <div className="text-sm mt-1">
            {sessionPRs[sessionPRs.length - 1].exerciseName} - {sessionPRs[sessionPRs.length - 1].type.toUpperCase()}
          </div>
        </div>
      )}

      <div className="px-6 pt-6">
        {/* MINI WORKOUT BAR */}
        {mode === 'active' && selectedWorkout && (
          <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-black/98 border-b border-slate-800 z-40 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                {/* Left: Collapse Button + Workout Name */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWorkoutCollapsed(!workoutCollapsed)}
                    className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-slate-800/50 transition-all"
                  >
                    {workoutCollapsed ? '▼' : '▲'}
                  </button>
                  <div>
                    <div className="text-base font-bold text-white truncate max-w-[200px]">
                      {selectedWorkout.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {workoutExercises.length} exercises • {Object.keys(workoutExercisesData).length} completed
                    </div>
                  </div>
                </div>

                {/* Right: Timer + Actions */}
                <div className="flex items-center gap-2">
                  {!workoutStarted ? (
                    <button
                      onClick={() => {
                        setWorkoutStarted(true);
                        if (!workoutStartTime) setWorkoutStartTime(Date.now());
                      }}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm transition-all"
                    >
                      START
                    </button>
                  ) : (
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      {formatTime(workoutElapsedSeconds)}
                    </div>
                  )}

                  <button
                    onClick={() => setShowWorkoutSettings(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                    title="Settings"
                  >
                    ⚙️
                  </button>

                  <button
                    onClick={handleCompleteWorkout}
                    disabled={Object.keys(workoutExercisesData).length === 0}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold rounded-lg text-sm transition-all disabled:opacity-50"
                  >
                    Finish
                  </button>

                  <button
                    onClick={handleReturnToDashboard}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Discard"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {currentPage === 'dashboard' && mode === "overview" && !isLoadingData && (
          <>
            <div className="max-w-4xl mx-auto mb-8">
              <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
            </div>

            {sessionLogs.length > 0 && (
              <div className="max-w-4xl mx-auto mb-8">
                <h2 className="text-2xl font-bold mb-4">Recent sessions</h2>
                <div className="space-y-2">
                  {sessionLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedSession(log)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg p-4 transition-all text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{log.workoutName}</h3>
                          <p className="text-xs text-slate-400">
                            {new Date(log.startedAt).toLocaleDateString()} · {log.durationMinutes} min · {log.totalSetsCompleted} sets
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold text-lg">{log.totalVolume.toLocaleString()} kg</div>
                          {log.isDeload && <span className="text-xs text-amber-400">Deload</span>}
                          {log.newPRs && log.newPRs.length > 0 && (
                            <span className="text-xs text-orange-400 ml-2">🎉 {log.newPRs.length} PR{log.newPRs.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* WORKOUTS PAGE */}
        {currentPage === 'exercises' && mode === "overview" && (
          <>
            <div className="max-w-4xl mx-auto mb-8">
              <h1 className="text-4xl font-bold mb-2">Your Workouts</h1>
              <p className="text-slate-400 text-sm">Create and manage your training routines</p>
            </div>

            <div className="max-w-4xl mx-auto mb-24">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {workouts.map((w, index) => (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => setDraggedWorkoutIndex(index)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => {
                      if (draggedWorkoutIndex !== null) handleMoveWorkout(draggedWorkoutIndex, index);
                      setDraggedWorkoutIndex(null);
                    }}
                    className={`rounded-xl border transition-all cursor-move ${
                      index === 0 ? "border-emerald-500/50 bg-emerald-950/10" : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <WorkoutCard
                      id={w.id}
                      name={w.name}
                      description={w.description}
                      exercises={w.exerciseCount}
                      estimatedDuration={w.estimatedDuration}
                      lastPerformed={w.lastPerformed}
                      onStart={handleStartWorkout}
                      onEdit={handleEditWorkout}
                      onDelete={handleDeleteWorkout}
                    />
                  </div>
                ))}
              </div>

              {/* ADD WORKOUT BUTTON */}
              <button
                onClick={handleQuickCreateWorkout}
                className="w-full py-6 rounded-xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 font-bold text-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">+</span>
                <span>Create New Workout</span>
              </button>
            </div>
          </>
        )}

        {/* ACCOUNT PAGE */}
        {currentPage === 'account' && (
          <AccountPage user={user} />
        )}

        {/* ACTIVE WORKOUT MODE */}
        {mode === "active" && selectedWorkout && !workoutCollapsed && (
          <>
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 mt-16">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{selectedWorkout.name}</h1>
                  <p className="text-sm text-slate-400">
                    {workoutExercises.length} exercises · {Object.keys(workoutExercisesData).length} completed
                  </p>
                </div>
                <div className="text-right">
                  {!workoutStarted ? (
                    <button
                      onClick={() => {
                        setWorkoutStarted(true);
                        if (!workoutStartTime) setWorkoutStartTime(Date.now());
                      }}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all shadow-lg"
                    >
                      START
                    </button>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-emerald-400 font-mono">
                        {formatTime(workoutElapsedSeconds)}
                      </div>
                      <p className="text-xs text-slate-400">Duration</p>
                    </>
                  )}
                </div>
              </div>

              {sessionPRs.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-900/50 rounded-lg">
                  <div className="font-bold text-amber-400 text-sm mb-1">🎉 Personal Records This Session:</div>
                  <div className="text-xs text-slate-300 space-y-1">
                    {sessionPRs.map((pr, i) => (
                      <div key={i}>{pr.exerciseName} - {pr.type.toUpperCase()}: {pr.newValue}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {showSummary && workoutDuration !== null && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-center">
                  <h2 className="text-3xl font-bold mb-2">🎉 Workout Completed!</h2>
                  <p className="text-slate-400 mb-6">Great job today.</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-400">{formatTime(workoutDuration)}</div>
                      <div className="text-xs text-slate-400">Duration</div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-400">{totalVolume.toLocaleString()} kg</div>
                      <div className="text-xs text-slate-400">Volume</div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-400">{totalSetsCompleted}</div>
                      <div className="text-xs text-slate-400">Sets</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowSummary(false);
                      setMode("overview");
                      setSelectedWorkoutId(null);
                      setWorkoutExercises([]);
                      setWorkoutExercisesData({});
                      setWorkoutStartTime(null);
                      setSessionPRs([]);
                      setWorkoutStarted(false);
                      localStorage.removeItem('activeWorkout');
                    }}
                    className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {!selectedExerciseId && (
              <div className="max-w-4xl mx-auto space-y-3 mb-8">
                {workoutExercises.map((ex, index) => {
                  const isCompleted = !!workoutExercisesData[ex.id];
                  return (
                    <div
                      key={ex.id}
                      draggable
                      onDragStart={() => setDraggedExerciseIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedExerciseIndex !== null) {
                          handleMoveExercise(draggedExerciseIndex, index);
                          setDraggedExerciseIndex(null);
                        }
                      }}
                      className="group cursor-move"
                    >
                      <button
                        onClick={() => handleSelectExercise(ex.id)}
                        className={`w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4 ${isCompleted
                            ? "bg-emerald-950/20 border-emerald-500/50"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                          }`}
                      >
                        {ex.imageUrl && (
                          <img
                            src={ex.imageUrl}
                            alt={ex.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {ex.name}
                          </h3>
                          <p className="text-xs text-slate-500 uppercase">{ex.muscleGroup}</p>
                          {ex.instructions?.[0] && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ex.instructions[0]}</p>
                          )}
                          {isCompleted && (
                            <p className="text-xs text-emerald-400 mt-1">
                              {workoutExercisesData[ex.id].sets.filter(s => s.completed).length} sets · {workoutExercisesData[ex.id].volume} kg
                            </p>
                          )}
                        </div>
                        {isCompleted ? (
                          <span className="text-emerald-400 text-2xl font-bold">✓</span>
                        ) : (
                          <span className="text-slate-600 text-xl font-bold">○</span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExercise(ex.id);
                        }}
                        className="ml-4 mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => setShowExerciseSearchModal(true)}
                  className="w-full py-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all"
                >
                  + Add Exercise
                </button>
              </div>
            )}

            {selectedExerciseId && selectedExercise && (
              <div className="max-w-4xl mx-auto">
                <ActiveWorkoutCard
                  exerciseId={selectedExerciseId}
                  exerciseName={selectedExercise.name}
                  muscleGroup={selectedExercise.muscleGroup}
                  sets={activeSets}
                  note={selectedExercise.note}
                  onSetChange={(index: number, field: string, value: any) => {
                    setActiveSets(prev => prev.map((s, i) => 
                      i === index ? { ...s, [field]: value } : s
                    ));
                  }}
                  onAddSet={() => {
                    setActiveSets(prev => [...prev, {
                      setNumber: prev.length + 1,
                      weight: null,
                      reps: null,
                      rpe: null,
                      completed: false
                    }]);
                  }}
                  onStartRest={(seconds: number) => {
                    setCustomRestSeconds(seconds);
                    setShowRestTimer(true);
                  }}
                  onNoteChange={(note: string) => {
                    setWorkoutExercises(prev => prev.map(ex => 
                      ex.id === selectedExerciseId ? { ...ex, note } : ex
                    ));
                  }}
                  isDeload={isDeload}
                  showRPE={showRPE}
                  show1RM={show1RM}
                  showPlateCalculator={showPlateCalculator}
                  allExercises={ALL_EXERCISES}
                />
                
                <div className="max-w-4xl mx-auto mt-4 flex gap-3">
                  <button
                    onClick={() => setSelectedExerciseId(null)}
                    className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveExercise}
                    className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODALS */}
        {editingWorkoutId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Workout</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingWorkoutId(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showWorkoutSettings && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">⚙️ Workout Settings</h2>
                <button
                  onClick={() => setShowWorkoutSettings(false)}
                  className="text-slate-400 hover:text-white text-xl p-1 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* BASIC SETTINGS */}
                <div className="border-b border-slate-700 pb-4">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">BASIC</h3>
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={autoStartRest}
                      onChange={(e) => setAutoStartRest(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <span className="text-sm">Auto Start Rest Timer</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeload}
                      onChange={(e) => setIsDeload(e.target.checked)}
                      className="w-5 h-5 accent-amber-500 rounded"
                    />
                    <span className="text-sm font-medium text-amber-400">🔥 Deload Week</span>
                  </label>
                </div>

                {/* ADVANCED FEATURES */}
                <div className="border-b border-slate-700 pb-4">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3">🔬 ADVANCED FEATURES</h3>
                  
                  <label className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg cursor-pointer mb-2 hover:bg-emerald-950/30">
                    <input
                      type="checkbox"
                      checked={showRPE}
                      onChange={(e) => setShowRPE(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Show RPE</span>
                      <p className="text-xs text-slate-400">Rate of Perceived Exertion (1-10)</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg cursor-pointer mb-2 hover:bg-emerald-950/30">
                    <input
                      type="checkbox"
                      checked={show1RM}
                      onChange={(e) => setShow1RM(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Show 1RM Calculator</span>
                      <p className="text-xs text-slate-400">Estimated 1 Rep Max</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg cursor-pointer hover:bg-emerald-950/30">
                    <input
                      type="checkbox"
                      checked={showPlateCalculator}
                      onChange={(e) => setShowPlateCalculator(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Show Plate Calculator</span>
                      <p className="text-xs text-slate-400">Calculate plates needed (e.g., 20kg + 5kg × 2)</p>
                    </div>
                  </label>
                </div>

                {/* DEFAULT REST TIME */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Default Rest Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={Math.round(customRestSeconds / 60)}
                      onChange={(e) => setCustomRestSeconds(parseInt(e.target.value) * 60)}
                      min={0.5}
                      step={0.5}
                      className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                    />
                    <span className="text-slate-500 px-2">min</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowWorkoutSettings(false)}
                className="w-full mt-6 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400 font-medium transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {showDiscardConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
              <h2 className="text-xl font-bold mb-4">Workout beenden?</h2>
              <p className="text-slate-400 mb-6">Deine Fortschritte gehen verloren.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  Beenden
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedSession && (
          <SessionDetailModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}

        {selectedExerciseDetail && (
          <ExerciseDetailModal
            exercise={selectedExerciseDetail}
            onClose={() => setSelectedExerciseDetail(null)}
          />
        )}

        {selectedExerciseForDetail && (
          <ExerciseDetailModal
            exercise={selectedExerciseForDetail}
            onClose={() => setSelectedExerciseForDetail(null)}
          />
        )}

        {showExerciseSearchModal && (
          <ExerciseSearchModal
            isOpen={showExerciseSearchModal}
            onClose={() => {
              setShowExerciseSearchModal(false);
              setSelectedExerciseIds([]);
            }}
            onSelectExercise={(exerciseId: string) => {
              const exercise = ALL_EXERCISES.find(ex => ex.id === exerciseId);
              if (exercise) {
                setWorkoutExercises(prev => [...prev, exercise]);
                setShowExerciseSearchModal(false);
              }
            }}
            allExercises={ALL_EXERCISES}
            muscleGroups={["chest", "back", "legs", "shoulders", "arms", "core", "glutes"]}
          />
        )}

        {showRestTimer && (
          <RestTimer
            initialSeconds={customRestSeconds}
            onDismiss={() => setShowRestTimer(false)}
            autoStart={true}
          />
        )}

      </div>

      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;
