import { useState, useEffect } from 'react';
import { searchUsers } from '../lib/database';
import type { UserProfile } from '../types.ts';
import { useDebounce } from '../hooks/useDebounce'; // We assume we might need this or use simple timeout

// Simple debounce inside component if we don't have hook
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface UserSearchProps {
    onSelectUser: (userId: string) => void;
}

export function UserSearch({ onSelectUser }: UserSearchProps) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounceValue(query, 500);
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (debouncedQuery.trim().length > 1) {
            handleSearch(debouncedQuery);
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    const handleSearch = async (q: string) => {
        setLoading(true);
        try {
            const users = await searchUsers(q);
            setResults(users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 w-full">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Find People</h1>
            <div className="relative mb-6">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full bg-secondary text-foreground p-3 pl-10 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                />
            </div>

            {loading && <div className="text-center text-muted-foreground">Searching...</div>}

            <div className="space-y-2">
                {results.map(user => (
                    <button
                        key={user.id}
                        onClick={() => onSelectUser(user.id)}
                        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/50 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-foreground">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.full_name}</div>
                        </div>
                    </button>
                ))}
                {!loading && query.length > 1 && results.length === 0 && (
                    <div className="text-center text-muted-foreground">No users found.</div>
                )}
            </div>
        </div>
    );
}
