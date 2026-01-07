import { useState } from 'react';
import { followUser, unfollowUser, likeSession, unlikeSession, addComment, getComments } from '../lib/database';
import type { SessionComment } from '../types.ts';

export function useSocial() {
    const [loading, setLoading] = useState(false);

    const follow = async (followerId: string, followingId: string) => {
        setLoading(true);
        try {
            await followUser(followerId, followingId);
        } finally {
            setLoading(false);
        }
    };

    const unfollow = async (followerId: string, followingId: string) => {
        setLoading(true);
        try {
            await unfollowUser(followerId, followingId);
        } finally {
            setLoading(false);
        }
    };

    const like = async (userId: string, sessionId: string) => {
        await likeSession(userId, sessionId);
    };

    const unlike = async (userId: string, sessionId: string) => {
        await unlikeSession(userId, sessionId);
    };

    const comment = async (userId: string, sessionId: string, text: string) => {
        return await addComment(userId, sessionId, text);
    };

    const loadComments = async (sessionId: string) => {
        return await getComments(sessionId);
    };

    return { follow, unfollow, like, unlike, comment, loadComments, loading };
}
