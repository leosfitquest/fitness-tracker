import { useState } from 'react';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
}

export function PlateCalculatorModal({ isOpen, onClose, initialWeight = 60 }: PlateCalculatorModalProps) {
  const [weight, setWeight] = useState(initialWeight);
  const [barWeight, setBarWeight] = useState(20);
  const [availablePlates, setAvailablePlates] = useState({
    0.5: true,
    1.25: true,
    2.5: true,
    5: true,
    10: true,
    15: true,
    20: true,
    25: true,
  });

  if (!isOpen) return null;

  const calculatePlates = () => {
    const weightPerSide = (weight - barWeight) / 2;
    
    if (weightPerSide <= 0) {
      return { plates: [], perSide: 0, possible: true, missing: 0 };
    }

    const plates = Object.keys(availablePlates)
      .map(Number)
      .filter(p => availablePlates[p as keyof typeof availablePlates])
      .sort((a, b) => b - a); // Largest first

    let remaining = weightPerSide;
    const result: { weight: number; count: number }[] = [];

    for (const plate of plates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result.push({ weight: plate, count });
        remaining -= plate * count;
      }
    }

    const possible = remaining < 0.01; // Allow tiny rounding errors

    return {
      plates: result,
      perSide: weightPerSide,
      possible,
      missing: remaining,
    };
  };

  const calc = calculatePlates();

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🏋️ Plate Calculator</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Weight Input */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Total Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-2xl font-bold text-center focus:border-emerald-500 outline-none"
            step="2.5"
          />
        </div>

        {/* Bar Weight Selection */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Bar Weight</label>
          <div className="grid grid-cols-3 gap-2">
            {[20, 15, 10].map((bw) => (
              <button
                key={bw}
                onClick={() => setBarWeight(bw)}
                className={`py-2 rounded-lg font-bold transition-all ${
                  barWeight === bw
                    ? 'bg-emerald-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {bw}kg
              </button>
            ))}
          </div>
        </div>

        {/* Available Plates */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Available Plates</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(availablePlates).map((plate) => {
              const p = Number(plate);
              return (
                <button
                  key={plate}
                  onClick={() =>
                    setAvailablePlates((prev) => ({ ...prev, [p]: !prev[p as keyof typeof prev] }))
                  }
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    availablePlates[p as keyof typeof availablePlates]
                      ? 'bg-emerald-500 text-black'
                      : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                >
                  {p}kg
                </button>
              );
            })}
          </div>
        </div>

        {/* Result */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-center mb-4">
            <div className="text-sm text-slate-400">Weight per side</div>
            <div className="text-3xl font-bold text-emerald-400">{calc.perSide.toFixed(2)}kg</div>
          </div>

          {calc.possible ? (
            <div className="space-y-2">
              <div className="text-sm font-bold text-emerald-400 mb-2">✓ Load per side:</div>
              {calc.plates.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2"
                >
                  <span className="text-white font-bold">{p.weight}kg</span>
                  <span className="text-slate-400">× {p.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-red-400 font-bold mb-2">⚠️ Not possible</div>
              <div className="text-sm text-slate-400">
                Missing {calc.missing.toFixed(2)}kg per side with available plates
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
