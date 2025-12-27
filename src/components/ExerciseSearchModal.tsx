import { useState } from 'react';
import type { Exercise } from '../App';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void; // ✏️ GEÄNDERT: Wird für Toggle verwendet
  allExercises: Exercise[];
  muscleGroups: readonly string[];
  selectedExerciseIds?: string[]; // 🆕 NEU: Optional - für Mehrfachauswahl
  multiSelect?: boolean; // 🆕 NEU: Aktiviert Mehrfachauswahl-Modus
}

export function ExerciseSearchModal({
  isOpen,
  onClose,
  onSelectExercise,
  allExercises,
  muscleGroups,
  selectedExerciseIds = [], // 🆕 NEU
  multiSelect = false, // 🆕 NEU
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

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);

    // ✏️ GEÄNDERT: Nur schließen wenn nicht im Multi-Select Modus
    if (!multiSelect) {
      setSearchQuery('');
      setFilterMuscle('all');
      onClose();
    }
  };

  // 🆕 NEU: Check ob Exercise ausgewählt ist
  const isSelected = (exerciseId: string) => {
    return selectedExerciseIds.includes(exerciseId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {multiSelect ? 'Select Exercises' : 'Add Exercise'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 🆕 NEU: Selection Counter */}
          {multiSelect && selectedExerciseIds.length > 0 && (
            <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/50 rounded-lg">
              <p className="text-sm text-emerald-400 font-medium">
                {selectedExerciseIds.length} exercise{selectedExerciseIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Search & Filter */}
          <input
            type="text"
            placeholder="Search by name or muscle group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 mb-3"
            autoFocus
          />

          {/* Muscle Filter */}
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

        {/* Exercise List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-slate-400 mb-3">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </p>

          <div className="space-y-2">
            {filteredExercises.map((ex) => {
              const selected = isSelected(ex.id);

              return (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex.id)}
                  className={`group w-full p-4 rounded-lg border transition-all text-left ${
                    selected
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* 🆕 NEU: Selection Checkbox für Multi-Select */}
                    {multiSelect && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selected 
                          ? 'border-emerald-500 bg-emerald-500' 
                          : 'border-slate-600'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Exercise Image */}
                    {ex.imageUrl && (
                      <img
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {ex.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs uppercase">
                          {ex.muscleGroup}
                        </span>
                        {ex.equipment && (
                          <span className="text-xs text-slate-500">
                            {ex.equipment}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {!multiSelect ? (
                      <svg 
                        className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    ) : selected && (
                      <svg 
                        className="w-5 h-5 text-emerald-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-2">No exercises found</p>
              <p className="text-sm text-slate-500">Try a different search term or filter</p>
            </div>
          )}
        </div>

        {/* 🆕 NEU: Footer mit Done Button für Multi-Select */}
        {multiSelect && selectedExerciseIds.length > 0 && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-all"
            >
              Done - {selectedExerciseIds.length} Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
