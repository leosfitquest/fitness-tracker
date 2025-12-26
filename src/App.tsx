import { useState, useEffect } from "react";
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import type { User } from '@supabase/supabase-js'
import { StatsCard } from "./components/StatsCard";
import { WorkoutCard } from "./components/WorkoutCard";
import { ExerciseItem } from "./components/ExerciseItem";
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { RestTimer } from "./components/RestTimer";
import { ExerciseDetailModal } from "./components/ExerciseDetailModal";
import { RAW_EXERCISES } from "./exercises-data";
import type { RawExercise } from "./exercises-data";
import './index.css'

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "glutes",
] as const;
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

type Exercise = {
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

type Workout = {
  id: string;
  name: string;
  description?: string;
  exerciseCount: number;
  estimatedDuration?: number;
  lastPerformed?: string;
  exercises: Exercise[];
};

type ActiveSet = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
};

type ExerciseSessionData = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  note?: string;
  sets: ActiveSet[];
  volume: number;
};

type WorkoutSessionLog = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  durationSeconds: number;
  totalVolume: number;
  totalSetsCompleted: number;
  isDeload: boolean;
  notes?: string;
  exercises: ExerciseSessionData[];
};

type ExerciseRecord = {
  exerciseId: string;
  exerciseName: string;
  bestVolume: number;
  bestSet: { weight: number; reps: number; date: string };
  estimated1RM: number;
};

const mapPrimaryToMuscleGroup = (primaryMuscles: string[]): MuscleGroup => {
  const m = primaryMuscles[0]?.toLowerCase() || "";
  if (m.includes("chest")) return "chest";
  if (m.includes("back") || m.includes("lats")) return "back";
  if (
    m.includes("leg") ||
    m.includes("quad") ||
    m.includes("hamstring") ||
    m.includes("calf")
  )
    return "legs";
  if (m.includes("shoulder") || m.includes("deltoid")) return "shoulders";
  if (
    m.includes("bicep") ||
    m.includes("tricep") ||
    m.includes("forearm") ||
    m.includes("arm")
  )
    return "arms";
  if (m.includes("abdominals") || m.includes("obliques") || m.includes("core"))
    return "core";
  if (m.includes("glute")) return "glutes";
  return "core";
};

const GITHUB_IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const ALL_EXERCISES: Exercise[] = RAW_EXERCISES.map((ex: RawExercise) => ({
  id: ex.id,
  name: ex.name,
  muscleGroup: mapPrimaryToMuscleGroup(ex.primaryMuscles),
  imageUrl:
    ex.images && ex.images.length > 0
      ? `${GITHUB_IMAGE_BASE}${ex.images[0]}`
      : undefined,
  instructions: ex.instructions,
  equipment: ex.equipment,
  primaryMuscles: ex.primaryMuscles,
  secondaryMuscles: ex.secondaryMuscles,
}));

const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
};

