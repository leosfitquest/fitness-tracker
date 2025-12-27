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
import { ToolsSection } from "./components/Tools"; // NEU: Importiert

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
  totalVolume: number;
  totalSetsCompleted: number;
  isDeload: boolean;
  notes?: string;
  exercises: ExerciseSessionData[];
};

export type ExerciseRecord = {
  exerciseId: string;
  exerciseName: string;
  bestVolume: number;
  bestSet: { weight: number; reps: number; date?: string }; // date optional gemacht
  estimated1RM: number;
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
  const [mode, setMode] = useState<"overview" | "active">("overview");
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
  
  // Active Workout Stats
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);

  // Exercise Search/Detail
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState<MuscleGroup | "all">("all");
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
          totalVolume: Number(l.total_volume),
          totalSetsCompleted: l.total_sets,
          isDeload: l.is_deload,
          notes: l.notes,
          exercises: l.exercises || []
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

  // --- Logic Methods ---

  const saveWorkoutToDb = async (workout: Workout) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('workouts').update({
        name: workout.name,
        description: workout.description,
        exercises: workout.exercises,
        exercise_count: workout.exercises.length,
        estimated_duration: workout.estimatedDuration
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
    
    // Check if new PR
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

  // Workout Actions
  const handleStartWorkout = (id: string) => {
    setSelectedWorkoutId(id);
    setCurrentExerciseIndex(0);
    setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    setWorkoutExercisesData({});
    setMode("active");
    setIsDeload(false);
    setSessionStart(new Date().toISOString());
    setSessionNotes("");
    setWorkoutStartTime(Date.now());
    setWorkoutDuration(null);
    setTotalVolume(0);
    setTotalSetsCompleted(0);
    setShowSummary(false);
  };

  const handleNextExercise = () => {
    if (!selectedWorkout) return;

    const currentExercise = selectedWorkout.exercises[currentExerciseIndex];
    // Calculate volume just for this exercise to save in state
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
      const durationSeconds = Math.round((Date.now() - workoutStartTime) / 1000);
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
        totalVolume: totalVol,
        totalSetsCompleted: totalSets,
        isDeload,
        notes: sessionNotes,
        exercises: allExercises,
      };

      setSessionLogs((prev) => [log, ...prev]);
      setWorkouts((prev) => prev.map((w) => w.id === selectedWorkout.id ? { ...w, lastPerformed: end.split("T")[0] } : w));
      setWorkoutDuration(durationSeconds);
      setTotalVolume(totalVol);
      setTotalSetsCompleted(totalSets);
      setShowSummary(true);

      try {
        await supabase.from('workout_sessions').insert({
          id: log.id,
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
        });

        await supabase.from('workouts').update({ last_performed: end.split("T")[0] }).eq('id', selectedWorkout.id);
      } catch (err) {
        console.error("Error saving session:", err);
        alert("Fehler beim Speichern der Session.");
      }
    }
    // Note: Don't reset immediately so user can see summary
  };

  const resetAfterWorkout = () => {
    setMode("overview");
    setSelectedWorkoutId(null);
    setCurrentExerciseIndex(0);
    setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]);
    setWorkoutExercisesData({});
    setShowRestTimer(false);
    setSessionStart(null);
    setSessionNotes("");
    setIsDeload(false);
    setWorkoutStartTime(null);
    setWorkoutDuration(null);
    setShowSummary(false);
  };

  // CRUD Workouts
  const handleCreateWorkout = async () => {
    if (!newName.trim() || !user) {
      alert("Bitte einen Namen für das Workout eingeben.");
      return;
    }
    try {
        const { data, error } = await supabase.from('workouts').insert({
            user_id: user.id,
            name: newName.trim(),
            description: newDescription.trim() || null,
            estimated_duration: newDuration ? Number(newDuration) : null,
            exercise_count: 0,
            exercises: []
        }).select().single();

        if (error) throw error;

        const newWorkout: Workout = {
            id: data.id,
            name: data.name,
            description: data.description,
            exerciseCount: 0,
            estimatedDuration: data.estimated_duration,
            exercises: [],
        };

        setWorkouts((prev) => [newWorkout, ...prev]);
        setNewName("");
        setNewDescription("");
        setNewDuration("");
    } catch (err) {
        console.error("Error creating workout:", err);
        alert("Fehler beim Erstellen des Workouts.");
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Workout wirklich löschen?")) return;
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    try {
        await supabase.from('workouts').delete().eq('id', id);
    } catch(err) {
        console.error("Error deleting workout:", err);
    }
  };

  const handleEditWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id);
    if (!workout) return;
    setEditingWorkoutId(id);
    setEditName(workout.name);
    setEditDescription(workout.description || "");
  };

  const handleSaveEditWorkout = async () => {
    if (!editingWorkoutId || !editName.trim() || !user) return;
    setWorkouts((prev) => prev.map((w) => w.id === editingWorkoutId ? { ...w, name: editName.trim(), description: editDescription.trim() || undefined } : w));
    try {
        await supabase.from('workouts').update({ name: editName.trim(), description: editDescription.trim() || null }).eq('id', editingWorkoutId);
    } catch(err) {
        console.error("Error editing workout:", err);
    }
    setEditingWorkoutId(null);
  };

  // Exercise Management in Workout
  const handleAddExerciseToWorkout = (workoutId: string, exerciseId: string) => {
    let updatedWorkout: Workout | null = null;
    setWorkouts((prev) => prev.map((w) => {
      if (w.id !== workoutId) return w;
      const exercise = ALL_EXERCISES.find((e) => e.id === exerciseId);
      if (!exercise) return w;
      updatedWorkout = { ...w, exercises: [...w.exercises, { ...exercise }], exerciseCount: w.exercises.length + 1 };
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
    if (selectedWorkoutId === workoutId) setCurrentExerciseIndex((prev) => Math.max(0, prev - 1));
  };

  // Drag & Drop Helpers
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
    if (selectedWorkoutId === workoutId) setCurrentExerciseIndex(to);
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

  // Filtered List
  const filteredExercises = ALL_EXERCISES.filter((ex) => {
    if (exerciseFilter !== "all" && ex.muscleGroup !== exerciseFilter) return false;
    if (!exerciseSearch.trim()) return true;
    const q = exerciseSearch.toLowerCase();
    return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
  });

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) || null;
  const totalVolumeAllTime = sessionLogs.reduce((sum, log) => sum + log.totalVolume, 0);

  // Render Loading
  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center selection:bg-emerald-500/30">
      <button
        onClick={() => supabase.auth.signOut()}
        className="fixed top-4 right-4 bg-slate-900 border border-slate-800 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900 px-4 py-2 rounded-lg text-xs font-medium z-50 transition-all"
      >
        Sign Out
      </button>

      <div className="w-full max-w-5xl px-4 py-10 space-y-8 relative">
        {/* Error / Loading Banner */}
        {isLoadingData && <div className="text-center text-emerald-500 py-4 animate-pulse text-sm">Lade Daten...</div>}
        {error && <div className="text-center text-red-400 py-3 bg-red-900/20 rounded-lg border border-red-900/50 text-sm">{error}</div>}

        {/* --- OVERVIEW MODE --- */}
        {mode === "overview" && !isLoadingData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Header */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
              <StatsCard title="Workouts saved" value={workouts.length} subtitle="Total plans" />
              <StatsCard title="Total volume" value={totalVolumeAllTime.toLocaleString()} subtitle="All time · kg·reps" />
              <StatsCard title="Personal Records" value={Object.keys(exerciseRecords).length} subtitle="Tracked exercises" />
            </div>

            {/* Rechner Tools */}
            <ToolsSection />

            {/* Create Workout Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 mb-8">
              <h2 className="text-lg font-semibold flex items-center gap-2">✨ Create a new workout</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Name</label>
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. Push Day"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs text-slate-400 font-medium">Description</label>
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Chest, shoulders, triceps focus..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Est. duration (min)</label>
                  <input
                    type="number"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={handleCreateWorkout}
                    disabled={isLoadingData}
                    className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
                  >
                    + Create Workout
                  </button>
                </div>
              </div>
            </div>

            {/* Workout List */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm text-slate-400 flex items-center gap-2 uppercase tracking-wider font-semibold">
                Your workouts
              </h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {workouts.map((w, index) => (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => setDraggedWorkoutIndex(index)}
                    onDragOver={(e) => { e.preventDefault(); setDraggedWorkoutIndex(index); }}
                    onDrop={() => { if (draggedWorkoutIndex !== null) handleMoveWorkout(draggedWorkoutIndex, index); setDraggedWorkoutIndex(null); }}
                    className={`rounded-xl border transition-all cursor-move ${
                      index === 0 ? "border-emerald-500/50 bg-emerald-950/10" : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <WorkoutCard
                      id={w.id}
                      name={w.name}
                      description={w.description}
                      exercises={w.exercises.length}
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
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
                <h2 className="text-lg font-semibold">Recent sessions</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {sessionLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm hover:border-slate-700 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-200">{log.workoutName}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.startedAt).toLocaleDateString()} · {log.durationMinutes} min · {log.totalSetsCompleted} sets
                        </span>
                      </div>
                      <div className="text-right">
                         <div className="text-emerald-500 font-mono font-medium">{log.totalVolume.toLocaleString()} kg</div>
                         {log.isDeload && <span className="text-[10px] text-amber-500 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-900/50">Deload</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Modal (Inline) */}
            {editingWorkoutId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-semibold">Edit Workout</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400">Name</label>
                            <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Description</label>
                            <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setEditingWorkoutId(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleSaveEditWorkout} className="px-4 py-2 text-sm bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400">Save</button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* --- ACTIVE WORKOUT MODE --- */}
        {mode === "active" && selectedWorkout && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Active Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-950/95 backdrop-blur-md py-4 z-20 border-b border-slate-800/50">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{selectedWorkout.name}</h1>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  Exercise {currentExerciseIndex + 1} of {selectedWorkout.exercises.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                 {/* Toggles */}
                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800">
                  <input type="checkbox" checked={autoStartRest} onChange={(e) => setAutoStartRest(e.target.checked)} className="accent-blue-500" />
                  <span className="text-xs font-medium text-slate-300">Auto Rest</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800">
                  <input type="checkbox" checked={isDeload} onChange={(e) => setIsDeload(e.target.checked)} className="accent-amber-500" />
                  <span className="text-xs font-medium text-amber-500">Deload</span>
                </label>
                <button onClick={resetAfterWorkout} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700">Exit</button>
              </div>
            </div>

            {/* Main Active Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
              {/* Left Column: Exercise List & Search */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                 {/* Current Exercise List */}
                 <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Workout Plan</h3>
                    <div className="space-y-2">
                        {selectedWorkout.exercises.map((ex, index) => (
                            <div
                                key={ex.id}
                                draggable
                                onDragStart={() => setDraggedIndex(index)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                                onDrop={() => { if (draggedIndex !== null) handleMoveExercise(selectedWorkout.id, draggedIndex, index); setDraggedIndex(null); }}
                                onClick={() => setCurrentExerciseIndex(index)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${
                                    index === currentExerciseIndex 
                                    ? "bg-emerald-900/20 border-emerald-500/50" 
                                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${index < currentExerciseIndex ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}>
                                        {index < currentExerciseIndex ? "✓" : index + 1}
                                    </span>
                                    <span className={`text-sm font-medium ${index === currentExerciseIndex ? "text-emerald-400" : "text-slate-300"}`}>{ex.name}</span>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveExerciseFromWorkout(selectedWorkout.id, ex.id); }}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                                >✕</button>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Add Exercise */}
                 <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Add Exercise</h3>
                    <div className="flex gap-2 flex-wrap">
                        {["all", ...MUSCLE_GROUPS].map(g => (
                            <button key={g} onClick={() => setExerciseFilter(g as any)} className={`px-2 py-1 text-[10px] uppercase rounded-md border ${exerciseFilter === g ? "bg-emerald-500 text-black border-emerald-500" : "bg-slate-900 border-slate-800 text-slate-400"}`}>{g}</button>
                        ))}
                    </div>
                    <input 
                        placeholder="Search..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                        value={exerciseSearch}
                        onChange={e => setExerciseSearch(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {filteredExercises.slice(0, 20).map(ex => (
                            <ExerciseItem 
                                key={ex.id} 
                                {...ex} 
                                onClick={(id) => handleAddExerciseToWorkout(selectedWorkout.id, id)}
                                onInfoClick={() => setSelectedExerciseDetail(ex)}
                            />
                        ))}
                    </div>
                 </div>
              </div>

              {/* Right Column: Active Card */}
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                 {selectedWorkout.exercises[currentExerciseIndex] && (
                    <>
                        <ActiveWorkoutCard
                            exerciseId={selectedWorkout.exercises[currentExerciseIndex].id}
                            exerciseName={selectedWorkout.exercises[currentExerciseIndex].name}
                            muscleGroup={selectedWorkout.exercises[currentExerciseIndex].muscleGroup}
                            sets={activeSets}
                            note={selectedWorkout.exercises[currentExerciseIndex].note}
                            isDeload={isDeload}
                            onSetChange={(index, field, value) => {
                                setActiveSets(prev => {
                                    const updated = prev.map((s, i) => i === index ? { ...s, [field]: field === "completed" ? Boolean(value) : value } : s);
                                    if (field === "completed" && value && autoStartRest) setShowRestTimer(true);
                                    // Live calc stats
                                    const vol = updated.reduce((sum, s) => (s.weight && s.reps && s.completed) ? sum + (s.weight * s.reps) : sum, 0);
                                    const setsDone = updated.filter(s => s.completed).length;
                                    setTotalVolume(vol);
                                    setTotalSetsCompleted(setsDone);
                                    return updated;
                                });
                            }}
                            onAddSet={() => setActiveSets(prev => [...prev, { setNumber: prev.length + 1, weight: null, reps: null, rpe: null, completed: false }])}
                            onStartRest={(s) => { setCustomRestSeconds(s); setShowRestTimer(true); }}
                            onNoteChange={(note) => {
                                // Just update local workout state so it persists if user navigates back/forth in session
                                setWorkouts(prev => prev.map(w => w.id === selectedWorkout.id ? {
                                    ...w, exercises: w.exercises.map((ex, i) => i === currentExerciseIndex ? { ...ex, note } : ex)
                                } : w));
                            }}
                        />

                        {/* Navigation / Complete */}
                        <div className="grid grid-cols-2 gap-4">
                            {currentExerciseIndex > 0 && (
                                <button onClick={() => setCurrentExerciseIndex(prev => prev - 1)} className="py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800">
                                    ← Previous
                                </button>
                            )}
                            <button 
                                onClick={handleNextExercise}
                                className={`py-3 rounded-xl font-bold shadow-lg text-white ${currentExerciseIndex < selectedWorkout.exercises.length - 1 ? "col-start-2 bg-blue-600 hover:bg-blue-500" : "col-span-2 bg-emerald-500 hover:bg-emerald-400 text-black"}`}
                            >
                                {currentExerciseIndex < selectedWorkout.exercises.length - 1 ? "Next Exercise →" : "Finish Workout 🎉"}
                            </button>
                        </div>
                    </>
                 )}
              </div>
            </div>

            {/* Global Session Note */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <label className="text-xs text-slate-400 font-bold uppercase block mb-2">Session Notes</label>
                <textarea 
                    value={sessionNotes} 
                    onChange={e => setSessionNotes(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none"
                    placeholder="Wie war das Training insgesamt?"
                />
            </div>
          </div>
        )}

        {/* --- MODALS --- */}
        
        {/* Summary Modal */}
        {showSummary && workoutDuration != null && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                 <h2 className="text-3xl font-black text-white mb-2 text-center">Workout Completed!</h2>
                 <p className="text-center text-slate-400 mb-8">Great job smashing your goals today.</p>
                 
                 <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-bold text-emerald-400">{Math.floor(workoutDuration / 60)}m</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Duration</div>
                    </div>
                    <div className="text-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-bold text-blue-400">{(totalVolume / 1000).toFixed(1)}k</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Vol (kg)</div>
                    </div>
                    <div className="text-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-bold text-purple-400">{totalSetsCompleted}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Sets</div>
                    </div>
                 </div>

                 <button onClick={resetAfterWorkout} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Back to Dashboard
                 </button>
              </div>
           </div>
        )}

        {/* Rest Timer Overlay */}
        {showRestTimer && (
            <RestTimer initialSeconds={customRestSeconds} onDismiss={() => setShowRestTimer(false)} />
        )}

        {/* Exercise Detail Modal */}
        <ExerciseDetailModal exercise={selectedExerciseDetail} onClose={() => setSelectedExerciseDetail(null)} />
      </div>
    </div>
  );
}

export default App;