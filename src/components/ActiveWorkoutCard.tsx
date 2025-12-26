import { useState } from "react";

interface ActiveSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null; // NEU: RPE hinzugefügt
  completed: boolean;
}

interface ActiveWorkoutCardProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
  note?: string;
  onSetChange: (index: number, field: string, value: any) => void;
  onAddSet: () => void;
  onStartRest: (seconds: number) => void;
  onNoteChange: (note: string) => void;
  isDeload?: boolean;
}

export function ActiveWorkoutCard({
  exerciseId,
  exerciseName,
  muscleGroup,
  sets,
  note = "",
  onSetChange,
  onAddSet,
  onStartRest,
  onNoteChange,
  isDeload = false,
}: ActiveWorkoutCardProps) {
  const [customRestSeconds, setCustomRestSeconds] = useState(90);

  const getProgressColor = (setIndex: number) => {
    const currentSet = sets[setIndex];

    if (!currentSet.weight || !currentSet.reps) {
      return "gray";
    }

    if (setIndex === 0) {
      return "gray";
    }

    const prev = sets[setIndex - 1];
    if (!prev.weight || !prev.reps) {
      return "gray";
    }

    if (
      currentSet.weight > prev.weight ||
      (currentSet.weight === prev.weight && currentSet.reps > prev.reps)
    ) {
      return "emerald";
    }

    if (
      currentSet.weight < prev.weight ||
      (currentSet.weight === prev.weight && currentSet.reps < prev.reps)
    ) {
      return "red";
    }

    return "gray";
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
      {/* Exercise Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{exerciseName}</h2>
          <span className="inline-block px-2 py-1 bg-slate-800 text-xs rounded-full text-emerald-400">
            {muscleGroup}
          </span>
          {isDeload && (
            <span className="inline-block px-2 py-1 bg-amber-500/20 text-xs rounded-full text-amber-400 border border-amber-500/40 ml-2">
              Deload
            </span>
          )}
        </div>
      </div>

      {/* Sets List */}
      <div className="space-y-3">
        {sets.map((set, index) => {
          const progressColor = getProgressColor(index);
          return (
            <div
              key={set.setNumber}
              className={`p-4 rounded-lg border transition-all ${
                set.completed 
                  ? `border-${progressColor}-500 bg-${progressColor}-950/30` 
                  : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-300">
                  Set {set.setNumber}
                </span>
                <button
                  onClick={() => onSetChange(index, "completed", !set.completed)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                    set.completed
                      ? 'bg-emerald-500 text-white shadow-emerald-500/50'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:shadow-slate-500/50'
                  }`}
                  title={set.completed ? "Mark as incomplete" : "Mark as completed"}
                >
                  {set.completed ? '✅' : '○'}
                </button>
              </div>

              {/* Weight + Reps + RPE Inputs */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Weight Input + Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">Weight</label>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={40}
                      max={100}
                      step={1}
                      value={set.weight || ""}
                      onChange={(e) => onSetChange(index, "weight", e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="80"
                    />
                    <select
                      onChange={(e) => onSetChange(index, "weight", e.target.value ? Number(e.target.value) : null)}
                      value={set.weight || ""}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                    >
                      <option value="">← Quick</option>
                      {Array.from({ length: 61 }, (_, i) => 40 + i).map((w) => (
                        <option key={w} value={w}>
                          {w}kg
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reps Input + Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">Reps</label>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={4}
                      max={20}
                      step={1}
                      value={set.reps || ""}
                      onChange={(e) => onSetChange(index, "reps", e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="8"
                    />
                    <select
                      onChange={(e) => onSetChange(index, "reps", e.target.value ? Number(e.target.value) : null)}
                      value={set.reps || ""}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                    >
                      <option value="">← Quick</option>
                      {Array.from({ length: 17 }, (_, i) => 4 + i).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* NEU: RPE Input + Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">RPE</label>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      value={set.rpe || ""}
                      onChange={(e) => onSetChange(index, "rpe", e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="8"
                    />
                    <select
                      onChange={(e) => onSetChange(index, "rpe", e.target.value ? Number(e.target.value) : null)}
                      value={set.rpe || ""}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all"
                    >
                      <option value="">← Quick</option>
                      {Array.from({ length: 19 }, (_, i) => 1 + i * 0.5).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {set.weight && set.reps && (
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-full w-fit mx-auto ${
                  progressColor === 'emerald' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 shadow-emerald-500/20' 
                    : progressColor === 'red' 
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 shadow-red-500/20'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-700 shadow-sm'
                }`}>
                  {progressColor === 'emerald' && '🎉 NEW PR!'}
                  {progressColor === 'red' && '📉 Below previous'}
                  {progressColor === 'gray' && '➖ Same as last'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exercise Note - innerhalb der Card */}
      <div className="space-y-2 pt-4 border-t border-slate-800">
        <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
          💬 Notizen zu dieser Übung
        </label>
        <textarea
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm resize-vertical min-h-[70px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-600"
          placeholder="Technik, Gefühl, Form-Checks..."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </div>

      {/* Add Set + Custom Rest Timer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
        <button
          onClick={onAddSet}
          className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-700 rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-lg hover:shadow-slate-500/50 hover:scale-[1.02]"
        >
          + Add Set
        </button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Rest Time:</label>
            <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-w-[5rem]">
              <button
                onClick={() => setCustomRestSeconds(Math.max(30, customRestSeconds - 30))}
                className="text-lg hover:text-emerald-400 transition-all hover:scale-110"
                title="Decrease by 30s"
              >
                −
              </button>
              <span className="text-lg font-mono font-bold mx-2 min-w-[3.5rem] text-center">
                {Math.floor(customRestSeconds / 60)}:{(customRestSeconds % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => setCustomRestSeconds(Math.min(600, customRestSeconds + 30))}
                className="text-lg hover:text-emerald-400 transition-all hover:scale-110"
                title="Increase by 30s"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => onStartRest(customRestSeconds)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-[1.02] whitespace-nowrap"
          >
            ⏱️ Start Rest
          </button>
        </div>
      </div>
    </div>
  );
}
