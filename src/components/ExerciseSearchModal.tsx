import { useState } from 'react';
import type { Exercise } from '../App';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
  allExercises: Exercise[];
  muscleGroups: readonly string[];
}

export function ExerciseSearchModal({
  isOpen,
  onClose,
  onSelectExercise,
  allExercises,
  muscleGroups,
}: ExerciseSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');

  if (!isOpen) return null;

  const filteredExercises = allExercises.filter((ex) => {
    if (filterMuscle !== 'all' && ex.muscleGroup !== filterMuscle) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
  });

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    setSearchQuery('');
    setFilterMuscle('all');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-emerald-400">Add Exercise</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 space-y-3 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            autoFocus
          />
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMuscle('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                filterMuscle === 'all'
                  ? 'border-emerald-500 bg-emerald-900 text-emerald-100'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setFilterMuscle(group)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  filterMuscle === group
                    ? 'border-emerald-500 bg-emerald-900 text-emerald-100'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-slate-500 mb-2">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSelect(ex.id)}
                className="group p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500 transition-all text-left"
              >
                {ex.imageUrl && (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="w-full h-32 object-cover rounded-md mb-2 opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <h4 className="font-medium text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                  {ex.name}
                </h4>
                <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full inline-block">
                  {ex.muscleGroup}
                </span>
              </button>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No exercises found. Try a different search term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
