import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFeed } from '../hooks/useFeed';
import { FeedItem } from './FeedItem';

export function FeedPage() {
    const { feed, loading, error } = useFeed();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user?.id);
        });
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Feed...</div>;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg inline-block text-left">
                    <p className="font-bold">Error loading feed:</p>
                    <pre className="text-xs mt-2 overflow-auto max-w-sm">{error.message}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 max-w-2xl mx-auto px-4 pt-6">
            <h1 className="text-2xl font-bold text-foreground mb-6">Activity Feed</h1>
            {feed.length === 0 ? (
                <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border">
                    <div className="text-4xl mb-4">😴</div>
                    <h3 className="font-bold text-foreground mb-2">It's quiet in here...</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Follow more people or log a workout to see activity!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentUserId && feed.map(item => (
                        <FeedItem key={item.id} item={item} currentUserId={currentUserId} />
                    ))}
                </div>
            )}
        </div>
    );
}
