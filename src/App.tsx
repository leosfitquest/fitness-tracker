import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';

// Components
import { WorkoutsPage } from "./components/WorkoutsPage";
// import { DashboardPage } from "./components/DashboardPage"; // Deprecated
// import { AccountPage } from "./components/AccountPage"; // Replaced by ProfilePage
import { ExerciseSearchModal } from "./components/ExerciseSearchModal";
import { SessionDetailModal } from "./components/SessionDetailModal";
import { BottomNav } from "./components/BottomNav";
import { WorkoutTemplateModal } from './components/WorkoutTemplateModal';
import { type WorkoutTemplate } from './data/workoutTemplates';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { ThemeToggle } from './contexts/ThemeToggle';
import { ActiveWorkoutOverlay } from "./components/ActiveWorkoutOverlay";

// Social Components
import { FeedPage } from "./components/FeedPage";
import { ProfilePage } from "./components/ProfilePage";
import { UserSearch } from "./components/UserSearch";
import { UsernameModal } from "./components/UsernameModal";
import { NotificationsPage } from "./components/NotificationsPage";

// Hooks & Utils
import { useWorkoutSession } from './hooks/useWorkoutSession';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { type SetPR } from './utils/PRTracker';
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
  // Session Detail Modal State
  const [showSummary, setShowSummary] = useState(false);
  const [showPRNotification, setShowPRNotification] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionLog | null>(null);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('feed'); // flood, search, workouts, profile

  // Onboarding
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(undefined); // For ProfilePage navigation

  // Superset UI State (local only)

  const [showSupersetOptions, setShowSupersetOptions] = useState(false);


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
    // toggleSuperset,
    addExercisesToWorkout,
    // applyTemplate, 
    // activeWorkoutId,
    workoutStarted,
    setWorkoutStarted,
    // addSet,
  } = useWorkoutSession();

  // Workout Timer Hook
  const {
    customRestSeconds,
    setCustomRestSeconds,
    // showRestTimer,
    // startRestTimer,
    // stopRestTimer,
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

  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
        if (state && typeof state === 'object') {
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
        }
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
        if (settings && typeof settings === 'object') {
          if (settings.showRPE !== undefined) setShowRPE(settings.showRPE);
          if (settings.show1RM !== undefined) setShow1RM(settings.show1RM);
          if (settings.showPlateCalculator !== undefined) setShowPlateCalculator(settings.showPlateCalculator);
          if (settings.autoStartRest !== undefined) setAutoStartRest(settings.autoStartRest);
          if (settings.customRestSeconds !== undefined) setCustomRestSeconds(settings.customRestSeconds);
          if (settings.defaultRestTime !== undefined) setDefaultRestTime(settings.defaultRestTime);
          if (settings.showAdvancedFeatures !== undefined) setShowAdvancedFeatures(settings.showAdvancedFeatures);
        }
      } catch (err) { }
    }
  }, []);

  // --- Handlers ---

  const handleStartWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    setSessionPRs([]);

    setSessionPRs([]);

    // We use the workout template exercises directly.
    // Future improvement: Use last session data to pre-fill weights/reps logic.

    let exercises = workout.exercises;

    // Optional: We could use lastSession to pre-fill weights, but for now 
    // let's ensure the STRUCTURE is correct by using the template.
    if (!exercises || exercises.length === 0) {
      console.warn("Starting workout with no exercises. Workout:", workout);
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

  const confirmDiscard = () => {
    completeWorkout(); // Hook reset
    setShowDiscardConfirm(false);
    setMode('overview');
    localStorage.removeItem('activeWorkout');
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


        {/* PAGES */}

        {/* FEED */}
        {currentPage === 'feed' && (
          <FeedPage onNavigate={setCurrentPage} />
        )}

        {/* SEARCH */}
        {currentPage === 'search' && (
          <UserSearch onSelectUser={(uid) => {
            setViewingUserId(uid);
            setCurrentPage('profile');
          }} />
        )}

        {/* NOTIFICATIONS */}
        {currentPage === 'notifications' && (
          <NotificationsPage />
        )}

        {/* WORKOUTS (Replaced Dashboard/Exercises split) */}
        {currentPage === 'dashboard' && (
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
          <ProfilePage
            userId={viewingUserId}
            onSelectUser={(uid) => {
              setViewingUserId(uid);
              // Already on profile page, but this ensures we reload data for new user
            }}
          />
        )}

        {/* USERNAME MODAL */}
        {showUsernameModal && user && (
          <UsernameModal userId={user.id} onComplete={() => setShowUsernameModal(false)} />
        )}


        {/* ACTIVE WORKOUT OVERLAY */}
        {mode === "active" && selectedWorkoutId && (
          <ActiveWorkoutOverlay
            workout={workouts.find(w => w.id === selectedWorkoutId)!}
            workoutExercises={workoutExercises}
            workoutExercisesData={workoutExercisesData}
            activeSets={activeSets}
            workoutStartTime={workoutStartTime}
            workoutElapsedSeconds={workoutElapsedSeconds}
            workoutStarted={workoutStarted}
            onSetWorkoutStarted={setWorkoutStarted}
            onSetWorkoutStartTime={setWorkoutStartTime}
            onCompleteWorkout={handleCompleteWorkoutSession}
            onDiscardWorkout={() => setShowDiscardConfirm(true)}

            onSetChange={(_, sets) => setActiveSets(sets)}
            onRemoveExercise={removeExercise}
            onMoveExercise={moveExercise}
            onSaveExercise={handleSaveExercise}
            selectedExerciseId={selectedExerciseId}
            isDeload={isDeload}
            allExercises={ALL_EXERCISES}
            historicalPRData={historicalPRData}
            onSelectExercise={setSelectedExerciseId}
            showRPE={showRPE}
            show1RM={show1RM}
            showPlateCalculator={showPlateCalculator}
          />
        )}



        {/* MODALS */}
        {
          showDiscardConfirm && (
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
          )
        }

        {
          showSummary && (
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
          )
        }

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


        {
          showExerciseSearchModal && <ExerciseSearchModal isOpen={showExerciseSearchModal} onClose={() => setShowExerciseSearchModal(false)} onSelectExercise={(id) => {
            const ex = ALL_EXERCISES.find(e => e.id === id);
            if (ex) {
              addExercisesToWorkout([{ id: ex.id, exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, imageUrl: ex.imageUrl, note: ex.note }]);
              setShowExerciseSearchModal(false);
            }
          }} allExercises={ALL_EXERCISES} muscleGroups={Array.from(MUSCLE_GROUPS)} />
        }

        {/* {showRestTimer && <RestTimer initialSeconds={customRestSeconds} onDismiss={stopRestTimer} autoStart={true} />} */}



        {showPlateCalcModal && <PlateCalculatorModal isOpen={showPlateCalcModal} onClose={() => setShowPlateCalcModal(false)} initialWeight={plateCalcWeight} />}
        <WorkoutTemplateModal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} onSelectTemplate={handleApplyTemplate} />



        <BottomNav
          currentPage={currentPage}
          onNavigate={(p) => {
            if (p === 'profile') setViewingUserId(undefined); // Reset to own profile
            setCurrentPage(p);
          }}
        />
      </div >
    </div >
  );
}

export default App;

