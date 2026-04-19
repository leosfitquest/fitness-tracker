import { useState, useEffect, useRef } from 'react';
import { saveDailySteps, loadDailySteps } from '../lib/cycleAndStepsDb';

type StepCounterState = {
  steps: number;
  goal: number;
  isActive: boolean;
  isSupported: boolean;
  permissionGranted: boolean | null;
  source: 'accelerometer' | 'manual' | 'run_estimated';
};

export function useStepCounter(userId: string) {
  const [state, setState] = useState<StepCounterState>({
    steps: 0,
    goal: 10000,
    isActive: false,
    isSupported: typeof getDeviceMotionEvent !== 'undefined',
    permissionGranted: null,
    source: 'accelerometer'
  });

  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const lastAccelRef = useRef<{ x: number, y: number, z: number } | null>(null);
  const stepThreshold = 1.2; // Peak detection threshold
  const stepsAccumulator = useRef(0);
  const dbSyncTimer = useRef<number | null>(null);

  // Helper check for SSR safety
  function getDeviceMotionEvent() {
    return typeof window !== 'undefined' ? window.DeviceMotionEvent : undefined;
  }

  // Load steps on mount
  useEffect(() => {
    if (!userId) return;
    loadDailySteps(userId, todayDate).then(data => {
      if (data) {
        setState(s => ({ ...s, steps: data.steps, goal: data.goal, source: data.source }));
        stepsAccumulator.current = data.steps;
      }
    });
  }, [userId, todayDate]);

  // Sync to database periodically when active
  useEffect(() => {
    if (state.steps > 0 && Math.abs(state.steps - stepsAccumulator.current) > 10) {
      // Sync every 10 steps max to avoid spamming
      if (dbSyncTimer.current) window.clearTimeout(dbSyncTimer.current);
      
      dbSyncTimer.current = window.setTimeout(() => {
        saveDailySteps(userId, { date: todayDate, steps: state.steps, goal: state.goal, source: state.source });
        stepsAccumulator.current = state.steps;
      }, 5000);
    }
    return () => {
      if (dbSyncTimer.current) window.clearTimeout(dbSyncTimer.current);
    };
  }, [state.steps, state.goal, state.source, userId, todayDate]);

  const requestPermission = async () => {
    const DeviceMotionEvent = getDeviceMotionEvent();
    if (!DeviceMotionEvent) {
      setState(s => ({ ...s, isSupported: false }));
      return false;
    }

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
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

  const startCounting = async () => {
    if (state.permissionGranted === null) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setState(s => ({ ...s, isActive: true, source: 'accelerometer' }));

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel || accel.x === null || accel.y === null || accel.z === null) return;
      
      if (lastAccelRef.current) {
        const deltaX = Math.abs(accel.x - lastAccelRef.current.x);
        const deltaY = Math.abs(accel.y - lastAccelRef.current.y);
        const deltaZ = Math.abs(accel.z - lastAccelRef.current.z);
        
        // Simple peak detection
        const totalDelta = deltaX + deltaY + deltaZ;
        
        if (totalDelta > stepThreshold) {
           setState(prev => ({ ...prev, steps: prev.steps + 1 }));
        }
      }
      lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };
    };

    window.addEventListener('devicemotion', handleMotion);
    
    // Store cleanup on window to stop it later
    (window as any)._stopStepCounter = () => {
      window.removeEventListener('devicemotion', handleMotion);
      setState(s => ({ ...s, isActive: false }));
    };
  };

  const stopCounting = () => {
    if ((window as any)._stopStepCounter) {
      (window as any)._stopStepCounter();
    }
  };

  const addManualSteps = async (amount: number) => {
    const newSteps = state.steps + amount;
    setState(s => ({ ...s, steps: newSteps, source: 'manual' }));
    await saveDailySteps(userId, { date: todayDate, steps: newSteps, goal: state.goal, source: 'manual' });
    stepsAccumulator.current = newSteps;
  };

  return {
    ...state,
    startCounting,
    stopCounting,
    addManualSteps,
    requestPermission
  };
}
