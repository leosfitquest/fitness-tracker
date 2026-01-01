import { useState } from "react";
import { SetEntryRow } from "./SetEntryRow";

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
  // NEW: Feature Toggles
  showRPE?: boolean;
  show1RM?: boolean;
  showPlateCalculator?: boolean;
}

const getSetClasses = (set: ActiveSet, progressColor: 'emerald' | 'red' | 'gray') => {
  if (set.completed) {
    switch (progressColor) {
      case 'emerald':
        return 'border-emerald-500 bg-emerald-950/30';
      case 'red':
        return 'border-red-500 bg-red-950/30';
      case 'gray':
        return 'border-gray-500 bg-gray-950/30';
    }
  }
  return 'border-slate-700 bg-slate-900/50 hover:bg-slate-800';
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
  showRPE = false,
  show1RM = false,
  showPlateCalculator = false,
}: ActiveWorkoutCardProps) {
  const [customRestSeconds, setCustomRestSeconds] = useState(90);

  const getProgressColor = (setIndex: number): 'emerald' | 'red' | 'gray' => {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* Exercise Name */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{exerciseName}</h2>
          <p className="text-xs text-slate-400 uppercase">{muscleGroup}</p>
        </div>
      </div>

      {/* KOMMENTAR SEKTION - NACH OBEN VERSCHOBEN */}
      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-2">Exercise Notes</label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add notes for this exercise..."
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 resize-none"
          rows={2}
        />
      </div>

      {/* SETS HEADER */}
      <div
        className="grid gap-2 mb-2 text-xs text-slate-400 font-bold"
        style={{
          gridTemplateColumns: showRPE 
            ? "40px 1fr 1fr 60px 50px" 
            : "40px 1fr 1fr 50px"
        }}
      >
        <div className="text-center">SET</div>
        <div>WEIGHT</div>
        <div>REPS</div>
        {showRPE && <div>RPE</div>}
        <div className="text-center">✓</div>
      </div>

      {/* SETS LIST */}
      <div className="space-y-2 mb-4">
        {sets.map((set, index) => (
          <SetEntryRow
            key={index}
            setNumber={set.setNumber}
            weight={set.weight}
            reps={set.reps}
            rpe={set.rpe}
            completed={set.completed}
            onWeightChange={(w) => onSetChange(index, "weight", w)}
            onRepsChange={(r) => onSetChange(index, "reps", r)}
            onRPEChange={(rpe) => onSetChange(index, "rpe", rpe)}
            onCompletedChange={(c) => onSetChange(index, "completed", c)}
            showRPE={showRPE}
            show1RM={show1RM}
            showPlateCalculator={showPlateCalculator}
          />
        ))}
      </div>

      {/* ADD SET BUTTON */}
      <button
        onClick={onAddSet}
        className="w-full py-2 rounded-lg border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all text-sm"
      >
        + Add Set
      </button>

      {/* REST TIMER BUTTONS */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          onClick={() => onStartRest(60)}
          className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
        >
          1 min
        </button>
        <button
          onClick={() => onStartRest(90)}
          className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
        >
          1.5 min
        </button>
        <button
          onClick={() => onStartRest(customRestSeconds)}
          className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
        >
          Custom
        </button>
      </div>
    </div>
  );
}
