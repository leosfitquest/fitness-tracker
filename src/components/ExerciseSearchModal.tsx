import { useState, useMemo } from 'react';
import type { Exercise } from '../types.ts';
import { useExercisePreferences } from '../hooks/useExercisePreferences';
import { CustomExerciseModal } from './CustomExerciseModal';



interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
  allExercises: Exercise[];
  muscleGroups: readonly Exercise['muscleGroup'][];
  onCreateCustomExercise?: (ex: { name: string; muscleGroup: string; equipment?: string }) => void;
}

export function ExerciseSearchModal({
  isOpen,
  onClose,
  onSelectExercise,
  allExercises,
  muscleGroups,
  onCreateCustomExercise,
}: ExerciseSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent' | 'custom' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { favorites, recent, toggleFavorite, addToRecent } = useExercisePreferences();

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];
    return allExercises.filter((ex) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!ex.name.toLowerCase().includes(q) && !ex.muscleGroup.toLowerCase().includes(q)) {
          return false;
        }
      }

      // 2. Category/Tab Filter
      if (activeFilter === 'favorites') return Array.isArray(favorites) && favorites.includes(ex.id);
      if (activeFilter === 'recent') return Array.isArray(recent) && recent.includes(ex.id);
      if (activeFilter === 'custom') return ex.id.startsWith('custom-');
      if (activeFilter !== 'all' && ex.muscleGroup !== activeFilter) return false;

      return true;
    }).sort((a, b) => {
      // Favorites always on top if no specific sort
      const aFav = Array.isArray(favorites) && favorites.includes(a.id);
      const bFav = Array.isArray(favorites) && favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allExercises, searchQuery, activeFilter, favorites, recent]);

  const handleSelect = (exerciseId: string) => {
    addToRecent(exerciseId);
    onSelectExercise(exerciseId);
    setSearchQuery('');
    setActiveFilter('all');
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-5 max-w-2xl w-full h-[85vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Add Exercise</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">✕</button>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 placeholder-slate-500"
            autoFocus
          />
        </div>

        {/* Filters — scrollable horizontally */}
        <div className="flex gap-1.5 mb-3 pb-2 overflow-x-auto no-scrollbar border-b border-white/5">
          <button onClick={() => setActiveFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 ${activeFilter === 'all' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>All</button>
          <button onClick={() => setActiveFilter('favorites')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 ${activeFilter === 'favorites' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>❤️ Fav</button>
          <button onClick={() => setActiveFilter('recent')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 ${activeFilter === 'recent' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>🕒 Recent</button>
          <button onClick={() => setActiveFilter('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 ${activeFilter === 'custom' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>✨ Custom</button>
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveFilter(group)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all capitalize whitespace-nowrap shrink-0 ${activeFilter === group ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1">
          {filteredExercises.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredExercises.map((ex) => {
                const GITHUB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
                // Use first image frame as STATIC thumbnail only
                const thumbUrl = (ex.images && ex.images.length > 0)
                  ? `${GITHUB_BASE}${ex.images[0]}`
                  : ex.imageUrl;

                return (
                  <div key={ex.id} className="px-1">
                    <div className="flex items-center gap-2 group">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id); }}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${Array.isArray(favorites) && favorites.includes(ex.id) ? 'text-red-500' : 'text-slate-700 hover:text-red-400'}`}
                      >
                        {Array.isArray(favorites) && favorites.includes(ex.id) ? '❤️' : '🤍'}
                      </button>
                      <button
                        onClick={() => handleSelect(ex.id)}
                        className="flex-1 p-2 rounded-xl bg-slate-800/30 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all text-left flex items-center gap-3 press-effect"
                      >
                        {/* Static thumbnail ONLY — no animation in list */}
                        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase">
                              {ex.muscleGroup.slice(0, 3)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
                            {ex.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 uppercase">
                            {ex.muscleGroup} {ex.equipment ? `· ${ex.equipment}` : ''}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-sm">No exercises found</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="text-xs text-slate-500">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
          </div>
          {onCreateCustomExercise && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 press-effect"
            >
              + Create Custom
            </button>
          )}
        </div>
      </div>

      <CustomExerciseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={(data) => {
           if (onCreateCustomExercise) onCreateCustomExercise(data);
           setShowCreateModal(false);
        }}
      />
    </div>
  );
}
