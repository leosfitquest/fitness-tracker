import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Components
import { WorkoutsPage } from "./components/WorkoutsPage";
// import { DashboardPage } from "./components/DashboardPage"; // Deprecated
// import { AccountPage } from "./components/AccountPage"; // Replaced by ProfilePage
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { RestTimer } from "./components/RestTimer";
import { ExerciseDetailModal } from "./components/ExerciseDetailModal";
import { ExerciseSearchModal } from "./components/ExerciseSearchModal";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { BottomNav } from "./components/BottomNav";
import { WorkoutTemplateModal } from './components/WorkoutTemplateModal';
import { type WorkoutTemplate } from './data/workoutTemplates';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { ThemeToggle } from './contexts/ThemeToggle';
import { HistoryModal } from "./components/HistoryModal";

// Social Components
import { FeedPage } from "./components/FeedPage";
import { ProfilePage } from "./components/ProfilePage";
import { UserSearch } from "./components/UserSearch";
import { UsernameModal } from "./components/UsernameModal";

// Hooks & Utils
import { useWorkoutSession } from './hooks/useWorkoutSession';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { checkSetPR, type SetPR } from './utils/PRTracker';
import { calculate1RM, formatTime } from './utils/math';
import {
  loadWorkouts,
  loadSessionLogs,
  loadExerciseRecords,
  saveSessionLog,
  upsertExerciseRecord,
  deleteWorkout,
  saveWorkout,
  updateWorkout,
  shareSessionToFeed,
  getProfile
} from './lib/database';

// Data & Types
import { RAW_EXERCISES } from "./exercises-data";
import type { RawExercise } from "./exercises-data";
import { MUSCLE_GROUPS } from "./types.ts";
import type {
  Workout,
  WorkoutSessionLog,
  ExerciseRecord,
  Exercise,
  WorkoutExercise,
  ActiveSet,
  PersonalRecord,
  ExerciseSessionData,
  MuscleGroup
} from "./types.ts";

// Styles
import './index.css';
import './App.css';

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

