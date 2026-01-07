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

    // Comments state
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState<import('../types.ts').SessionComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentsLoaded, setCommentsLoaded] = useState(false);

    // Initial load of minimal comments if provided or needed?
    // Doing lazy load on expand

    if (showComments && !commentsLoaded) {
        setLoadingComments(true);
        import('../lib/database').then(({ getComments }) => {
            getComments(item.id).then(data => {
                setCommentsList(data);
                setCommentsLoaded(true);
            }).finally(() => setLoadingComments(false));
        });
    }

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const { addComment } = await import('../lib/database');
            const newC = await addComment(currentUserId, item.id, newComment);
            setCommentsList(prev => [...prev, newC]);
            setNewComment('');
        } catch (e) {
            console.error('Failed to post comment', e);
        }
    };

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
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <span>💬</span>
                    <span>{item.comments_count + (commentsList.length > 0 ? commentsList.length : 0)}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-3 border-t border-border space-y-3">
                    {loadingComments ? (
                        <div className="text-xs text-muted-foreground text-center">Loading comments...</div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {commentsList.map(c => (
                                <div key={c.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
                                        {c.user?.avatar_url ? <img src={c.user.avatar_url} className="w-full h-full object-cover" /> : c.user?.username?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0 bg-secondary/30 rounded-lg p-2">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="text-xs font-bold text-foreground">{c.user?.username}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-foreground/90 break-words">{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                            {commentsList.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border focus:border-primary focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim()}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
