import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserFeed } from '../lib/database';
import { FeedItem } from './FeedItem';
import type { FeedItem as FeedItemType } from '../types.ts';

export function FeedPage() {
    const [feed, setFeed] = useState<FeedItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            loadFeed(user.id);
        }
    };

    const loadFeed = async (userId: string) => {
        try {
            const data = await getUserFeed(userId);
            setFeed(data);
        } catch (e) {
            console.error("Failed to load feed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Feed...</div>;

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
