import { useNotifications } from '../hooks/useNotifications';
import { useState } from 'react';

// Simple time ago formatter if not exists
function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

export function NotificationsPage() {
    const { notifications, loading, markRead } = useNotifications();
    const [marking, setMarking] = useState(false);

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        setMarking(true);
        await markRead(unreadIds);
        setMarking(false);
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Notifications...</div>;

    return (
        <div className="pb-24 max-w-2xl mx-auto px-4 pt-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={marking}
                        className="text-sm text-primary font-bold hover:underline disabled:opacity-50"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border">
                        <span className="text-4xl block mb-2">🔕</span>
                        <p className="text-muted-foreground">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-xl border flex gap-4 ${n.is_read ? 'bg-card border-border' : 'bg-secondary/30 border-primary/20'}`}>
                            <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {n.from_user?.avatar_url ? (
                                    <img src={n.from_user.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-muted-foreground">{n.from_user?.username?.[0] || '?'}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-foreground">
                                    <span className="font-bold">{n.from_user?.username || 'Someone'}</span>
                                    {' '}
                                    {n.type === 'follow' && 'started following you'}
                                    {n.type === 'like' && 'liked your workout'}
                                    {n.type === 'comment' && 'commented on your workout'}
                                </p>
                                {n.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">"{n.message}"</p>}
                                <p className="text-[10px] text-muted-foreground mt-2">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
