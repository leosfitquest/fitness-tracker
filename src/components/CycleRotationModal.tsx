import type { CycleRotationSuggestion } from '../types.ts';
import { RefreshCw, Dumbbell } from 'lucide-react';

interface CycleRotationModalProps {
  suggestion: CycleRotationSuggestion;
  onAccept: () => void;
  onDecline: () => void;
}

export function CycleRotationModal({ suggestion, onAccept, onDecline }: CycleRotationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-6 text-center max-w-sm w-full relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <RefreshCw className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">Time to Rotate!</h2>
          
          <div className="text-slate-300 text-sm mb-6 leading-relaxed">
            You pushed heavy weight (≤3 reps)! The <strong>{suggestion.patternName}</strong> cycle suggests switching exercises to prevent plateaus.
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 text-left">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Next in cycle</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-bold text-slate-200 leading-tight mb-1">{suggestion.nextExerciseName}</div>
                {suggestion.lastWeight ? (
                  <div className="text-xs text-emerald-400 font-medium">Last cycle: {suggestion.lastWeight} kg</div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">First time in cycle</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onAccept}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Switch Exercise
            </button>
            <button 
              onClick={onDecline}
              className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700 transition-colors"
            >
              Keep Current Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
