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
  const [filterMuscle, setFilterMuscle] = useState('all');

  if (!isOpen) return null;

  const filteredExercises = allExercises.filter((ex) => {
    if (filterMuscle !== 'all' && ex.muscleGroup !== filterMuscle) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
  });

  // 🔍 DEBUG: Console log
  console.log('🔍 DEBUG - Total allExercises:', allExercises.length);
  console.log('🔍 DEBUG - Filtered exercises:', filteredExercises.length);
  console.log('🔍 DEBUG - First 3 exercises:', filteredExercises.slice(0, 3).map(ex => ex.name));

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    setSearchQuery('');
    setFilterMuscle('all');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '2px solid red' }} // 🔍 DEBUG Border
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Exercise</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            autoFocus
          />
        </div>

        {/* Muscle Group Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
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

        {/* Exercise Count */}
        <div className="text-xs text-slate-400 mb-2">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </div>

        {/* Exercise List - WITH DEBUG STYLING */}
        <div 
          className="flex-1 overflow-y-auto space-y-2 pr-2"
          style={{ 
            border: '2px solid yellow', // 🔍 DEBUG Border
            minHeight: '200px',
            maxHeight: 'calc(80vh - 300px)'
          }}
        >
          <p className="text-yellow-400 text-xs mb-2">🔍 DEBUG: Container sichtbar? Scroll funktioniert?</p>
          
          {filteredExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleSelect(ex.id)}
              className="group w-full p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500 transition-all text-left flex items-center gap-3"
            >
              {ex.imageUrl && (
                <img
                  src={ex.imageUrl}
                  alt={ex.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-emerald-400 truncate">
                  {ex.name}
                </h3>
                <p className="text-xs text-slate-500 uppercase">{ex.muscleGroup}</p>
              </div>
            </button>
          ))}

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