const calculatePlates = (targetWeight: number, barWeight: number = 20): string[] => {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const weightPerSide = (targetWeight - barWeight) / 2;
  const result: string[] = [];
  let remaining = weightPerSide;

  for (const plate of plates) {
    while (remaining >= plate) {
      result.push(`${plate}kg`);
      remaining -= plate;
    }
  }

  return result.length > 0 ? result : ["Nur Stange"];
};

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessionLogs, setSessionLogs] = useState<WorkoutSessionLog[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<Record<string, ExerciseRecord>>({});

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const [mode, setMode] = useState<"overview" | "active">("overview");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const [workoutExercisesData, setWorkoutExercisesData] = useState<
    Record<string, ExerciseSessionData>
  >({});

  const [activeSets, setActiveSets] = useState<ActiveSet[]>([
    { setNumber: 1, weight: null, reps: null, rpe: null, completed: false },
  ]);

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [customRestSeconds, setCustomRestSeconds] = useState(90);
  const [autoStartRest, setAutoStartRest] = useState(true);
  const [isDeload, setIsDeload] = useState(false);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");

  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState<MuscleGroup | "all">("all");
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedWorkoutIndex, setDraggedWorkoutIndex] = useState<number | null>(null);

  const [show1RMCalc, setShow1RMCalc] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState<number>(100);
  const [calcReps, setCalcReps] = useState<number>(5);

  // Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load data from Supabase
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

        // Map Workouts (snake_case -> camelCase)
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
          durationSeconds: l.duration_seconds || 0,
          totalVolume: Number(l.total_volume),
          totalSetsCompleted: l.total_sets_completed,
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

  // Helper to save specific workout changes to DB
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

  const updateExerciseRecord = async (
    exerciseId: string,
    exerciseName: string,
    sets: ActiveSet[],
    date: string
  ) => {
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
    
    if (!currentRecord || maxVolume > currentRecord.bestVolume || max1RM > currentRecord.estimated1RM) {
      const newRecord = {
        exerciseId,
        exerciseName,
        bestVolume: Math.max(currentRecord?.bestVolume || 0, maxVolume),
        bestSet: (!currentRecord || maxVolume > currentRecord.bestVolume) 
                  ? { ...bestSet, date } 
                  : currentRecord.bestSet,
        estimated1RM: Math.max(currentRecord?.estimated1RM || 0, max1RM),
      };

      setExerciseRecords((prev) => ({
        ...prev,
        [exerciseId]: newRecord,
      }));

      try {
        const { error } = await supabase.from('exercise_records').upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          best_volume: newRecord.bestVolume,
          best_set: newRecord.bestSet,
          estimated_1rm: newRecord.estimated1RM,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,exercise_id' });
        
        if (error) throw error;
      } catch (err) {
        console.error("Error saving record:", err);
      }
    }
  };

  const filteredExercises = ALL_EXERCISES.filter((ex) => {
    if (exerciseFilter !== "all" && ex.muscleGroup !== exerciseFilter) {
      return false;
    }
    if (!exerciseSearch.trim()) return true;
    const q = exerciseSearch.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q)
    );
  });

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) || null;
  const totalVolumeAllTime = sessionLogs.reduce((sum, log) => sum + log.totalVolume, 0);
  const totalPRs = Object.keys(exerciseRecords).length;

  const handleExportData = () => {
    const data = {
      workouts,
      sessionLogs,
      exerciseRecords,
      exportedAt: new Date().toISOString(),
      version: "3.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Import ist bei Datenbank-Sync momentan deaktiviert.");
  };

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
    const volume = activeSets.reduce((sum, set) => {
      if (set.weight && set.reps) return sum + set.weight * set.reps;
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

    updateExerciseRecord(
      currentExercise.id,
      currentExercise.name,
      activeSets,
      new Date().toISOString()
    );

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
      const totalSets = allExercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
        0
      );

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
      };

      setSessionLogs((prev) => [log, ...prev]);
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === selectedWorkout.id
            ? { ...w, lastPerformed: end.split("T")[0] }
            : w
        )
      );
      setWorkoutDuration(durationSeconds);
      setTotalVolume(totalVol);
      setTotalSetsCompleted(totalSets);
      setShowSummary(true);

      try {
        const { error: sessionError } = await supabase.from('workout_sessions').insert({
          id: log.id,
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
          exercises: log.exercises
        });
        if(sessionError) throw sessionError;

        const { error: workoutError } = await supabase.from('workouts').update({
            last_performed: end.split("T")[0]
        }).eq('id', selectedWorkout.id);
        if(workoutError) throw workoutError;

      } catch (err) {
        console.error("Error saving session:", err);
        alert("Fehler beim Speichern der Session.");
      }
    }
    resetAfterWorkout();
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

  const handleSaveEditWorkout = async () => {
    if (!editingWorkoutId || !editName.trim() || !user) {
      setEditingWorkoutId(null);
      return;
    }

    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === editingWorkoutId
          ? {
              ...w,
              name: editName.trim(),
              description: editDescription.trim() || undefined,
            }
          : w
      )
    );

    try {
        const { error } = await supabase.from('workouts').update({
            name: editName.trim(),
            description: editDescription.trim() || null
        }).eq('id', editingWorkoutId);
        if (error) throw error;
    } catch(err) {
        console.error("Error editing workout:", err);
        alert("Fehler beim Ändern des Workouts");
    }

    setEditingWorkoutId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleCancelEditWorkout = () => {
    setEditingWorkoutId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleEditWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id);
    if (!workout) return;
    setEditingWorkoutId(id);
    setEditName(workout.name);
    setEditDescription(workout.description || "");
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Workout wirklich löschen?")) return;
    
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    if (selectedWorkoutId === id) {
      setSelectedWorkoutId(null);
      setMode("overview");
    }

    try {
        const { error } = await supabase.from('workouts').delete().eq('id', id);
        if(error) throw error;
    } catch(err) {
        console.error("Error deleting workout:", err);
        alert("Fehler beim Löschen");
    }
  };

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
        if (!data) throw new Error("No data returned");

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

  const handleAddExerciseToWorkout = (workoutId: string, exerciseId: string) => {
    let updatedWorkout: Workout | null = null;
    
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;
        const exercise = ALL_EXERCISES.find((e) => e.id === exerciseId);
        if (!exercise) return w;
        const updatedExercises = [...w.exercises, { ...exercise }];
        updatedWorkout = {
            ...w,
            exercises: updatedExercises,
            exerciseCount: updatedExercises.length,
        };
        return updatedWorkout;
      })
    );

    if (updatedWorkout) {
        saveWorkoutToDb(updatedWorkout);
    }
  };

  const handleRemoveExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    let updatedWorkout: Workout | null = null;

    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;
        const updated = w.exercises.filter((ex) => ex.id !== exerciseId);
        updatedWorkout = {
            ...w,
            exercises: updated,
            exerciseCount: updated.length,
        };
        return updatedWorkout;
      })
    );

    if (updatedWorkout) {
        saveWorkoutToDb(updatedWorkout);
    }

    if (selectedWorkoutId === workoutId) {
      setCurrentExerciseIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMoveExercise = (workoutId: string, from: number, to: number) => {
    let updatedWorkout: Workout | null = null;

    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;
        const exercises = [...w.exercises];
        if (to < 0 || to >= exercises.length) return w;
        const [moved] = exercises.splice(from, 1);
        exercises.splice(to, 0, moved);
        updatedWorkout = { ...w, exercises };
        return updatedWorkout;
      })
    );

    if (updatedWorkout) {
        saveWorkoutToDb(updatedWorkout);
    }

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

  const handleBackToOverview = () => {
    resetAfterWorkout();
  };

  const handleExerciseClick = (exerciseId: string) => {
    const exercise = ALL_EXERCISES.find((ex) => ex.id === exerciseId);
    if (exercise) {
      setSelectedExerciseDetail(exercise);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && selectedWorkout) {
      handleMoveExercise(selectedWorkout.id, draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleWorkoutDragStart = (index: number) => {
    setDraggedWorkoutIndex(index);
  };

  const handleWorkoutDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedWorkoutIndex(index);
  };

  const handleWorkoutDrop = (index: number) => {
    if (draggedWorkoutIndex !== null) {
      handleMoveWorkout(draggedWorkoutIndex, index);
    }
    setDraggedWorkoutIndex(null);
  };

  const estimated1RM = calculate1RM(calcWeight, calcReps);
  const platesList = calculatePlates(calcWeight);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-2xl text-emerald-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <button
        onClick={() => supabase.auth.signOut()}
        className="fixed top-4 right-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium z-50"
      >
        Sign Out
      </button>

      <div className="w-full max-w-5xl px-4 py-10 space-y-8 relative">
        {isLoadingData && (
             <div className="text-center text-emerald-500 py-4 animate-pulse">Lade Daten...</div>
        )}
        {error && (
             <div className="text-center text-red-500 py-4 bg-red-900/20 rounded-lg border border-red-800">{error}</div>
        )}

        {mode === "overview" && (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <StatsCard
                title="Workouts saved"
                value={workouts.length}
                subtitle="Total workouts"
              />
              <StatsCard
                title="Total volume"
                value={totalVolumeAllTime.toLocaleString()}
                subtitle="All time · kg·reps"
              />
              <StatsCard
                title="Personal Records"
                value={totalPRs}
                subtitle="Tracked exercises"
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <button
                onClick={() => setShow1RMCalc(!show1RMCalc)}
                className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all text-sm font-medium"
              >
                🧮 1RM Calculator
              </button>
              <button
                onClick={() => setShowPlateCalc(!showPlateCalc)}
                className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all text-sm font-medium"
              >
                ⚖️ Plate Calculator
              </button>
            </div>

            {show1RMCalc && (
              <div className="rounded-lg border border-emerald-500/50 bg-slate-900 p-4 space-y-3">
                <h3 className="text-sm font-semibold">1RM Calculator (Brzycki)</h3>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Weight (kg)</label>
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Reps</label>
                    <input
                      type="number"
                      value={calcReps}
                      onChange={(e) => setCalcReps(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-center p-3 bg-emerald-950/50 rounded-lg border border-emerald-500/30">
                  <div className="text-xs text-slate-400">Estimated 1RM</div>
                  <div className="text-3xl font-black text-emerald-400">
                    {estimated1RM} kg
                  </div>
                </div>
              </div>
            )}

            {showPlateCalc && (
              <div className="rounded-lg border border-blue-500/50 bg-slate-900 p-4 space-y-3">
                <h3 className="text-sm font-semibold">Plate Calculator</h3>
                <div>
                  <label className="text-xs text-slate-400">Total Weight (kg)</label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="p-3 bg-blue-950/50 rounded-lg border border-blue-500/30">
                  <div className="text-xs text-slate-400 mb-2">
                    Pro Seite auflegen:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {platesList.map((plate, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono"
                      >
                        {plate}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
              <h2 className="text-lg font-semibold">Create a new workout</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Name</label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. Push Day"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-slate-400">Description</label>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Chest, shoulders, triceps..."
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">
                    Estimated duration (min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={handleCreateWorkout}
                    disabled={isLoadingData}
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    Save workout
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm text-slate-400 flex items-center gap-2">
                Your workouts
                <span className="text-[10px] text-slate-500">
                  (Drag zum Reihenfolge ändern)
                </span>
              </h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {workouts.map((w, index) => (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => handleWorkoutDragStart(index)}
                    onDragOver={(e) => handleWorkoutDragOver(e, index)}
                    onDrop={() => handleWorkoutDrop(index)}
                    onDragEnd={() => setDraggedWorkoutIndex(null)}
                    className={`p-3 rounded-lg border transition-all cursor-move ${
                      draggedWorkoutIndex === index ? "opacity-50 scale-95" : ""
                    } ${
                      index === 0
                        ? "border-emerald-500 bg-emerald-950/30 shadow-lg"
                        : "border-slate-800 bg-slate-900 hover:bg-slate-800"
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

            {sessionLogs.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
                <h2 className="text-lg font-semibold">Recent sessions</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.workoutName}{" "}
                          <span className="text-[10px] text-slate-400">
                            ({new Date(log.startedAt).toLocaleDateString()})
                          </span>
                        </span>
                        <span className="text-slate-400">
                          {log.durationMinutes} min · {log.totalSetsCompleted} sets ·{" "}
                          {log.totalVolume.toLocaleString()} kg·reps
                        </span>
                      </div>
                      {log.isDeload && (
                        <span className="px-2 py-1 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Deload
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editingWorkoutId && (
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-100">Edit workout</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Name</label>
                    <input
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-slate-400">Description</label>
                    <input
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEditWorkout}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditWorkout}
                    className="rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === "active" && selectedWorkout && (
          <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-sm py-4 z-10">
              <div>
                <h1 className="text-2xl font-semibold">{selectedWorkout.name}</h1>
                <p className="text-sm text-slate-400">
                  {currentExerciseIndex + 1} / {selectedWorkout.exercises.length}{" "}
                  exercises
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStartRest}
                    onChange={(e) => setAutoStartRest(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-medium">Auto Rest</span>
                </label>

                <label className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDeload}
                    onChange={(e) => setIsDeload(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-medium">Deload</span>
                </label>

                <button
                  onClick={handleBackToOverview}
                  className="rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium hover:bg-slate-800"
                >
                  ← Back
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm text-slate-400">
                Exercises <span className="text-[10px] text-slate-500">(Drag zum Verschieben)</span>
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {selectedWorkout.exercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-lg border transition-all cursor-grab ${
                      draggedIndex === index ? "opacity-50" : ""
                    } ${
                      index === currentExerciseIndex
                        ? "border-emerald-500 bg-emerald-950/50"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1" onClick={() => setCurrentExerciseIndex(index)}>
                        <span className="font-medium">{ex.name}</span>
                        <span className="text-xs text-slate-400 ml-2 px-2 py-1 bg-slate-800 rounded-full">
                          {ex.muscleGroup}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveExerciseFromWorkout(selectedWorkout.id, ex.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {["all", ...MUSCLE_GROUPS].map((group) => (
                  <button
                    key={group}
                    onClick={() => setExerciseFilter(group === "all" ? "all" : (group as MuscleGroup))}
                    className={`px-2 py-1 text-[10px] rounded-full border ${
                      exerciseFilter === group
                        ? "border-emerald-500 bg-emerald-900"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {filteredExercises.map((ex) => (
                  <ExerciseItem
                    key={ex.id}
                    id={ex.id}
                    name={ex.name}
                    muscleGroup={ex.muscleGroup}
                    imageUrl={ex.imageUrl}
                    onClick={(exerciseId) => handleAddExerciseToWorkout(selectedWorkout.id, exerciseId)}
                    onInfoClick={handleExerciseClick}
                  />
                ))}
              </div>
            </div>

            {selectedWorkout.exercises[currentExerciseIndex] && (
              <>
                {selectedWorkout.exercises[currentExerciseIndex].imageUrl && (
                  <img
                    src={selectedWorkout.exercises[currentExerciseIndex].imageUrl}
                    alt={selectedWorkout.exercises[currentExerciseIndex].name}
                    className="w-full max-h-64 object-cover rounded-lg border border-slate-800 cursor-pointer"
                    onClick={() => handleExerciseClick(selectedWorkout.exercises[currentExerciseIndex].id)}
                  />
                )}

                <ActiveWorkoutCard
                  exerciseId={selectedWorkout.exercises[currentExerciseIndex].id}
                  exerciseName={selectedWorkout.exercises[currentExerciseIndex].name}
                  muscleGroup={selectedWorkout.exercises[currentExerciseIndex].muscleGroup}
                  sets={activeSets}
                  note={selectedWorkout.exercises[currentExerciseIndex].note}
                  isDeload={isDeload}
                  onSetChange={(index, field, value) => {
                    setActiveSets((prev) => {
                      const updated = prev.map((s, i) =>
                        i === index
                          ? { ...s, [field]: field === "completed" ? Boolean(value) : value }
                          : s
                      );

                      if (field === "completed" && value && autoStartRest) {
                        setShowRestTimer(true);
                      }

                      let volume = 0;
                      let setsDone = 0;
                      for (const set of updated) {
                        if (set.weight != null && set.reps != null) {
                          volume += set.weight * set.reps;
                        }
                        if (set.completed) {
                          setsDone += 1;
                        }
                      }
                      setTotalVolume(volume);
                      setTotalSetsCompleted(setsDone);

                      return updated;
                    });
                  }}
                  onAddSet={() =>
                    setActiveSets((prev) => [
                      ...prev,
                      {
                        setNumber: prev.length + 1,
                        weight: null,
                        reps: null,
                        rpe: null,
                        completed: false,
                      },
                    ])
                  }
                  onStartRest={(seconds) => {
                    setCustomRestSeconds(seconds);
                    setShowRestTimer(true);
                  }}
                  onNoteChange={(note) => {
                    setWorkouts((prev) =>
                      prev.map((w) =>
                        w.id === selectedWorkout!.id
                          ? {
                              ...w,
                              exercises: w.exercises.map((ex, i) =>
                                i === currentExerciseIndex ? { ...ex, note } : ex
                              ),
                            }
                          : w
                      )
                    );
                  }}
                />

                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm flex flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Total volume</div>
                    <div className="font-semibold text-emerald-400">
                      {totalVolume.toLocaleString()} kg·reps
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Sets completed</div>
                    <div className="font-semibold">{totalSetsCompleted}</div>
                  </div>
                  {workoutStartTime && (
                    <div>
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="font-semibold">
                        {Math.floor((Date.now() - workoutStartTime) / 60000)}:
                        {Math.floor(((Date.now() - workoutStartTime) / 1000) % 60)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextExercise}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  {currentExerciseIndex < selectedWorkout.exercises.length - 1
                    ? "Next Exercise →"
                    : "Complete Workout ✅"}
                </button>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">
                📝 Session Notes
              </label>
              <textarea
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs min-h-[60px]"
                placeholder="Wie war die Session?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>

            {showSummary && workoutDuration != null && (
              <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-950/50 p-6 space-y-3">
                <div className="text-xl font-bold text-emerald-400">
                  🎉 Workout completed!
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-400">Duration</div>
                    <div className="text-2xl font-black text-emerald-400">
                      {Math.floor(workoutDuration / 60)}m {workoutDuration % 60}s
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Volume</div>
                    <div className="text-2xl font-black text-emerald-400">
                      {totalVolume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Sets</div>
                    <div className="text-2xl font-black text-emerald-400">
                      {totalSetsCompleted}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleBackToOverview}
                  className="w-full rounded-md bg-emerald-900/50 px-4 py-2 text-sm font-medium"
                >
                  ← Back to overview
                </button>
              </div>
            )}

            {showRestTimer && (
              <RestTimer
                initialSeconds={customRestSeconds}
                onDismiss={() => setShowRestTimer(false)}
              />
            )}
          </div>
        )}
      </div>

      <ExerciseDetailModal
        exercise={selectedExerciseDetail}
        onClose={() => setSelectedExerciseDetail(null)}
      />
    </div>
  );
}

export default App;
