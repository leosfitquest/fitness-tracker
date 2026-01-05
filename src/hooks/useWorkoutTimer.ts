import { useState, useEffect, useRef } from 'react';

export function useWorkoutTimer(defaultRestTime: number = 90) {
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(defaultRestTime);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [autoStartRest, setAutoStartRest] = useState(true);
  
  const timerRef = useRef<number | null>(null);

  const startRestTimer = (seconds: number) => {
    setRestSeconds(seconds);
    setRemainingSeconds(seconds);
    setShowRestTimer(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowRestTimer(false);
  };

  const addTime = (seconds: number) => {
    setRemainingSeconds((prev) => prev + seconds);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    showRestTimer,
    setShowRestTimer,
    restSeconds,
    remainingSeconds,
    autoStartRest,
    setAutoStartRest,
    startRestTimer,
    stopRestTimer,
    addTime,
  };
}
