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

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header mit Bild */}
        <div className="relative">
          {imageUrl && (
            <div className="w-full h-48 bg-slate-950 overflow-hidden">
              <img
                src={imageUrl}
                alt={exerciseName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-2xl font-bold text-white mb-4">{exerciseName}</h2>

          {/* Equipment & Muscles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {equipment && (
              <span className="px-3 py-1 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-full text-sm">
                🏋️ {equipment}
              </span>
            )}
            {primaryMuscles?.map((muscle) => (
              <span key={muscle} className="px-3 py-1 bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 rounded-full text-sm">
                💪 {muscle}
              </span>
            ))}
            {secondaryMuscles?.map((muscle) => (
              <span key={muscle} className="px-3 py-1 bg-slate-700/30 border border-slate-600/50 text-slate-300 rounded-full text-sm">
                {muscle}
              </span>
            ))}
          </div>

          {/* Instructions */}
          {instructions && instructions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-emerald-400 mb-3">📋 Instructions</h3>
              <ol className="space-y-3">
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
