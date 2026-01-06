import { useState } from 'react';
import type { FeedItem as FeedItemType } from '../types.ts';
import { likeSession, unlikeSession } from '../lib/database';
import { formatTime } from '../utils/math';

interface FeedItemProps {
    item: FeedItemType;
    currentUserId: string;
}

export function FeedItem({ item, currentUserId }: FeedItemProps) {
    const [liked, setLiked] = useState(item.has_liked);
    const [likeCount, setLikeCount] = useState(item.likes_count);

    const handleToggleLike = async () => {
        // Optimistic update
        const isNowLiked = !liked;
        setLiked(isNowLiked);
        setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1);

        try {
            if (isNowLiked) {
                await likeSession(currentUserId, item.id);
            } else {
                await unlikeSession(currentUserId, item.id);
            }
        } catch (e) {
            // Revert on error
            setLiked(!isNowLiked);
            setLikeCount(prev => isNowLiked ? prev - 1 : prev + 1);
            console.error(e);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 shadow-sm">
            {/* Header: User & Time */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {item.user?.avatar_url ? (
                        <img src={item.user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-muted-foreground">{item.user?.username?.[0]?.toUpperCase()}</span>
                    )}
                </div>
                <div>
                    <div className="font-bold text-foreground">{item.user?.username || 'Unknown User'}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.endedAt).toLocaleDateString()} at {new Date(item.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>

            {/* Workout Content */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-primary mb-1">{item.workoutName}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                    <span>⏱ {formatTime(item.durationSeconds || item.durationMinutes * 60)}</span>
                    <span>⚖️ {item.totalVolume} kg</span>
                    <span>🔢 {item.totalSetsCompleted} sets</span>
                </div>

                {/* PRs Highlight */}
                {item.newPRs && item.newPRs.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg mb-3">
                        <div className="text-xs font-bold text-yellow-500 mb-1">🏆 New Records!</div>
                        {item.newPRs.slice(0, 3).map((pr, idx) => (
                            <div key={idx} className="text-xs text-foreground">
                                {pr.exerciseName}: <span className="font-mono">{pr.newValue} {pr.type === '1RM' ? 'kg 1RM' : pr.type === 'volume' ? 'kg Vol' : 'reps'}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-sm text-foreground/80 line-clamp-2">
                    {item.notes}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
                <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{likeCount}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <span>💬</span>
                    <span>{item.comments_count}</span>
                </button>
            </div>
        </div>
    );
}
