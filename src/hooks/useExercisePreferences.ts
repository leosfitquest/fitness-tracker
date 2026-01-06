import { useState, useEffect } from 'react';

const STORAGE_KEY_FAVS = 'fitness_tracker_favorites';
const STORAGE_KEY_RECENT = 'fitness_tracker_recent';

export function useExercisePreferences() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recent, setRecent] = useState<string[]>([]);

    useEffect(() => {
        const storedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
        if (storedFavs) setFavorites(JSON.parse(storedFavs));

        const storedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
        if (storedRecent) setRecent(JSON.parse(storedRecent));
    }, []);

    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            const next = prev.includes(id)
                ? prev.filter(fid => fid !== id)
                : [...prev, id];
            localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(next));
            return next;
        });
    };

    const addToRecent = (id: string) => {
        setRecent(prev => {
            const next = [id, ...prev.filter(rid => rid !== id)].slice(0, 20); // Keep last 20
            localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(next));
            return next;
        });
    };

    return { favorites, recent, toggleFavorite, addToRecent };
}
