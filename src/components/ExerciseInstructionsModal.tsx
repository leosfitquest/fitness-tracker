import { MuscleHeatmap } from './MuscleHeatmap';

interface ExerciseInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  instructions?: string[];
  imageUrl?: string;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

export function ExerciseInstructionsModal({
  isOpen,
  onClose,
  exerciseName,
  instructions,
  imageUrl,
  equipment,
  primaryMuscles,
  secondaryMuscles,
}: ExerciseInstructionsModalProps) {
  if (!isOpen) return null;

  const hasMuscleData = (primaryMuscles && primaryMuscles.length > 0) || (secondaryMuscles && secondaryMuscles.length > 0);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Premium Header: Muscle Heatmap + Exercise Info ── */}
        <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-6">
            {/* Muscle Heatmap (or stock image fallback) */}
            {hasMuscleData ? (
              <div className="flex-shrink-0 bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                <MuscleHeatmap
                  primaryMuscles={primaryMuscles}
                  secondaryMuscles={secondaryMuscles}
                  height={130}
                />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={exerciseName}
                className="w-24 h-24 object-cover rounded-xl border border-slate-700 flex-shrink-0"
              />
            ) : null}

            {/* Exercise Name + Badges */}
            <div className="flex-1 min-w-0 pr-8">
              <h2 className="text-2xl font-black text-white mb-3 leading-tight">{exerciseName}</h2>
              <div className="flex flex-wrap gap-2">
                {equipment && (
                  <span className="px-2.5 py-1 bg-blue-900/40 border border-blue-700/50 text-blue-300 rounded-full text-xs font-bold">
                    🏋️ {equipment}
                  </span>
                )}
                {primaryMuscles?.map((muscle) => (
                  <span key={muscle} className="px-2.5 py-1 bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold">
                    {muscle}
                  </span>
                ))}
                {secondaryMuscles?.map((muscle) => (
                  <span key={muscle} className="px-2.5 py-1 bg-cyan-900/30 border border-cyan-700/40 text-cyan-400 rounded-full text-xs">
                    {muscle}
                  </span>
                ))}
              </div>

              {hasMuscleData && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-400">Primary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-400">Secondary</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Instructions ── */}
        <div className="p-6 overflow-y-auto flex-1">
          {instructions && instructions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step-by-step</h3>
              <ol className="space-y-4">
                {instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 leading-relaxed pt-0.5">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No instructions available for this exercise.
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
