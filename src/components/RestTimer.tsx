import { useState, useEffect } from 'react';

interface RestTimerProps {
  initialSeconds: number;
  onDismiss: () => void;
  autoStart?: boolean;
}

export function RestTimer({ initialSeconds, onDismiss, autoStart = true }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Timer finished - Play sound (optional)
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-8 max-w-sm w-full text-center">
        {/* Timer Display */}
        <div className="mb-6">
          <div className="text-6xl font-bold text-emerald-400 font-mono mb-2">
            {formatTime(seconds)}
          </div>
          <div className="text-sm text-slate-400">
            {seconds === 0 ? 'Rest Complete!' : 'Rest Time'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
          
          <button
            onClick={() => setSeconds(seconds + 30)}
            className="px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
          >
            +30s
          </button>

          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition-all"
          >
            Skip
          </button>
        </div>

        {/* Quick Time Buttons */}
        <div className="flex gap-2 mt-4">
          {[60, 90, 120, 180].map((time) => (
            <button
              key={time}
              onClick={() => {
                setSeconds(time);
                setIsRunning(true);
              }}
              className="flex-1 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              {time / 60}min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
