import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface TimerContextProps {
  restTimeLeft: number | null;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

export function GlobalTimerProvider({ children }: { children: ReactNode }) {
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: number;
    if (restTimeLeft !== null && restTimeLeft > 0) {
      interval = window.setInterval(() => {
        setRestTimeLeft(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (restTimeLeft === 0) {
      // Play a sound or notification when it hits 0
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("Rest Time Complete", {
          body: "Time to start your next set!",
          icon: "/favicon.ico" // optionally point to app icon
        });
      }
      setRestTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startRestTimer = (seconds: number) => {
    setRestTimeLeft(seconds);
  };

  const stopRestTimer = () => {
    setRestTimeLeft(null);
  };

  return (
    <TimerContext.Provider value={{ restTimeLeft, startRestTimer, stopRestTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useGlobalTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a GlobalTimerProvider');
  }
  return context;
}
