interface ExerciseDetailModalProps {
  exercise: {
    id: string;
    name: string;
    muscleGroup: string;
    imageUrl?: string;
    instructions?: string[];
    equipment?: string | null;  // ← HIER!
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
  } | null;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{exercise.name}</h2>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full border border-emerald-500/40 mt-2">
              {exercise.muscleGroup}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          {exercise.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img 
                src={exercise.imageUrl} 
                alt={exercise.name}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          )}

          {/* Equipment */}
          {exercise.equipment && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
                  🏋️ {exercise.equipment}
                </span>
              </div>
            </div>
          )}

          {/* Muscles */}
          {(exercise.primaryMuscles && exercise.primaryMuscles.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Primary Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.primaryMuscles.map((muscle, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-sm text-emerald-300"
                  >
                    💪 {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Secondary Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.secondaryMuscles.map((muscle, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-sm text-blue-300"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Instructions</h3>
              <ol className="space-y-3">
                {exercise.instructions.map((instruction, idx) => (
                  <li 
                    key={idx}
                    className="flex gap-3 text-sm text-slate-300 leading-relaxed"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
