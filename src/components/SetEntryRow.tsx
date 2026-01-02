import { useState } from 'react';

interface SetEntryRowProps {
  setNumber: number;
  targetReps?: number;
  previousWeight?: number;
  previousReps?: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  isPersonalRecord?: boolean;
  onWeightChange: (weight: number | null) => void;
  onRepsChange: (reps: number | null) => void;
  onRPEChange: (rpe: number | null) => void;
  onCompletedChange: (completed: boolean) => void;
  showRPE?: boolean;
  show1RM?: boolean;
  showPlateCalculator?: boolean;
}

export function SetEntryRow({
  setNumber,
  targetReps,
  previousWeight,
  previousReps,
  weight,
  reps,
  rpe,
  completed,
  isPersonalRecord = false,
  onWeightChange,
  onRepsChange,
  onRPEChange,
  onCompletedChange,
  showRPE = false,
  show1RM = false,
  showPlateCalculator = false,
}: SetEntryRowProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPlates, setShowPlates] = useState(false);
  const [showRPEPicker, setShowRPEPicker] = useState(false); // NEU: RPE Picker State

  const handleWeightChange = (value: string) => {
    const num = value ? Number(value) : null;
    onWeightChange(Number.isNaN(num) ? null : num);
  };

  const handleRepsChange = (value: string) => {
    const num = value ? Number(value) : null;
    onRepsChange(Number.isNaN(num) ? null : num);
  };

  // 1RM Calculation with RPE
  const calculate1RM = (w: number, r: number, rpeValue?: number | null): number => {
    if (r === 1 && (!rpeValue || rpeValue === 10)) return w;
    
    const repPercentages: Record<number, number> = {
      1: 1.00,   2: 0.97,   3: 0.94,   4: 0.92,   5: 0.89,
      6: 0.86,   7: 0.83,   8: 0.81,   9: 0.78,  10: 0.75,
      11: 0.73, 12: 0.71,  13: 0.70,  14: 0.68,  15: 0.67,
      16: 0.65, 17: 0.64,  18: 0.63,  19: 0.61,  20: 0.60,
      21: 0.59, 22: 0.58,  23: 0.57,  24: 0.56,  25: 0.55,
      26: 0.54, 27: 0.53,  28: 0.52,  29: 0.51,  30: 0.50,
    };
    
    const getRepsInReserve = (rpe: number): number => {
      if (rpe >= 10) return 0;
      if (rpe >= 9.5) return 0.5;
      if (rpe >= 9) return 1;
      if (rpe >= 8.5) return 1.5;
      if (rpe >= 8) return 2;
      if (rpe >= 7.5) return 2.5;
      if (rpe >= 7) return 3;
      if (rpe >= 6.5) return 3.5;
      if (rpe >= 6) return 4;
      if (rpe >= 5.5) return 4.5;
      if (rpe >= 5) return 5;
      return 6;
    };
    
    let adjustedReps = r;
    if (rpeValue && rpeValue < 10) {
      const rir = getRepsInReserve(rpeValue);
      adjustedReps = Math.round(r + rir);
    }
    
    const percentage = repPercentages[adjustedReps] || (0.50 - (adjustedReps - 30) * 0.01);
    return Math.round(w / percentage);
  };

  const estimated1RM = weight && reps ? calculate1RM(weight, reps, rpe) : null;

  // Plate Calculator
  const calculatePlates = (totalWeight: number): string => {
    const barWeight = 20;
    const weightPerSide = (totalWeight - barWeight) / 2;
    if (weightPerSide <= 0) return 'Bar only (20kg)';

    const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
    let remaining = weightPerSide;
    const result: string[] = [];

    for (const plate of plates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result.push(`${plate}kg × ${count}`);
        remaining -= plate * count;
      }
    }

    if (remaining > 0.1) {
      result.push(`${remaining.toFixed(2)}kg missing`);
    }

    return result.length > 0 ? result.join(' + ') : 'Bar only';
  };

  return (
    <div
      className={`rounded-lg border transition-all ${
        completed
          ? 'bg-emerald-950/20 border-emerald-500/50'
          : isFocused
          ? 'bg-slate-800 border-emerald-500'
          : 'bg-slate-900 border-slate-700'
      }`}
    >
      {/* Main Row */}
      <div className="grid gap-2 p-2" style={{ gridTemplateColumns: showRPE ? '40px 1fr 1fr 50px 40px' : '40px 1fr 1fr 40px' }}>
        {/* Set Number */}
        <div className="flex items-center justify-center">
          <span className="text-slate-400 font-bold text-sm">{setNumber}</span>
        </div>

        {/* Weight Input */}
        <div className="relative">
          <input
            type="number"
            value={weight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={previousWeight ? `${previousWeight}` : 'kg'}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">kg</span>
        </div>

        {/* Reps Input */}
        <div className="relative">
          <input
            type="number"
            value={reps ?? ''}
            onChange={(e) => handleRepsChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={previousReps ? `${previousReps}` : 'reps'}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        {/* RPE Toggle Button */}
        {showRPE && (
          <button
            onClick={() => setShowRPEPicker(!showRPEPicker)}
            className={`px-2 py-1.5 text-xs font-bold rounded transition-all ${
              rpe
                ? 'bg-emerald-500 text-black'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {rpe ? `@${rpe}` : 'RPE'}
          </button>
        )}

        {/* Checkbox */}
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onCompletedChange(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* RPE Picker - Erscheint bei Klick */}
      {showRPE && showRPEPicker && (
        <div className="px-2 pb-2">
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-bold">Select RPE (1-10)</span>
              <button
                onClick={() => {
                  onRPEChange(null);
                  setShowRPEPicker(false);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpeValue) => (
                <button
                  key={rpeValue}
                  onClick={() => {
                    onRPEChange(rpeValue);
                    setShowRPEPicker(false);
                  }}
                  className={`py-2 text-xs font-bold rounded transition-all ${
                    rpe === rpeValue
                      ? 'bg-emerald-500 text-black'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {rpeValue}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {rpe && rpe < 10 && (
                <span>RPE {rpe} ≈ {Math.round(10 - rpe)} reps in reserve</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1RM Display */}
      {show1RM && estimated1RM && completed && (
        <div className="px-2 pb-2">
          <div className="flex items-center justify-between px-2 py-1 bg-emerald-950/20 border border-emerald-900/50 rounded text-xs">
            <span className="text-emerald-400">
              <span className="font-bold">Est. 1RM:</span> {estimated1RM}kg
              {rpe && rpe < 10 && <span className="text-slate-500 ml-1">(@ RPE {rpe})</span>}
            </span>
            {isPersonalRecord && <span className="text-orange-400 font-bold">🔥 PR!</span>}
          </div>
        </div>
      )}

      {/* Plate Calculator */}
      {showPlateCalculator && weight && (
        <div className="px-2 pb-2">
          <button
            onClick={() => setShowPlates(!showPlates)}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>{showPlates ? '▼' : '▶'}</span>
            <span>Plates: {calculatePlates(weight)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
