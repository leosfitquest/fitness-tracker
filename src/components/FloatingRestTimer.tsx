import { useGlobalTimer } from '../hooks/GlobalTimerContext';

export function FloatingRestTimer({ bottomOffset = '80px' }: { bottomOffset?: string }) {
  const { restTimeLeft, stopRestTimer, startRestTimer } = useGlobalTimer();

  if (restTimeLeft === null) return null;

  const minutes = Math.floor(restTimeLeft / 60);
  const seconds = restTimeLeft % 60;

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom flex items-center gap-3 bg-card border border-primary/50 shadow-2xl rounded-full px-4 py-2"
      style={{ bottom: bottomOffset }}
    >
      <div className="flex items-center gap-2 text-primary font-bold">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      
      <div className="flex space-x-1 border-l border-border pl-2">
        <button 
          onClick={() => startRestTimer(restTimeLeft + 30)}
          className="p-1 text-slate-400 hover:text-primary transition-colors text-xs font-bold"
        >
          +30s
        </button>
        <button 
          onClick={() => startRestTimer(Math.max(0, restTimeLeft - 30))}
          className="p-1 text-slate-400 hover:text-primary transition-colors text-xs font-bold"
        >
          -30s
        </button>
        <button 
          onClick={stopRestTimer}
          className="p-1 text-slate-400 hover:text-destructive transition-colors ml-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
