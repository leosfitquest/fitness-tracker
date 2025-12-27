import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Components
import { StatsCard } from "./components/StatsCard";
import { WorkoutCard } from "./components/WorkoutCard";
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { RestTimer } from "./components/RestTimer";
import { ExerciseDetailModal } from "./components/ExerciseDetailModal";
import { ExerciseSearchModal } from "./components/ExerciseSearchModal";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { BottomNav } from "./components/BottomNav";
import { ExerciseBrowser } from "./components/ExerciseBrowser";
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

const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
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
  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<Exercise | null>(null);

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

  // Live Timer with GO button
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
        const estimated1RM = calculate1RM(set.weight, set.reps);

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
    setWorkoutStarted(false); // Timer nicht auto-starten
    setWorkoutElapsedSeconds(0);
    setWorkoutDuration(null);
    setTotalVolume(0);
    setTotalSetsCompleted(0);
    setShowSummary(false);
    setCurrentPage('dashboard'); // Zurück zu Dashboard Page
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

      setWorkouts(prev => prev.map(w => 
        w.id === workout.id ? { ...w, lastPerformed: end, exercises: workoutExercises, exerciseCount: workoutExercises.length } : w
      ));

    } catch (err: any) {
      console.error("Error saving workout session:", err);
      alert(`Fehler beim Speichern: ${err.message}`);
    }

    setWorkoutDuration(durationSeconds);
    setTotalVolume(totalVol);
    setTotalSetsCompleted(totalSets);
    setShowSummary(true);
  };

  const handleReturnToDashboard = () => {
    if (mode === "active") {
      if (!confirm("Workout beenden ohne zu speichern?")) return;
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

  const handleCreateWorkout = async () => {
    if (!newName.trim() || !user) return;

    const estimatedDuration = newDuration ? parseInt(newDuration) : undefined;

    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      name: newName,
      description: newDescription || undefined,
      exerciseCount: 0,
      estimatedDuration,
      exercises: []
    };

    setWorkouts((prev) => [newWorkout, ...prev]);

    try {
      await supabase.from('workouts').insert({
        id: newWorkout.id,
        user_id: user.id,
        name: newWorkout.name,
        description: newWorkout.description,
        estimated_duration: newWorkout.estimatedDuration,
        exercise_count: 0,
        exercises: []
      });
    } catch (err) {
      console.error("Error creating workout:", err);
    }

    setNewName("");
    setNewDescription("");
    setNewDuration("");
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
    if (!confirm("Delete this workout?")) return;

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
  const totalVolumeAllTime = sessionLogs.reduce((sum, log) => sum + log.totalVolume, 0);
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
        {/* DASHBOARD PAGE */}
        {currentPage === 'dashboard' && mode === "overview" && !isLoadingData && (
          <>
            <div className="max-w-4xl mx-auto mb-8">
              <h1 className="text-4xl font-bold mb-6">Fitness Tracker</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Workouts"
                  value={sessionLogs.length.toString()}
                  subtitle="completed"
                />
                <StatsCard
                  title="Total Volume"
                  value={`${(totalVolumeAllTime / 1000).toFixed(1)}k`}
                  subtitle="kg lifted"
                />
                <StatsCard
                  title="Personal Records"
                  value={Object.keys(exerciseRecords).length.toString()}
                  subtitle="exercises"
                />
              </div>
            </div>

            {/* Create Workout Form */}
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Create New Workout</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Push Day"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Chest, shoulders, triceps..."
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Est. duration (min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateWorkout}
                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all"
              >
                Create Workout
              </button>
            </div>

            {/* Workout List */}
            <div className="max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-bold mb-4">Your workouts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Recent Sessions */}
            {sessionLogs.length > 0 && (
              <div className="max-w-4xl mx-auto">
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

            {/* Edit Modal */}
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
          </>
        )}

        {/* EXERCISES PAGE */}
        {currentPage === 'exercises' && (
          <ExerciseBrowser
            exercises={ALL_EXERCISES}
            onSelectExercise={(ex) => setSelectedExerciseForDetail(ex)}
          />
        )}

        {/* ACCOUNT PAGE */}
        {currentPage === 'account' && (
          <AccountPage user={user} />
        )}

        {/* ACTIVE WORKOUT MODE */}
        {mode === "active" && selectedWorkout && (
          <>
            {/* Active Header */}
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
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

              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoStartRest}
                    onChange={(e) => setAutoStartRest(e.target.checked)}
                    className="accent-blue-500"
                  />
                  Auto Rest
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDeload}
                    onChange={(e) => setIsDeload(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Deload
                </label>
              </div>

              {sessionPRs.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                  <p className="text-xs font-bold text-amber-400 mb-1">Personal Records This Session: {sessionPRs.length}</p>
                  <div className="flex flex-wrap gap-2">
                    {sessionPRs.slice(-3).map((pr, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
                        {pr.exerciseName} - {pr.type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exercise List View */}
            {!selectedExerciseId && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">Exercises</h2>

                  {workoutExercises.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 mb-4">No exercises yet. Add some to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-6">
                      {workoutExercises.map((ex, index) => {
                        const data = workoutExercisesData[ex.id];
                        const isCompleted = data && data.sets.some(s => s.completed);

                        return (
                          <div
                            key={ex.id}
                            draggable
                            onDragStart={() => setDraggedExerciseIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (draggedExerciseIndex !== null) handleMoveExercise(draggedExerciseIndex, index);
                              setDraggedExerciseIndex(null);
                            }}
                            className={`group p-4 rounded-lg border transition-all cursor-pointer ${
                              isCompleted 
                                ? 'border-slate-800 bg-slate-950 hover:border-emerald-500/50'
                                : 'border-slate-700 bg-slate-900/50 hover:border-amber-500/50'
                            }`}
                            onClick={() => handleSelectExercise(ex.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-xs font-mono text-slate-500">{index + 1}</span>

                                {ex.imageUrl && (
                                  <img
                                    src={ex.imageUrl}
                                    alt={ex.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                )}

                                <div className="flex-1">
                                  <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {ex.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 uppercase">{ex.muscleGroup}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {!isCompleted && (
                                  <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                                    Not started
                                  </span>
                                )}

                                {isCompleted && (
                                  <div className="text-right">
                                    <div className="text-emerald-400 font-bold">{data.volume.toLocaleString()} kg</div>
                                    <div className="text-xs text-slate-400">{data.sets.filter(s => s.completed).length} sets</div>
                                  </div>
                                )}

                                {isCompleted ? (
                                  <span className="text-emerald-400 text-xl">✓</span>
                                ) : (
                                  <span className="text-slate-600 text-xl">○</span>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveExercise(ex.id);
                                  }}
                                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Exercise Button */}
                  <button
                    onClick={() => {
                      setSelectedExerciseIds([]);
                      setShowExerciseSearchModal(true);
                    }}
                    className="w-full py-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 font-medium transition-all"
                  >
                    + Add Exercise
                  </button>
                </div>

                {/* Session Notes & Complete */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                  <h3 className="font-bold text-sm mb-2">Session Notes</h3>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none mb-4"
                    placeholder="How was the training?"
                    rows={3}
                  />

                  <button
                    onClick={handleCompleteWorkout}
                    disabled={Object.keys(workoutExercisesData).length === 0}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden group
                      disabled:opacity-50 disabled:cursor-not-allowed
                      bg-gradient-to-r from-emerald-500 to-emerald-600 
                      hover:from-emerald-600 hover:to-emerald-700 text-black
                      shadow-lg hover:shadow-emerald-500/50"
                  >
                    <span className="relative z-10">Complete Workout</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </button>
                </div>
              </div>
            )}

            {/* Exercise Detail View */}
            {selectedExerciseId && selectedExercise && (
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={handleSaveExercise}
                  className="mb-4 text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
                >
                  ← Back to Exercise List
                </button>

                <ActiveWorkoutCard
                  exerciseId={selectedExercise.id}
                  exerciseName={selectedExercise.name}
                  muscleGroup={selectedExercise.muscleGroup}
                  sets={activeSets}
                  note={selectedExercise.note}
                  isDeload={isDeload}
                  onSetChange={(index: number, field: string, value: any) => {
                    setActiveSets(prev => {
                      const updated = prev.map((s, i) => 
                        i === index ? { ...s, [field]: field === "completed" ? Boolean(value) : value } : s
                      );

                      if (field === "completed" && value && autoStartRest) {
                        setShowRestTimer(true);
                      }

                      const vol = updated.reduce((sum, s) => 
                        (s.weight && s.reps && s.completed) ? sum + (s.weight * s.reps) : sum, 0
                      );
                      const setsDone = updated.filter(s => s.completed).length;

                      setTotalVolume(vol);
                      setTotalSetsCompleted(setsDone);

                      return updated;
                    });
                  }}
                  onAddSet={() => setActiveSets(prev => [
                    ...prev,
                    { setNumber: prev.length + 1, weight: null, reps: null, rpe: null, completed: false }
                  ])}
                  onStartRest={(s: number) => {
                    setCustomRestSeconds(s);
                    setShowRestTimer(true);
                  }}
                  onNoteChange={(note: string) => {
                    setWorkoutExercises(prev => prev.map(ex => 
                      ex.id === selectedExercise.id ? { ...ex, note } : ex
                    ));
                  }}
                />

                <button
                  onClick={handleSaveExercise}
                  className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all"
                >
                  Save & Continue
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}

      {/* Summary Modal */}
      {showSummary && workoutDuration != null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-2">Workout Completed!</h2>
            <p className="text-slate-400 mb-6">Great job today.</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{formatTime(workoutDuration)}</div>
                <div className="text-xs text-slate-400">Duration</div>
              </div>
              <div className="bg-slate-950 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{(totalVolume / 1000).toFixed(1)}k</div>
                <div className="text-xs text-slate-400">Vol (kg)</div>
              </div>
              <div className="bg-slate-950 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{totalSetsCompleted}</div>
                <div className="text-xs text-slate-400">Sets</div>
              </div>
            </div>

            {sessionPRs.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                <p className="font-bold text-amber-400 mb-2">🎉 {sessionPRs.length} Personal Record{sessionPRs.length > 1 ? 's' : ''}!</p>
                <div className="space-y-1">
                  {sessionPRs.map((pr, i) => (
                    <p key={i} className="text-xs text-amber-300">
                      {pr.exerciseName}: {pr.type.toUpperCase()} {pr.oldValue} → {pr.newValue}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSummary(false);
                handleReturnToDashboard();
              }}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      {showRestTimer && (
        <RestTimer
          initialSeconds={customRestSeconds}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseDetail || selectedExerciseForDetail}
        onClose={() => {
          setSelectedExerciseDetail(null);
          setSelectedExerciseForDetail(null);
        }}
      />

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        isOpen={showExerciseSearchModal}
        onClose={() => {
          if (selectedExerciseIds.length > 0 && confirm(`Add ${selectedExerciseIds.length} exercise(s)?`)) {
            handleAddExercisesToWorkout();
          } else {
            setShowExerciseSearchModal(false);
            setSelectedExerciseIds([]);
          }
        }}
        onSelectExercise={(exerciseId: string) => {
          setSelectedExerciseIds(prev => 
            prev.includes(exerciseId)
              ? prev.filter(id => id !== exerciseId)
              : [...prev, exerciseId]
          );
        }}
        allExercises={ALL_EXERCISES}
        muscleGroups={MUSCLE_GROUPS}
        selectedExerciseIds={selectedExerciseIds}
        multiSelect={true}
      />

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

export default App;
