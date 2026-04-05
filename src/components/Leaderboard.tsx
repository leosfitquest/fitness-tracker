import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { getRank } from '../utils/gamification';
import { HUNTER_TIERS } from '../utils/hunterTier';

export function Leaderboard() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .order('xp', { ascending: false })
            .limit(50);

        setUsers(data || []);
        setLoading(false);
    };

    const getTierInfo = (tierName: string) => {
        return HUNTER_TIERS.find(t => t.tier === tierName) || HUNTER_TIERS[0];
    };

    if (loading) {
        return (
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">🏆 Leaderboard</h3>
                <div className="text-center text-slate-500 py-8">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">🏆 Leaderboard</h3>

            {users.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No users yet. Be the first!</div>
            ) : (
                <div className="space-y-2">
                    {users.map((user, index) => {
                        const rank = getRank(user.xp || 0);
                        const tier = getTierInfo(user.hunter_tier || 'E');

                        return (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-slate-800/80"
                                style={{
                                    background: index < 3 ? `${tier.color}08` : 'rgba(30,41,59,0.5)',
                                    borderLeft: index < 3 ? `3px solid ${tier.color}` : '3px solid transparent',
                                }}
                            >
                                {/* Position */}
                                <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full text-sm ${
                                    index === 0 ? 'bg-yellow-500 text-black' :
                                    index === 1 ? 'bg-slate-400 text-black' :
                                    index === 2 ? 'bg-amber-700 text-white' :
                                    'bg-slate-700 text-slate-400'
                                }`}>
                                    {index + 1}
                                </div>

                                {/* Avatar */}
                                <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden shrink-0 relative">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold">
                                            {user.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    {/* Hunter tier mini badge */}
                                    {tier.tier !== 'E' && (
                                        <div
                                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                                            style={{
                                                background: tier.gradient,
                                                border: `1px solid ${tier.color}`,
                                            }}
                                        >
                                            {tier.icon}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-200 truncate">{user.full_name || user.username}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-2">
                                        <span>Lvl {user.level || 1}</span>
                                        <span className="text-emerald-500">{rank}</span>
                                        {tier.tier !== 'E' && (
                                            <span style={{ color: tier.color }} className="font-bold">{tier.tier}-Rank</span>
                                        )}
                                    </div>
                                </div>

                                {/* XP & Streak */}
                                <div className="text-right">
                                    <div className="font-bold text-emerald-400 text-sm">{user.xp?.toLocaleString() || 0} XP</div>
                                    {user.current_streak && user.current_streak > 0 && (
                                        <div className="text-xs text-orange-400">🔥 {user.current_streak}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
