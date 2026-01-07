import { useState, useEffect } from 'react';
import { getFollowers, getFollowing } from '../lib/database';
import type { UserProfile } from '../types.ts';

interface FollowListProps {
    userId: string;
    type: 'followers' | 'following';
    onClose: () => void;
    onNavigate?: (page: string) => void; // Optional navigation logic if we want to click a user
}

export function FollowList({ userId, type, onClose, onNavigate }: FollowListProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, [userId, type]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            if (type === 'followers') {
                const data = await getFollowers(userId);
                setUsers(data);
            } else {
                const data = await getFollowing(userId);
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card border border-border w-full max-w-sm rounded-xl overflow-hidden max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-lg text-foreground capitalize">{type}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded text-muted-foreground">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="text-center p-4 text-muted-foreground">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground">No users found.</div>
                    ) : (
                        <div className="space-y-1">
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg cursor-pointer"
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate(u.id); // Assuming onNavigate takes userId or we navigate to /profile/:id
                                        }
                                        onClose();
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground">{u.username}</div>
                                        <div className="text-xs text-muted-foreground">{u.full_name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