export const ALL_EXERCISES: Exercise[] = RAW_EXERCISES.map((ex: RawExercise) => ({
  id: ex.id,
  name: ex.name,
  muscleGroup: mapPrimaryToMuscleGroup(ex.primaryMuscles),
  imageUrl: ex.images && ex.images.length > 0 ? `${GITHUB_IMAGE_BASE}${ex.images[0]}` : undefined,
  instructions: ex.instructions,
  equipment: ex.equipment,
  primaryMuscles: ex.primaryMuscles,
  secondaryMuscles: ex.secondaryMuscles,
}));

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
  const [historicalPRData, setHistoricalPRData] = useState<SetPR[]>([]);

  // Modals & UI State
  const [showExerciseSearchModal, setShowExerciseSearchModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlateCalcModal, setShowPlateCalcModal] = useState(false);
  const [plateCalcWeight] = useState(60);
  const [showWorkoutSettings, setShowWorkoutSettings] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPRNotification, setShowPRNotification] = useState(false);

  // Session Detail Modal State
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionLog | null>(null);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('feed'); // flood, search, workouts, profile

  // Onboarding
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(undefined); // For ProfilePage navigation

  // Superset UI State (local only)
  const [showSupersetOptions, setShowSupersetOptions] = useState(false);
  const [selectedForSuperset, setSelectedForSuperset] = useState<string | null>(null);

  // Active Workout State (Managed by Hook)
  const {
    mode,
    selectedWorkoutId,
    selectedExerciseId,
    workoutExercises,
    workoutExercisesData,
    activeSets,
    sessionStart,
    sessionNotes,
    isDeload,
    workoutStartTime,
    workoutElapsedSeconds,
    sessionPRs,

    // Setters
    setMode,
    setSelectedWorkoutId,
    setSelectedExerciseId,
    setWorkoutExercises,
    setActiveSets,
    setSessionStart,
    setSessionNotes,
    setIsDeload,
    setWorkoutStartTime,
    // setWorkoutElapsedSeconds,
    setWorkoutExercisesData,
    setSessionPRs,

    // Actions
    startWorkout,
    completeWorkout, // Resets state
    // selectExercise,
    saveExercise,
    removeExercise,
    moveExercise,
    toggleSuperset,
    addExercisesToWorkout,
    // applyTemplate, 
    // activeWorkoutId,
    workoutStarted,
    setWorkoutStarted,
    addSet,
  } = useWorkoutSession();

  // Workout Timer Hook
  const {
    customRestSeconds,
    setCustomRestSeconds,
    showRestTimer,
    startRestTimer,
    stopRestTimer,
    autoStartRest,
    setAutoStartRest,
    defaultRestTime,
    setDefaultRestTime
  } = useWorkoutTimer();

  // Advanced Features State (Toggles)
  const [showRPE, setShowRPE] = useState(false);
  const [show1RM, setShow1RM] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  // Summary State
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState(0);

  const [workoutCollapsed, setWorkoutCollapsed] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);

  // --- Effects ---

  // Auth & Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch((err) => {
      console.warn("Auth session check failed:", err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check Profile / Onboarding
  useEffect(() => {
    if (!user) return;
    checkProfile();
  }, [user]);

  const checkProfile = async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    if (!p || !p.username) {
      setShowUsernameModal(true);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const [loadedWorkouts, loadedLogs, loadedRecords] = await Promise.all([
          loadWorkouts(user.id),
          loadSessionLogs(user.id),
          loadExerciseRecords(user.id)
        ]);

        setWorkouts(loadedWorkouts);
        setSessionLogs(loadedLogs);
        setExerciseRecords(loadedRecords);

        // Process Historical PR Data from Logs
        const prData: SetPR[] = [];
        loadedLogs.forEach((log: WorkoutSessionLog) => {
          log.exercises.forEach((ex: ExerciseSessionData) => {
            ex.sets.forEach((set: ActiveSet) => {
              if (set.completed && set.weight && set.reps) {
                prData.push({
                  exerciseId: ex.exerciseId,
                  setNumber: set.setNumber,
                  weight: set.weight,
                  reps: set.reps,
                  date: log.endedAt || log.startedAt,
                });
              }
            });
          });
        });
        setHistoricalPRData(prData);

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

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
        workoutStarted
        // sessionPRs not saved to storage to avoid complexity on restore
      };
      localStorage.setItem('activeWorkout', JSON.stringify(workoutState));
    } else {
      localStorage.removeItem('activeWorkout');
    }
  }, [mode, selectedWorkoutId, selectedExerciseId, workoutExercises, workoutExercisesData,
    activeSets, sessionStart, sessionNotes, isDeload, workoutStartTime, workoutStarted]);

  // Restore workout state (simplistic version, can be improved by moving restore logic to hook)
  useEffect(() => {
    const savedState = localStorage.getItem('activeWorkout');
    if (savedState && user) {
      try {
        const state = JSON.parse(savedState);
        setMode('active');
        setSelectedWorkoutId(state.selectedWorkoutId);
        setSelectedExerciseId(state.selectedExerciseId);
        setWorkoutExercises(state.workoutExercises || []);
        setWorkoutExercisesData(state.workoutExercisesData || {});
        setActiveSets(state.activeSets || []);
        setSessionStart(state.sessionStart);
        setSessionNotes(state.sessionNotes || '');
        setIsDeload(state.isDeload || false);
        setWorkoutStartTime(state.workoutStartTime);
        setWorkoutStarted(state.workoutStarted || false);
      } catch (err) {
        console.error('Error restoring workout state:', err);
      }
    }
  }, [user]);

  // Save/Load Settings
  useEffect(() => {
    const settings = { showRPE, show1RM, showPlateCalculator, autoStartRest, customRestSeconds, defaultRestTime, showAdvancedFeatures };
    localStorage.setItem('workoutSettings', JSON.stringify(settings));
  }, [showRPE, show1RM, showPlateCalculator, autoStartRest, customRestSeconds, defaultRestTime, showAdvancedFeatures]);

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
        if (settings.defaultRestTime !== undefined) setDefaultRestTime(settings.defaultRestTime);
        if (settings.showAdvancedFeatures !== undefined) setShowAdvancedFeatures(settings.showAdvancedFeatures);
      } catch (err) { }
    }
  }, []);

  // --- Handlers ---

  const handleStartWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    setSessionPRs([]);

    // Find last session for default values
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

    const workoutToStart = { ...workout, exercises };
    startWorkout(workoutToStart);
    setWorkoutStarted(false); // Override to allow preview
    setMode("active");
    setShowSummary(false);
    setCurrentPage('dashboard');
  };

  const handleQuickCreateWorkout = async () => {
    if (!user) return;
    try {
      const created = await saveWorkout({
        name: `Workout ${workouts.length + 1}`,
        description: 'New workout plan',
        exercises: [],
        userId: user.id
      }, user.id);

      setWorkouts(prev => [created, ...prev]);
      handleStartWorkout(created.id);
    } catch (err) {
      console.error("Error creating workout:", err);
    }
  };

  const handleApplyTemplate = (template: WorkoutTemplate | null) => {
    if (!template) {
      // Quick Start Logic
      const quickWorkout: Workout = {
        id: `quick-${Date.now()}`,
        name: "Quick Start Session",
        description: "Freestyle workout",
        exerciseCount: 0,
        exercises: [],
        userId: user?.id || 'temp',
        createdAt: new Date().toISOString(),
      };
      startWorkout(quickWorkout);
      setMode("active");
      setShowTemplateModal(false);
      return;
    }

    const templateExercises = template.exercises
      .map(te => {
        const exercise = ALL_EXERCISES.find(ex =>
          ex.name.toLowerCase().includes(te.exerciseName.toLowerCase()) ||
          te.exerciseName.toLowerCase().includes(ex.name.toLowerCase())
        );
        if (exercise) {
          return {
            id: exercise.id,
            exerciseId: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            imageUrl: exercise.imageUrl,
            targetSets: te.sets,
            targetReps: te.repsRange,
            notes: te.notes || '',
          } as WorkoutExercise;
        }
        return null;
      })
      .filter(Boolean) as WorkoutExercise[];

    addExercisesToWorkout(templateExercises);
    alert(`✅ Added ${templateExercises.length} exercises from "${template.name}"`);
    setShowTemplateModal(false);
  };

  const handleSaveExercise = async () => {
    if (!selectedExerciseId) return;

    const exercise = workoutExercises.find(ex => ex.id === selectedExerciseId);
    if (!exercise) return;

    const volume = activeSets.reduce((sum, set) => {
      if (set.weight && set.reps && set.completed) return sum + set.weight * set.reps;
      return sum;
    }, 0);

    // Save to local Hook state
    saveExercise(selectedExerciseId, {
      exerciseId: selectedExerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      note: exercise.note,
      sets: activeSets,
      volume,
    });

    // Check PRs - Update Record in DB
    if (user) {
      // Calculate max stats for this session
      let maxVolume = 0;
      let bestSet = { weight: 0, reps: 0 };
      let max1RM = 0;

      for (const set of activeSets) {
        if (set.weight && set.reps && set.completed) {
          const vol = set.weight * set.reps;
          const est1RM = calculate1RM(set.weight, set.reps, set.rpe);

          if (vol > maxVolume) {
            maxVolume = vol;
            bestSet = { weight: set.weight, reps: set.reps };
          }
          if (est1RM > max1RM) max1RM = est1RM;
        }
      }

      const currentRecord = exerciseRecords[selectedExerciseId];
      const newPRs: PersonalRecord[] = [];
      const date = new Date().toISOString();

      if (!currentRecord || maxVolume > currentRecord.bestVolume) {
        newPRs.push({ exerciseId: selectedExerciseId, exerciseName: exercise.name, type: 'volume', oldValue: currentRecord?.bestVolume || 0, newValue: maxVolume, achievedAt: date });
      }
      if (!currentRecord || max1RM > currentRecord.estimated1RM) {
        newPRs.push({ exerciseId: selectedExerciseId, exerciseName: exercise.name, type: '1RM', oldValue: currentRecord?.estimated1RM || 0, newValue: max1RM, achievedAt: date });
      }

      if (newPRs.length > 0) {
        setSessionPRs(prev => [...prev, ...newPRs]);
        setShowPRNotification(true);
        setTimeout(() => setShowPRNotification(false), 5000);
      }

      // Update Record if improved
      if (!currentRecord || maxVolume > currentRecord.bestVolume || max1RM > currentRecord.estimated1RM) {
        const newRecord: ExerciseRecord = {
          exerciseId: selectedExerciseId,
          exerciseName: exercise.name,
          bestVolume: Math.max(currentRecord?.bestVolume || 0, maxVolume),
          bestSet: (!currentRecord || maxVolume > currentRecord.bestVolume) ? { ...bestSet, date } : currentRecord.bestSet,
          estimated1RM: Math.max(currentRecord?.estimated1RM || 0, max1RM),
        };
        setExerciseRecords(prev => ({ ...prev, [selectedExerciseId]: newRecord }));
        upsertExerciseRecord(newRecord, user.id).catch(console.error);
      }
    }

    setSelectedExerciseId(null);
  };

  const handleCompleteWorkoutSession = async () => {
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


    setSessionLogs(prev => [log, ...prev]);

    try {
      await saveSessionLog(log, user.id);

      // Update workout "last performed"
      await updateWorkout(workout.id, {
        lastPerformed: end,
        exercises: workoutExercises,
        exerciseCount: workoutExercises.length,
      });

      setWorkouts(prev =>
        prev.map(w =>
          w.id === workout.id ? { ...w, lastPerformed: end, exercises: workoutExercises, exerciseCount: workoutExercises.length } : w
        )
      );

      // Share to Feed Prompt (Simplistic: Auto-share or Ask? User said "Button Share to Feed", implying manual action AFTER completion or IN summary)
      // The user requirement: "Nach Workout Complete: Button „Share to Feed" (calls shareSession(sessionId))."
      // So I should render a button in the Summary view (which I haven't modified yet).
      // I'll keep the save logic as is here. I will modify the Summary view in the render section.

    } catch (err) {
      console.error("Error saving workout session:", err);
    }

    setWorkoutDuration(durationSeconds); // Local state for Summary
    setTotalVolume(totalVol);
    setTotalSetsCompleted(totalSets);
    setShowSummary(true);
    setSelectedSession(log); // Set selected session so we can pass ID to share button if needed
  };

  const finishSession = () => {
    completeWorkout(); // Hook reset
    setMode("overview");
    setShowSummary(false);
    localStorage.removeItem('activeWorkout');
  };

  const handleReturnToDashboard = () => {
    if (mode === 'active') {
      setShowDiscardConfirm(true);
    } else {
      setMode('overview');
    }
  };

  const confirmDiscard = () => {
    completeWorkout(); // Hook reset
    setShowDiscardConfirm(false);
    setMode('overview');
    localStorage.removeItem('activeWorkout');
  };

  // Get Exercise History
  const getExerciseHistory = (exerciseId: string) => {
    return sessionLogs
      .filter(log => log.exercises.some(ex => ex.exerciseId === exerciseId))
      .map(log => ({
        date: log.startedAt,
        sets: log.exercises.find(ex => ex.exerciseId === exerciseId)?.sets || [],
        volume: log.exercises.find(ex => ex.exerciseId === exerciseId)?.volume || 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  if (authLoading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
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

      {showPRNotification && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
          <div className="font-bold text-lg flex items-center gap-2">🎉 NEW PR!</div>
          <div className="text-sm mt-1">
            {sessionPRs.length > 0 && `${sessionPRs[sessionPRs.length - 1].exerciseName} - ${sessionPRs[sessionPRs.length - 1].type.toUpperCase()}`}
          </div>
        </div>
      )}

      <div className="px-6 pt-6">
        {/* MINI WORKOUT BAR */}
        {mode === 'active' && selectedWorkoutId && (
          <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-black/98 border-b border-slate-800 z-40 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setWorkoutCollapsed(!workoutCollapsed)} className="text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800/50">
                    {workoutCollapsed ? '▼' : '▲'}
                  </button>
                  <div>
                    <div className="text-base font-bold text-white truncate max-w-[200px]">
                      {workouts.find(w => w.id === selectedWorkoutId)?.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {workoutExercises.length} exercises • {Object.keys(workoutExercisesData).length} completed
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!workoutStarted ? (
                    <button
                      onClick={() => { setWorkoutStarted(true); if (!workoutStartTime) setWorkoutStartTime(Date.now()); }}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm"
                    >
                      START
                    </button>
                  ) : (
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      {formatTime(workoutElapsedSeconds)}
                    </div>
                  )}

                  <button onClick={() => setShowWorkoutSettings(true)} className="p-1.5 text-slate-400 hover:text-white" title="Settings">⚙️</button>
                  <button onClick={handleCompleteWorkoutSession} disabled={Object.keys(workoutExercisesData).length === 0} className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold rounded-lg text-sm disabled:opacity-50">Finish</button>
                  <button onClick={handleReturnToDashboard} className="p-1.5 text-red-400 hover:text-red-300" title="Discard">✕</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGES */}

        {/* FEED */}
        {currentPage === 'feed' && mode === 'overview' && (
          <FeedPage />
        )}

        {/* SEARCH */}
        {currentPage === 'search' && mode === 'overview' && (
          <UserSearch onSelectUser={(uid) => {
            setViewingUserId(uid);
            setCurrentPage('profile');
          }} />
        )}

        {/* WORKOUTS (Replaced Dashboard/Exercises split) */}
        {currentPage === 'dashboard' && mode === "overview" && (
          <WorkoutsPage
            workouts={workouts}
            onStart={handleStartWorkout}
            onEdit={(id) => {
              const w = workouts.find(w => w.id === id);
              if (w) { setEditingWorkoutId(id); setEditName(w.name); setEditDescription(w.description || ""); }
            }}
            onDelete={(id) => {
              setWorkouts(prev => prev.filter(w => w.id !== id));
              deleteWorkout(id).catch(console.error);
            }}
            onReorder={(from, to) => {
              setWorkouts(prev => {
                const c = [...prev];
                const [m] = c.splice(from, 1);
                c.splice(to, 0, m);
                return c;
              });
            }}
            onQuickCreate={handleQuickCreateWorkout}
          />
        )}

        {/* PROFILE */}
        {currentPage === 'profile' && (
          <ProfilePage userId={viewingUserId} />
        )}

        {/* USERNAME MODAL */}
        {showUsernameModal && user && (
          <UsernameModal userId={user.id} onComplete={() => setShowUsernameModal(false)} />
        )}

        {/* ACTIVE WORKOUT VIEW */}
        {mode === "active" && selectedWorkoutId && !workoutCollapsed && (
          <>
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 mt-16">
              {/* Header Info */}
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold">{workouts.find(w => w.id === selectedWorkoutId)?.name}</h1>
              </div>
              {sessionPRs.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-900/50 rounded-lg">
                  <div className="font-bold text-amber-400 text-sm mb-1">🎉 Personal Records This Session:</div>
                  <div className="text-xs text-slate-300 space-y-1">
                    {sessionPRs.map((pr, i) => <div key={i}>{pr.exerciseName} - {pr.type.toUpperCase()}: {pr.newValue}</div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Exercise List */}
            {!selectedExerciseId && (
              <div className="max-w-4xl mx-auto space-y-3 mb-8">
                {workoutExercises.map((ex, index) => {
                  const isCompleted = !!workoutExercisesData[ex.id];
                  return (
                    <div key={ex.id} className="relative">
                      {ex.supersetGroup && <div className="absolute -left-3 top-0 bottom-0 w-1 bg-purple-500 rounded-full" />}
                      <div draggable onDragStart={() => setDraggedExerciseIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedExerciseIndex !== null) { moveExercise(draggedExerciseIndex, index); setDraggedExerciseIndex(null); } }} className="group cursor-move">
                        <button onClick={() => { setSelectedExerciseId(ex.id); if (workoutExercisesData[ex.id]) setActiveSets(workoutExercisesData[ex.id].sets); else setActiveSets([{ setNumber: 1, weight: null, reps: null, rpe: null, completed: false }]); }}
                          className={`w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4 ${isCompleted ? "bg-emerald-950/20 border-emerald-500/50" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}
                        >
                          {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} className="w-16 h-16 object-cover rounded-lg" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{ex.name}</h3>
                            <p className="text-xs text-slate-500 uppercase">{ex.muscleGroup}</p>
                            {isCompleted && <p className="text-xs text-emerald-400 mt-1">{workoutExercisesData[ex.id].sets.filter((s: ActiveSet) => s.completed).length} sets · {workoutExercisesData[ex.id].volume} kg</p>}
                          </div>
                          {isCompleted ? <span className="text-emerald-400 text-2xl font-bold">✓</span> : <span className="text-slate-600 text-xl font-bold">○</span>}
                        </button>
                        {/* Actions Line */}
                        <div className="ml-4 mt-2 flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setHistoryExerciseId(ex.id); setShowExerciseHistory(true); }} className="text-xs text-blue-400 hover:text-blue-300">📊 History</button>
                          <button onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                        {/* Superset Config (Local UI logic for linking) */}
                        {showSupersetOptions && (
                          <div className="mt-2">
                            {!ex.supersetWith ? (
                              selectedForSuperset === ex.id ?
                                <button onClick={() => setSelectedForSuperset(null)} className="w-full py-2 bg-purple-600 text-white rounded-lg">✓ Selected</button> :
                                selectedForSuperset ?
                                  <button onClick={() => { toggleSuperset(selectedForSuperset, ex.id); setSelectedForSuperset(null); }} className="w-full py-2 bg-purple-500 text-white rounded-lg">🔗 Link</button> :
                                  <button onClick={() => setSelectedForSuperset(ex.id)} className="w-full py-2 border-2 border-dashed border-purple-500 text-purple-400 rounded-lg">Select for Superset</button>
                            ) : (
                              <div className="mt-2 flex gap-2">
                                <div className="flex-1 py-2 px-3 bg-purple-900/10 rounded-lg text-sm">🔗 Superset with {workoutExercises.find(e => e.id === ex.supersetWith)?.name}</div>
                                <button onClick={() => toggleSuperset(ex.id, ex.supersetWith as string)} className="py-2 px-3 bg-red-600 text-white rounded-lg text-sm">Remove</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => setShowTemplateModal(true)} className="py-4 rounded-lg border-2 border-dashed border-blue-700 text-blue-400 flex items-center justify-center gap-2"><span>📋</span> Use Template</button>
                  <button onClick={() => setShowExerciseSearchModal(true)} className="py-4 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 flex items-center justify-center gap-2"><span>+</span> Add Exercise</button>
                </div>
              </div>
            )}

            {/* ACTIVE CARD */}
            {selectedExerciseId && (
              <div className="max-w-4xl mx-auto">
                {(() => {
                  const currentEx = workoutExercises.find(ex => ex.id === selectedExerciseId);
                  if (!currentEx) return null;
                  const partnerName = currentEx.supersetWith ? workoutExercises.find(e => e.id === currentEx.supersetWith)?.name : undefined;
                  return (
                    <ActiveWorkoutCard
                      exerciseId={selectedExerciseId}
                      exerciseName={currentEx.name}
                      muscleGroup={currentEx.muscleGroup}
                      sets={activeSets}
                      note={currentEx.note}
                      onSetChange={(index, field, value) => {
                        // Local update for UI responsiveness
                        setActiveSets(prev => {
                          const next = prev.map((s, i) => i === index ? { ...s, [field]: value } : s);
                          // Auto-start rest logic
                          if (field === 'completed' && value === true) {
                            if (autoStartRest) startRestTimer(customRestSeconds || defaultRestTime);
                            // PR Check
                            const s = next[index];
                            if (s && s.weight != null && s.reps != null) {
                              const pr = checkSetPR(selectedExerciseId, s.setNumber, s.weight, s.reps, historicalPRData);
                              if (pr.isPR) {
                                next[index] = { ...next[index], isPR: true, prType: pr.improvement || 'both' };
                                alert(`🔥 NEW PR! Set ${s.setNumber}: ${s.weight}kg × ${s.reps} reps`);
                              }
                            }
                          }
                          return next;
                        });
                      }}
                      onAddSet={() => addSet(selectedExerciseId)}
                      onStartRest={startRestTimer}
                      onNoteChange={(note) => setWorkoutExercises(prev => prev.map(ex => ex.id === selectedExerciseId ? { ...ex, note } : ex))}
                      isDeload={isDeload}
                      showRPE={showRPE}
                      show1RM={show1RM}
                      showPlateCalculator={showPlateCalculator}
                      allExercises={ALL_EXERCISES}
                      isSupersetWith={partnerName}
                      onToggleSuperset={() => { if (currentEx.supersetWith) toggleSuperset(currentEx.id, currentEx.supersetWith); }}
                      onOpenHistory={() => { setHistoryExerciseId(selectedExerciseId); setShowExerciseHistory(true); }}
                    />
                  );
                })()}
                <div className="max-w-4xl mx-auto mt-4 flex gap-3">
                  <button onClick={() => setSelectedExerciseId(null)} className="flex-1 py-3 rounded-lg bg-slate-800 text-white font-medium">Cancel</button>
                  <button onClick={handleSaveExercise} className="flex-1 py-3 rounded-lg bg-emerald-500 text-black font-medium">Save & Continue</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODALS */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
              <h2 className="text-xl font-bold mb-4">End Workout?</h2>
              <p className="text-slate-400 mb-6">Progress will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 py-3 rounded-lg bg-slate-800">Cancel</button>
                <button onClick={confirmDiscard} className="flex-1 py-3 rounded-lg bg-red-500 text-white">End</button>
              </div>
            </div>
          </div>
        )}

        {showSummary && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
            <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Workout Complete!</h2>
              <p className="text-muted-foreground mb-6">{formatTime(workoutDuration || 0)} • {totalVolume} kg • {totalSetsCompleted} sets</p>

              {selectedSession && (
                <button
                  onClick={async () => {
                    await shareSessionToFeed(selectedSession.id);
                    alert("Shared to Feed!");
                  }}
                  className="w-full py-3 mb-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
                >
                  Post to Feed 🌍
                </button>
              )}

              <button onClick={finishSession} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
                Back to Home
              </button>
            </div>
          </div>
        )}

        {
          editingWorkoutId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Edit Workout</h2>
                <div className="space-y-4">
                  <div><label className="text-xs text-slate-400">Name</label><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2" /></div>
                  <div><label className="text-xs text-slate-400">Description</label><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditingWorkoutId(null)} className="px-4 py-2 text-slate-400">Cancel</button>
                  <button onClick={async () => {
                    if (editingWorkoutId && editName.trim()) {
                      setWorkouts(prev => prev.map(w => w.id === editingWorkoutId ? { ...w, name: editName, description: editDescription } : w));
                      try {
                        await updateWorkout(editingWorkoutId, { name: editName, description: editDescription });
                      } catch (e) { console.error(e); }
                    }
                    setEditingWorkoutId(null);
                  }} className="flex-1 py-2 bg-emerald-500 text-black rounded">Save</button>
                </div>
              </div>
            </div>
          )
        }

        {
          showWorkoutSettings && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowWorkoutSettings(false)}>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">Workout Settings</h2>
                <div className="mb-6">
                  <button onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)} className="w-full flex justify-between p-4 bg-slate-800 rounded-lg">
                    <span className="font-bold">Advanced Features</span>
                    <span>{showAdvancedFeatures ? '▼' : '▶'}</span>
                  </button>
                  {showAdvancedFeatures && (
                    <div className="mt-3 space-y-3 p-4 border border-slate-700 rounded-lg">
                      <div className="flex justify-between"><span className="font-medium">🔥 Deload Week</span><input type="checkbox" checked={isDeload} onChange={(e) => setIsDeload(e.target.checked)} className="accent-emerald-500" /></div>
                      <div className="flex justify-between"><span className="font-medium">Show RPE</span><input type="checkbox" checked={showRPE} onChange={(e) => setShowRPE(e.target.checked)} className="accent-emerald-500" /></div>
                      <div className="flex justify-between"><span className="font-medium">Show 1RM</span><input type="checkbox" checked={show1RM} onChange={(e) => setShow1RM(e.target.checked)} className="accent-emerald-500" /></div>
                      <div className="flex justify-between"><span className="font-medium">Show Plate Calc</span><input type="checkbox" checked={showPlateCalculator} onChange={(e) => setShowPlateCalculator(e.target.checked)} className="accent-emerald-500" /></div>
                      <div className="flex justify-between"><span className="font-medium">Superset Mode</span><input type="checkbox" checked={showSupersetOptions} onChange={(e) => setShowSupersetOptions(e.target.checked)} className="accent-emerald-500" /></div>
                      <ThemeToggle />
                    </div>
                  )}
                </div>
                <button onClick={() => { setCustomRestSeconds(defaultRestTime); setShowWorkoutSettings(false); }} className="w-full py-3 bg-slate-800 rounded-lg">Done</button>
              </div>
            </div>
          )
        }

        {selectedSession && <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
        {selectedExerciseDetail && <ExerciseDetailModal exercise={selectedExerciseDetail} onClose={() => setSelectedExerciseDetail(null)} />}
        {
          showExerciseSearchModal && <ExerciseSearchModal isOpen={showExerciseSearchModal} onClose={() => setShowExerciseSearchModal(false)} onSelectExercise={(id) => {
            const ex = ALL_EXERCISES.find(e => e.id === id);
            if (ex) {
              addExercisesToWorkout([{ id: ex.id, exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, imageUrl: ex.imageUrl, note: ex.note }]);
              setShowExerciseSearchModal(false);
            }
          }} allExercises={ALL_EXERCISES} muscleGroups={Array.from(MUSCLE_GROUPS)} />
        }

        {showRestTimer && <RestTimer initialSeconds={customRestSeconds} onDismiss={stopRestTimer} autoStart={true} />}

        {
          showExerciseHistory && historyExerciseId && (
            <HistoryModal
              isOpen={showExerciseHistory}
              onClose={() => setShowExerciseHistory(false)}
              exerciseName={ALL_EXERCISES.find(ex => ex.id === historyExerciseId)?.name || "Exercise"}
              history={getExerciseHistory(historyExerciseId)}
            />
          )
        }

        {showPlateCalcModal && <PlateCalculatorModal isOpen={showPlateCalcModal} onClose={() => setShowPlateCalcModal(false)} initialWeight={plateCalcWeight} />}
        <WorkoutTemplateModal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} onSelectTemplate={handleApplyTemplate} />



        <BottomNav
          currentPage={currentPage}
          onNavigate={(p) => {
            if (p === 'profile') setViewingUserId(undefined); // Reset to own profile
            setCurrentPage(p);
          }}
        />
      </div>
      );
}

      export default App;

