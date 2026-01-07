import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getNotifications, markNotificationsRead } from '../lib/database';
import type { Notification } from '../types.ts';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const data = await getNotifications(user.id);
            setNotifications(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (ids: string[]) => {
        try {
            await markNotificationsRead(ids);
            setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    return { notifications, loading, markRead, refetch: fetchNotifications };
}
