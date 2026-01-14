import { useState, useEffect, useCallback } from 'react';
import { getUserFeed } from '../lib/database'; // Fixed: Changed from getFeed to getUserFeed
import type { FeedItem } from '../types.ts';
import { supabase } from '../lib/supabase';

export function useFeed() {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refreshFeed = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const data = await getUserFeed(user.id);
            setFeed(data);
        } catch (err) {
            console.error("Feed load error:", err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshFeed();
    }, [refreshFeed]);

    return { feed, loading, error, refreshFeed };
}
