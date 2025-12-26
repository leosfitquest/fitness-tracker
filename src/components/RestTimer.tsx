import { useState, useEffect, useCallback } from "react";

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onDismiss?: () => void;
  autoStart?: boolean;
}

export function RestTimer({
  initialSeconds = 90,
  onComplete,
  onDismiss,
  autoStart = true,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [totalSeconds] = useState(initialSeconds);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && seconds > 0) {
      interval = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [isRunning, seconds, onComplete]);

  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  }, []);

  const handleReset = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  };

  const progress =
    totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-4 right-4 w-64 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Rest timer</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-2 text-center text-lg font-mono">
        {formatTime(seconds)}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((prev) => !prev)}
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 hover:bg-slate-800"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 hover:bg-slate-800"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
