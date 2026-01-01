import { useState } from "react";

// Hilfsfunktionen
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
};

const calculatePlates = (targetWeight: number, barWeight: number = 20): string[] => {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const weightPerSide = (targetWeight - barWeight) / 2;
  const result: string[] = [];
  let remaining = weightPerSide;

  for (const plate of plates) {
    while (remaining >= plate) {
      result.push(`${plate}kg`);
      remaining -= plate;
    }
  }

  return result.length > 0 ? result : ["Nur Stange"];
};

export function ToolsSection() {
  const [show1RMCalc, setShow1RMCalc] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState<number>(100);
  const [calcReps, setCalcReps] = useState<number>(5);

  const estimated1RM = calculate1RM(calcWeight, calcReps);
  const platesList = calculatePlates(calcWeight);

  return (
    <div className="space-y-4 mb-8">
      <div className="grid gap-3 grid-cols-2">
        <button
          onClick={() => setShow1RMCalc(!show1RMCalc)}
          className={`p-3 rounded-lg border transition-all text-sm font-medium ${
            show1RMCalc 
              ? "border-emerald-500 bg-emerald-900/20 text-emerald-400" 
              : "border-slate-800 bg-slate-900 hover:bg-slate-800"
          }`}
        >
          🧮 1RM Calculator
        </button>
        <button
          onClick={() => setShowPlateCalc(!showPlateCalc)}
          className={`p-3 rounded-lg border transition-all text-sm font-medium ${
            showPlateCalc 
              ? "border-blue-500 bg-blue-900/20 text-blue-400" 
              : "border-slate-800 bg-slate-900 hover:bg-slate-800"
          }`}
        >
          ⚖️ Plate Calculator
        </button>
      </div>

      {show1RMCalc && (
        <div className="rounded-lg border border-emerald-500/50 bg-slate-900 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-emerald-400">1RM Calculator (Brzycki)</h3>
          <div className="grid gap-3 grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Weight (kg)</label>
              <input
                type="number"
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Reps</label>
              <input
                type="number"
                value={calcReps}
                onChange={(e) => setCalcReps(Number(e.target.value))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="text-center p-3 bg-emerald-950/50 rounded-lg border border-emerald-500/30">
            <div className="text-xs text-slate-400">Estimated 1RM</div>
            <div className="text-3xl font-black text-emerald-400">
              {estimated1RM} kg
            </div>
          </div>
        </div>
      )}

      {showPlateCalc && (
        <div className="rounded-lg border border-blue-500/50 bg-slate-900 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-blue-400">Plate Calculator</h3>
          <div>
            <label className="text-xs text-slate-400">Total Weight (kg)</label>
            <input
              type="number"
              value={calcWeight}
              onChange={(e) => setCalcWeight(Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="p-3 bg-blue-950/50 rounded-lg border border-blue-500/30">
            <div className="text-xs text-slate-400 mb-2">
              Pro Seite auflegen (20kg Stange):
            </div>
            <div className="flex flex-wrap gap-2">
              {platesList.map((plate, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono border border-blue-500/30"
                >
                  {plate}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}