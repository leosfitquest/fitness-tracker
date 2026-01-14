import { useState, useMemo } from 'react';
// import { List as ReactWindowList } from 'react-window'; // Removed for stability check
import type { Exercise } from '../types.ts';
import { useExercisePreferences } from '../hooks/useExercisePreferences';



interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
  allExercises: Exercise[];
  muscleGroups: readonly Exercise['muscleGroup'][];
}

export function ExerciseSearchModal({
  isOpen,
  onClose,
  onSelectExercise,
  allExercises,
  muscleGroups,
}: ExerciseSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent' | string>('all');

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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Add Exercise</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b border-border">
          <button onClick={() => setActiveFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>All</button>
          <button onClick={() => setActiveFilter('favorites')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeFilter === 'favorites' ? 'bg-red-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>❤️ Favorites</button>
          <button onClick={() => setActiveFilter('recent')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeFilter === 'recent' ? 'bg-blue-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>🕒 Recent</button>
          <div className="w-px h-6 bg-border mx-1" />
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveFilter(group)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeFilter === group ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredExercises.length > 0 ? (
            <div className="flex flex-col">
              {filteredExercises.map((ex) => (
                <div key={ex.id} className="px-2 py-1" style={{ height: 70 }}>
                  <div className="flex items-center gap-2 group h-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id); }}
                      className={`p-2 rounded-lg transition-colors ${Array.isArray(favorites) && favorites.includes(ex.id) ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-600 hover:text-red-400 hover:bg-slate-800'}`}
                    >
                      {Array.isArray(favorites) && favorites.includes(ex.id) ? '❤️' : '🤍'}
                    </button>
                    <button
                      onClick={() => handleSelect(ex.id)}
                      className="flex-1 h-full p-2 rounded-lg border border-border bg-card hover:border-primary transition-all text-left flex items-center gap-3"
                    >
                      {ex.imageUrl && (
                        <img
                          src={ex.imageUrl}
                          alt={ex.name}
                          className="w-10 h-10 object-cover rounded-md bg-secondary"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-primary truncate">
                          {ex.name}
                        </h3>
                        <p className="text-xs text-muted-foreground uppercase">
                          {ex.muscleGroup}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <span className="text-4xl mb-2">🔍</span>
              <p>No exercises found</p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-4 text-center">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </div>
      </div>
    </div>
  );
}
