import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, updateProfile } from '../lib/database';
import type { UserProfile } from '../types.ts';

export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user?.id || null);

            const targetId = userId || user?.id;
            if (targetId) {
                try {
                    const data = await getProfile(targetId);
                    setProfile(data);
                } catch (err) {
                    setError(err as Error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const update = async (updates: Partial<UserProfile>) => {
        if (!profile) return;
        try {
            const updated = await updateProfile(profile.id, updates);
            setProfile(updated);
            return updated;
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { profile, loading, error, isOwnProfile: currentUser === profile?.id, update };
}
