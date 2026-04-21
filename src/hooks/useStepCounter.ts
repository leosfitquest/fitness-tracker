import { useState, useEffect, useRef, useCallback } from 'react';
import { saveDailySteps, loadDailySteps } from '../lib/cycleAndStepsDb';
import { useToast } from '../components/Toast';

type StepCounterState = {
  steps: number;
  goal: number;
  isActive: boolean;
  isSupported: boolean;
  permissionGranted: boolean | null;
  source: 'accelerometer' | 'manual' | 'run_estimated';
};

const STEP_PERSIST_KEY = 'step_counter_active';
const STEP_MIN_INTERVAL_MS = 300; // Minimum ms between steps (prevents double-counting)
const STEP_MAGNITUDE_THRESHOLD = 1.6; // Acceleration magnitude threshold
const STEP_COOL_DOWN_FRAMES = 3; // Skip N frames after detecting a step

export function useStepCounter(userId: string) {
  const { showToast } = useToast();
  const [state, setState] = useState<StepCounterState>({
    steps: 0,
    goal: 10000,
    isActive: false,
    isSupported: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
    permissionGranted: null,
    source: 'accelerometer'
  });

  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const lastStepTimeRef = useRef(0);
  const lastMagnitudeRef = useRef(0);
  const cooldownRef = useRef(0);
  const stepsAccumulator = useRef(0);
  const dbSyncTimer = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Load steps on mount + restore active state
  useEffect(() => {
    if (!userId) return;

    loadDailySteps(userId, todayDate).then(data => {
      if (data) {
        setState(s => ({ ...s, steps: data.steps, goal: data.goal, source: data.source }));
        stepsAccumulator.current = data.steps;
      }
    });

    // Restore active state
    const wasActive = localStorage.getItem(STEP_PERSIST_KEY);
    if (wasActive === 'true') {
      // Will auto-start after permissions check
      setState(s => ({ ...s, isActive: false })); // Will be started in effect below
      requestPermission().then(granted => {
        if (granted) {
          startCountingInternal();
        }
      });
    }
  }, [userId, todayDate]);

  // Sync to database periodically
  useEffect(() => {
    if (state.steps > 0 && state.steps !== stepsAccumulator.current) {
      if (dbSyncTimer.current) window.clearTimeout(dbSyncTimer.current);

      dbSyncTimer.current = window.setTimeout(() => {
        saveDailySteps(userId, {
          date: todayDate,
          steps: state.steps,
          goal: state.goal,
          source: state.source
        });
        stepsAccumulator.current = state.steps;
      }, 3000); // Sync every 3 seconds max
    }
    return () => {
      if (dbSyncTimer.current) window.clearTimeout(dbSyncTimer.current);
    };
  }, [state.steps, state.goal, state.source, userId, todayDate]);

  // Sync on visibility change (user switches tab/app)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && state.steps > 0) {
        saveDailySteps(userId, {
          date: todayDate,
          steps: state.steps,
          goal: state.goal,
          source: state.source,
        }).catch(() => {});
        stepsAccumulator.current = state.steps;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state.steps, state.goal, state.source, userId, todayDate]);

  // Sync on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (state.steps > 0) {
        // Use sendBeacon for reliability
        const data = JSON.stringify({
          date: todayDate,
          steps: state.steps,
          goal: state.goal,
          source: state.source,
        });
        localStorage.setItem('step_pending_sync', data);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [state.steps, state.goal, state.source, todayDate]);

  // Check XP Rewards
  useEffect(() => {
    if (state.steps >= 5000) {
      const key5k = `step_xp_${todayDate}_5k`;
      if (!localStorage.getItem(key5k)) {
        localStorage.setItem(key5k, 'true');
        import('../lib/database').then(async ({ getProfile, updateProfile }) => {
          const profile = await getProfile(userId);
          if (profile) {
            await updateProfile(userId, { xp: (profile.xp || 0) + 50 });
            showToast('🏆 5k Steps reached! +50 XP awarded!', 'success');
          }
        });
      }
    }

    if (state.steps >= 10000) {
      const key10k = `step_xp_${todayDate}_10k`;
      if (!localStorage.getItem(key10k)) {
        localStorage.setItem(key10k, 'true');
        import('../lib/database').then(async ({ getProfile, updateProfile }) => {
          const profile = await getProfile(userId);
          if (profile) {
            await updateProfile(userId, { xp: (profile.xp || 0) + 150 });
            showToast('🏆 10k Steps reached! +150 XP awarded!', 'success');
          }
        });
      }
    }
  }, [state.steps, todayDate, userId, showToast]);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setState(s => ({ ...s, isSupported: false }));
      return false;
    }

    const DME = window.DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      try {
        const permission = await DME.requestPermission();
        if (permission === 'granted') {
          setState(s => ({ ...s, permissionGranted: true }));
          return true;
        }
      } catch (e) {
        console.error("DeviceMotion permission error:", e);
      }
      setState(s => ({ ...s, permissionGranted: false }));
      return false;
    } else {
      // Non-iOS 13+ devices don't need permission request
      setState(s => ({ ...s, permissionGranted: true }));
      return true;
    }
  };

  // Acquire Wake Lock to prevent screen from sleeping
  const acquireWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          console.log('[StepCounter] Wake Lock released');
        });
        console.log('[StepCounter] Wake Lock acquired');
      } catch (err) {
        console.warn('[StepCounter] Wake Lock failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && state.isActive) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state.isActive]);

  const startCountingInternal = useCallback(() => {
    setState(s => ({ ...s, isActive: true, source: 'accelerometer' }));
    localStorage.setItem(STEP_PERSIST_KEY, 'true');
    acquireWakeLock();

    // Remove old listener if exists
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

      const now = Date.now();

      // Cooldown period
      if (cooldownRef.current > 0) {
        cooldownRef.current--;
        return;
      }

      // Calculate magnitude of acceleration change
      const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);

      // Detect step: magnitude crosses threshold + debounce + direction change
      const delta = Math.abs(magnitude - lastMagnitudeRef.current);
      const timeSinceLastStep = now - lastStepTimeRef.current;

      if (
        delta > STEP_MAGNITUDE_THRESHOLD &&
        timeSinceLastStep > STEP_MIN_INTERVAL_MS
      ) {
        lastStepTimeRef.current = now;
        cooldownRef.current = STEP_COOL_DOWN_FRAMES;
        setState(prev => ({ ...prev, steps: prev.steps + 1 }));
      }

      lastMagnitudeRef.current = magnitude;
    };

    motionHandlerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion);
  }, []);

  const startCounting = async () => {
    if (state.permissionGranted === null) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    startCountingInternal();
  };

  const stopCounting = () => {
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    releaseWakeLock();
    setState(s => ({ ...s, isActive: false }));
    localStorage.setItem(STEP_PERSIST_KEY, 'false');

    // Final sync
    saveDailySteps(userId, {
      date: todayDate,
      steps: state.steps,
      goal: state.goal,
      source: state.source,
    }).catch(() => {});
  };

  const addManualSteps = async (amount: number) => {
    const newSteps = state.steps + amount;
    setState(s => ({ ...s, steps: newSteps, source: 'manual' }));
    await saveDailySteps(userId, { date: todayDate, steps: newSteps, goal: state.goal, source: 'manual' });
    stepsAccumulator.current = newSteps;
  };

  const setGoal = (newGoal: number) => {
    setState(s => ({ ...s, goal: newGoal }));
  };

  return {
    ...state,
    startCounting,
    stopCounting,
    addManualSteps,
    requestPermission,
    setGoal,
  };
}
