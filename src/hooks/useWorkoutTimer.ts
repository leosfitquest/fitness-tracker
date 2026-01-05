import { useState, useEffect, useRef } from 'react';

export function useWorkoutTimer(defaultRestTime: number = 90) {
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [customRestSeconds, setCustomRestSeconds] = useState(defaultRestTime);
  const [restTimerRemaining, setRestTimerRemaining] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [autoStartRest, setAutoStartRest] = useState(true);
  
  const timerRef = useRef<number | null>(null);

  const startRestTimer = (seconds: number) => {
    setCustomRestSeconds(seconds);
    setRestTimerRemaining(seconds);
    setShowRestTimer(true);
    setIsRestTimerActive(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setRestTimerRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRestTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowRestTimer(false);
    setIsRestTimerActive(false);
  };

  const addRestTime = (seconds: number) => {
    setRestTimerRemaining((prev) => prev + seconds);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    customRestSeconds,
    setCustomRestSeconds, // ⭐ ADDED
    restTimerRemaining,
    isRestTimerActive,
    showRestTimer,
    setShowRestTimer,
    startRestTimer,
    stopRestTimer,
    addRestTime,
    autoStartRest,
    setAutoStartRest,
  };
}
