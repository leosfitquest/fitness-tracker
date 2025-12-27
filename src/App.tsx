import { useState, useEffect } from "react";

import { supabase } from './lib/supabase';

import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Components
import { StatsCard } from "./components/StatsCard";
import { WorkoutCard } from "./components/WorkoutCard";
import { ExerciseItem } from "./components/ExerciseItem";
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { RestTimer } from "./components/RestTimer";
import { ExerciseDetailModal } from "./components/ExerciseDetailModal";
import { ExerciseSearchModal } from "./components/ExerciseSearchModal";
import { SessionDetailModal } from "./components/SessionDetailModal";

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

  // Active Workout State
  const [mode, setMode] = useState<"overview" | "active" | "selectExercises">("overview");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
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

  // Exercise Selection State
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [showExerciseSearchModal, setShowExerciseSearchModal] = useState(false);

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

  // Exercise Search/Detail
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState<string>("all");
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Session Detail Modal
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionLog | null>(null);

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

        // Map Workouts
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

        // Map Logs
        const loadedLogs: WorkoutSessionLog[] = (logsResponse.data || []).map((l: any) => ({
          id: l.id,
          workoutId: l.workout_id,
          workoutName: l.workout_name,
          startedAt: l.started_at,
          endedAt: l.ended_at,
          durationMinutes: l.duration_minutes,
          durationSeconds: l.duration_seconds,
          totalVolume: Number(l.total_volume),
          totalSetsCompleted: l.total_sets_completed,
          isDeload: l.is_deload,
          notes: l.notes,
          exercises: l.exercises || [],
          newPRs: l.new_prs || []
        }));
        setSessionLogs(loadedLogs);

        // Map Records
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
    if (mode === "active" && workoutStartTime) {
      const interval = setInterval(() => {
        setWorkoutElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, workoutStartTime]);

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

    // Check for PRs
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

    // Add PRs to session tracking
    if (newPRs.length > 0) {
      setSessionPRs(prev => [...prev, ...newPRs]);
      setShowPRNotification(true);
      setTimeout(() => setShowPRNotification(false), 5000);
    }

    // Update record if new PR
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

    // Check for last session exercises
    const lastSession = sessionLogs
      .filter(log => log.workoutId === id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

    if (lastSession && lastSession.exercises.length > 0) {
      // Load from last session
      const exercisesFromSession = lastSession.exercises
        .map(ex => ALL_EXERCISES.find(e => e.id === ex.exerciseId))
        .filter((ex): ex is Exercise => ex !== undefined);

      setWorkouts(prev => prev.map(w => 
        w.id === id ? { ...w, exercises: exercisesFromSession } : w
      ));

      startWorkoutWithExercises(id, exercisesFromSession);
    } else if (workout.exercises.length > 0) {
      // Use template
      startWorkoutWithExercises(id, workout.exercises);
    } else {
      // Show selection modal
      setMode("selectExercises");
      setSelectedExerciseIds([]);
      setShowExerciseSearchModal(true);
    }
  };

  const startWorkoutWithExercises = (id: string, exercises: Exercise[]) => {
    setCurrentExerciseIndex(0);
    setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    setWorkoutExercisesData({});
    setMode("active");
    setIsDeload(false);
    setSessionStart(new Date().toISOString());
    setSessionNotes("");
    setWorkoutStartTime(Date.now());
    setWorkoutElapsedSeconds(0);
    setWorkoutDuration(null);
    setTotalVolume(0);
    setTotalSetsCompleted(0);
    setShowSummary(false);
  };

  const handleConfirmExerciseSelection = () => {
    if (selectedExerciseIds.length === 0) return;

    const selectedExercises = selectedExerciseIds
      .map(id => ALL_EXERCISES.find(ex => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined);

    if (selectedWorkoutId) {
      setWorkouts(prev => prev.map(w => 
        w.id === selectedWorkoutId 
          ? { ...w, exercises: selectedExercises, exerciseCount: selectedExercises.length }
          : w
      ));

      const updatedWorkout = workouts.find(w => w.id === selectedWorkoutId);
      if (updatedWorkout) {
        saveWorkoutToDb({
          ...updatedWorkout,
          exercises: selectedExercises,
          exerciseCount: selectedExercises.length
        });
      }

      setShowExerciseSearchModal(false);
      startWorkoutWithExercises(selectedWorkoutId, selectedExercises);
    }
  };

  const handleNextExercise = () => {
    if (!selectedWorkout) return;

    const currentExercise = selectedWorkout.exercises[currentExerciseIndex];

    const volume = activeSets.reduce((sum, set) => {
      if (set.weight && set.reps && set.completed) return sum + set.weight * set.reps;
      return sum;
    }, 0);

    setWorkoutExercisesData((prev) => ({
      ...prev,
      [currentExercise.id]: {
        exerciseId: currentExercise.id,
        name: currentExercise.name,
        muscleGroup: currentExercise.muscleGroup,
        note: currentExercise.note,
        sets: activeSets,
        volume,
      },
    }));

    updateExerciseRecord(currentExercise.id, currentExercise.name, activeSets, new Date().toISOString());

    if (currentExerciseIndex < selectedWorkout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    if (selectedWorkout && sessionStart && workoutStartTime && user) {
      const end = new Date().toISOString();
      const durationSeconds = Math.floor((Date.now() - workoutStartTime) / 1000);
      const durationMinutes = Math.round(durationSeconds / 60);

      const allExercises = Object.values(workoutExercisesData);
      const totalVol = allExercises.reduce((sum, ex) => sum + ex.volume, 0);
      const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);

      const log: WorkoutSessionLog = {
        id: crypto.randomUUID(),
        workoutId: selectedWorkout.id,
        workoutName: selectedWorkout.name,
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
        await supabase.from('workout_sessions').insert({
          user_id: user.id,
          workout_id: log.workoutId,
          workout_name: log.workoutName,
          started_at: log.startedAt,
          ended_at: log.endedAt,
          duration_minutes: log.durationMinutes,
          duration_seconds: log.durationSeconds,
          total_volume: log.totalVolume,
          total_sets_completed: log.totalSetsCompleted,
          is_deload: log.isDeload,
          notes: log.notes,
          exercises: log.exercises,
          new_prs: log.newPRs
        });

        await supabase.from('workouts').update({
          last_performed: end,
          updated_at: new Date().toISOString()
        }).eq('id', selectedWorkout.id);

        setWorkouts(prev => prev.map(w => 
          w.id === selectedWorkout.id ? { ...w, lastPerformed: end } : w
        ));

      } catch (err) {
        console.error("Error saving workout session:", err);
      }

      setWorkoutDuration(durationSeconds);
      setTotalVolume(totalVol);
      setTotalSetsCompleted(totalSets);
      setShowSummary(true);
    }
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

  const handleAddExerciseToWorkout = (workoutId: string, exerciseId: string) => {
    const exerciseToAdd = ALL_EXERCISES.find((ex) => ex.id === exerciseId);
    if (!exerciseToAdd) return;

    let updatedWorkout: Workout | null = null;

    setWorkouts((prev) => prev.map((w) => {
      if (w.id !== workoutId) return w;
      if (w.exercises.some((ex) => ex.id === exerciseId)) return w;

      const updated = [...w.exercises, { ...exerciseToAdd }];
      updatedWorkout = { ...w, exercises: updated, exerciseCount: updated.length };
      return updatedWorkout;
    }));

    if (updatedWorkout) saveWorkoutToDb(updatedWorkout);
  };

  const handleRemoveExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    let updatedWorkout: Workout | null = null;

    setWorkouts((prev) => prev.map((w) => {
      if (w.id !== workoutId) return w;
      const updated = w.exercises.filter((ex) => ex.id !== exerciseId);
      updatedWorkout = { ...w, exercises: updated, exerciseCount: updated.length };
      return updatedWorkout;
    }));

    if (updatedWorkout) saveWorkoutToDb(updatedWorkout);

    if (selectedWorkoutId === workoutId) {
      setCurrentExerciseIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMoveExercise = (workoutId: string, from: number, to: number) => {
    let updatedWorkout: Workout | null = null;

    setWorkouts((prev) => prev.map((w) => {
      if (w.id !== workoutId) return w;
      const exercises = [...w.exercises];
      if (to < 0 || to >= exercises.length) return w;

      const [moved] = exercises.splice(from, 1);
      exercises.splice(to, 0, moved);

      updatedWorkout = { ...w, exercises };
      return updatedWorkout;
    }));

    if (updatedWorkout) saveWorkoutToDb(updatedWorkout);

    if (selectedWorkoutId === workoutId) {
      setCurrentExerciseIndex(to);
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

  const filteredExercises = ALL_EXERCISES.filter((ex) => {
    if (exerciseFilter !== "all" && ex.muscleGroup !== exerciseFilter) return false;
    if (!exerciseSearch.trim()) return true;

    const q = exerciseSearch.toLowerCase();
    return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
  });

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) || null;
  const totalVolumeAllTime = sessionLogs.reduce((sum, log) => sum + log.totalVolume, 0);

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
    <div className="min-h-screen bg-black text-white p-6">
      <button
        onClick={() => supabase.auth.signOut()}
        className="fixed top-4 right-4 bg-slate-900 border border-slate-800 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900 px-4 py-2 rounded-lg text-xs font-medium z-50 transition-all"
      >
        Sign Out
      </button>

      {isLoadingData && <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-3 mb-4 text-sm">Lade Daten...</div>}
      {error && <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {showPRNotification && sessionPRs.length > 0 && (
        <div className="fixed top-20 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="font-bold text-lg flex items-center gap-2">
            🎉 NEW PR!
          </div>
          <div className="text-sm mt-1">
            {sessionPRs[sessionPRs.length - 1].exerciseName} - {sessionPRs[sessionPRs.length - 1].type.toUpperCase()}
          </div>
        </div>
      )}

      {mode === "overview" && !isLoadingData && (
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-6">💪 Fitness Tracker</h1>
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

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">✨ Create a new workout</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Push Day"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Chest, shoulders, triceps focus..."
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
              + Create Workout
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your workouts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workouts.map((w, index) => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => setDraggedWorkoutIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); setDraggedWorkoutIndex(index); }}
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

          {sessionLogs.length > 0 && (
            <div>
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

      {mode === "selectExercises" && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">Select Exercises for {selectedWorkout?.name}</h2>
            <p className="text-slate-400 text-sm mb-4">Choose exercises to add to your workout</p>

            {selectedExerciseIds.length > 0 && (
              <div className="mb-4 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded-lg">
                <p className="text-sm text-emerald-400 mb-2">{selectedExerciseIds.length} exercise(s) selected</p>
                <div className="flex flex-wrap gap-2">
                  {selectedExerciseIds.map(id => {
                    const ex = ALL_EXERCISES.find(e => e.id === id);
                    return ex ? (
                      <span key={id} className="px-3 py-1 bg-emerald-500 text-black rounded-full text-xs font-medium">
                        {ex.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowExerciseSearchModal(true)}
                className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all"
              >
                + Add Exercises
              </button>
              {selectedExerciseIds.length > 0 && (
                <button
                  onClick={handleConfirmExerciseSelection}
                  className="flex-1 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                >
                  Start Workout →
                </button>
              )}
              <button
                onClick={() => {
                  setMode("overview");
                  setSelectedWorkoutId(null);
                  setSelectedExerciseIds([]);
                }}
                className="px-6 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "active" && selectedWorkout && (
        <>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-2xl font-bold">{selectedWorkout.name}</h1>
                <p className="text-sm text-slate-400">
                  Exercise {currentExerciseIndex + 1} of {selectedWorkout.exercises.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                  {formatTime(workoutElapsedSeconds)}
                </div>
                <p className="text-xs text-slate-400">Workout Duration</p>
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
              <button
                onClick={() => {
                  setMode("overview");
                  setSelectedWorkoutId(null);
                  setWorkoutStartTime(null);
                  setWorkoutElapsedSeconds(0);
                }}
                className="ml-auto px-4 py-1 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/20 transition-all"
              >
                Exit
              </button>
            </div>

            {sessionPRs.length > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-xs font-bold text-amber-400 mb-1">🎉 Personal Records This Session: {sessionPRs.length}</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h3 className="font-bold text-sm mb-3">Workout Plan</h3>
                <div className="space-y-2">
                  {selectedWorkout.exercises.map((ex, index) => (
                    <div
                      key={ex.id}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                      onDrop={() => {
                        if (draggedIndex !== null) handleMoveExercise(selectedWorkout.id, draggedIndex, index);
                        setDraggedIndex(null);
                      }}
                      onClick={() => setCurrentExerciseIndex(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${
                        index === currentExerciseIndex
                          ? "bg-emerald-900/20 border-emerald-500/50"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">
                          {index < currentExerciseIndex ? "✓" : index + 1}
                        </span>
                        <span className="text-sm">{ex.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExerciseFromWorkout(selectedWorkout.id, ex.id);
                        }}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h3 className="font-bold text-sm mb-3">Add Exercise</h3>

                <div className="flex flex-wrap gap-1 mb-3">
                  {["all", ...MUSCLE_GROUPS].map(g => (
                    <button
                      key={g}
                      onClick={() => setExerciseFilter(g as string)}
                      className={`px-2 py-1 text-[10px] uppercase rounded-md border ${
                        exerciseFilter === g
                          ? "bg-emerald-500 text-black border-emerald-500"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 mb-3"
                />

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredExercises.slice(0, 20).map(ex => (
                    <ExerciseItem
                      key={ex.id}
                      id={ex.id}
                      name={ex.name}
                      muscleGroup={ex.muscleGroup}
                      imageUrl={ex.imageUrl}
                      onAdd={(id: string) => handleAddExerciseToWorkout(selectedWorkout.id, id)}
                      onInfoClick={() => setSelectedExerciseDetail(ex)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedWorkout.exercises[currentExerciseIndex] && (
                <>
                  <ActiveWorkoutCard
                    exerciseId={selectedWorkout.exercises[currentExerciseIndex].id}
                    exerciseName={selectedWorkout.exercises[currentExerciseIndex].name}
                    muscleGroup={selectedWorkout.exercises[currentExerciseIndex].muscleGroup}
                    sets={activeSets}
                    note={selectedWorkout.exercises[currentExerciseIndex].note}
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
                      setWorkouts(prev => prev.map(w => 
                        w.id === selectedWorkout.id ? {
                          ...w,
                          exercises: w.exercises.map((ex, i) => 
                            i === currentExerciseIndex ? { ...ex, note } : ex
                          )
                        } : w
                      ));
                    }}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {currentExerciseIndex > 0 && (
                      <button
                        onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
                        className="py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        ← Previous
                      </button>
                    )}
                    <button
                      onClick={handleNextExercise}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        currentExerciseIndex < selectedWorkout.exercises.length - 1
                          ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black"
                      } ${currentExerciseIndex === 0 ? "col-span-2" : ""}`}
                    >
                      {currentExerciseIndex < selectedWorkout.exercises.length - 1 ? "Next Exercise →" : "Finish Workout 🎉"}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h3 className="font-bold text-sm mb-2">Session Notes</h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none"
                  placeholder="Wie war das Training insgesamt?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showSummary && workoutDuration != null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-2">Workout Completed!</h2>
            <p className="text-slate-400 mb-6">Great job smashing your goals today.</p>

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
                setMode("overview");
                setSelectedWorkoutId(null);
                setWorkoutStartTime(null);
                setWorkoutElapsedSeconds(0);
                setSessionPRs([]);
              }}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {showRestTimer && (
        <RestTimer
          initialSeconds={customRestSeconds}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}

      <ExerciseDetailModal
        exercise={selectedExerciseDetail}
        onClose={() => setSelectedExerciseDetail(null)}
      />

      <ExerciseSearchModal
        isOpen={showExerciseSearchModal}
        onClose={() => setShowExerciseSearchModal(false)}
        onSelectExercise={(exerciseId: string) => {
          setSelectedExerciseIds(prev => 
            prev.includes(exerciseId)
              ? prev.filter(id => id !== exerciseId)
              : [...prev, exerciseId]
          );
        }}
        allExercises={ALL_EXERCISES}
        muscleGroups={MUSCLE_GROUPS}
        selectedExerciseIds={selectedExerciseIds}     // 🆕 HINZUFÜGEN
        multiSelect={mode === "selectExercises"}       // 🆕 HINZUFÜGEN
      />

      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}

export default App;
