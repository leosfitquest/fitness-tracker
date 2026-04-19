import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { RunTracker } from './RunTracker';
import { useStepCounter } from '../hooks/useStepCounter';
import { Footprints, MapPin, Play, Square, AlertCircle, PlusCircle } from 'lucide-react';

interface MovementHubProps {
  user: User;
}

export function MovementHub({ user }: MovementHubProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'run'>('steps');
  const { steps, goal, isActive, isSupported, permissionGranted, startCounting, stopCounting, addManualSteps } = useStepCounter(user.id);
  const [manualStepInput, setManualStepInput] = useState('');

  const handleAddManual = () => {
    const s = parseInt(manualStepInput);
    if (!isNaN(s) && s > 0) {
      addManualSteps(s);
      setManualStepInput('');
    }
  };

  const progress = Math.min((steps / goal) * 100, 100);

  return (
    <div className="flex flex-col h-full bg-background relative pb-20">
      
      {/* Mode Toggle Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex justify-center">
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${
              activeTab === 'steps' 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-4 h-4" />
            Steps
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${
              activeTab === 'run' 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {activeTab === 'run' ? (
          <RunTracker user={user} />
        ) : (
          <div className="max-w-md mx-auto p-6 flex flex-col items-center">
            
            {/* Step Circular Progress */}
            <div className="relative w-64 h-64 mt-8 mb-10 flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-emerald-500/5 blur-[50px] rounded-full" />
              
              {/* SVG Ring */}
              <svg className="w-full h-full -rotate-90 filter drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="fill-none stroke-slate-800" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  className="fill-none stroke-emerald-400 transition-all duration-1000 ease-out" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter">
                  {steps.toLocaleString()}
                </div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                  / {goal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Accelerometer Status & Controls */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">Auto Tracker</h3>
                  <p className="text-slate-400 text-sm">Uses device motion sensors (Must stay active)</p>
                </div>
              </div>

              {!isSupported ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Motion tracking is completely unsupported on this device or browser. Only manual entry is available.
                </div>
              ) : permissionGranted === false ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Permission denied. Please enable motion access in your browser settings to use the auto tracker.
                </div>
              ) : (
                <button
                  onClick={isActive ? stopCounting : startCounting}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isActive 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' 
                      : 'bg-emerald-500 text-black hover:scale-[1.02] shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square className="w-5 h-5 fill-current" />
                      Stop Counting
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Start Counting
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Manual Entry */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5">
               <h3 className="text-white font-bold text-lg mb-1">Add Steps Manually</h3>
               <p className="text-slate-400 text-sm mb-4">Sync from your smartwatch or fitness band.</p>
               
               <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={manualStepInput}
                    onChange={(e) => setManualStepInput(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    onClick={handleAddManual}
                    disabled={!manualStepInput}
                    className="px-6 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add
                  </button>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
