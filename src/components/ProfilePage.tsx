import { useState, useEffect } from 'react';
import { getProfile, updateProfile, getFollowers, getFollowing, followUser, unfollowUser, loadWorkouts } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { UserProfile, Workout } from '../types.ts';
import { FollowList } from './FollowList'; // To be created

interface ProfilePageProps {
    userId?: string; // If undefined, current user
    onSelectUser?: (userId: string) => void;
}

export function ProfilePage({ userId, onSelectUser }: ProfilePageProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    // ... existing state ...
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);

    // Follow Stats
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);

    useEffect(() => {
        checkUser();
    }, [userId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user?.id || null);
        loadData(userId || user?.id, user?.id);
    };

    const loadData = async (targetId?: string, myId?: string) => {
        if (!targetId) return;
        setLoading(true);
        try {
            const p = await getProfile(targetId);
            if (p) {
                setProfile(p);
                setEditName(p.full_name || '');
                setEditBio(p.bio || '');
                setEditWebsite(p.website || '');
                setEditIsPublic(p.is_public ?? true);

                // Load stats
                const followers = await getFollowers(targetId);
                const following = await getFollowing(targetId);
                setFollowerCount(followers.length);
                setFollowingCount(following.length);

                // Check if I follow this user
                if (myId && myId !== targetId) {
                    const amIFollowing = followers.some(f => f.id === myId);
                    setIsFollowing(amIFollowing);
                }

                // Load workouts
                const w = await loadWorkouts(targetId);
                setWorkouts(w);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profile) return;
        try {
            const updated = await updateProfile(profile.id, {
                full_name: editName,
                bio: editBio,
                website: editWebsite,
                is_public: editIsPublic
            });
            setProfile(updated);
            setIsEditing(false);
        } catch (e) {
            alert('Error updating profile');
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser || !profile) {
            console.error("Missing user or profile", { currentUser, profile });
            return;
        }
        try {
            if (isFollowing) {
                await unfollowUser(currentUser, profile.id);
                setFollowerCount(prev => prev - 1);
            } else {
                await followUser(currentUser, profile.id);
                setFollowerCount(prev => prev + 1);
            }
            setIsFollowing(!isFollowing);
        } catch (e) {
            console.error(e);
            const timerMsg = e instanceof Error ? e.message : JSON.stringify(e);
            alert(`Error following user: ${timerMsg}`);
        }
    };

    const isOwnProfile = !userId || userId === currentUser;

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Profile...</div>;
    if (!profile) return <div className="p-8 text-center text-muted-foreground">Profile not found.</div>;

    return (
        <div className="pb-24">
            {/* Cover / Header */}
            <div className="bg-secondary/30 pb-6 border-b border-border">
                <div className="max-w-4xl mx-auto px-4 pt-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-xl">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                profile.username?.[0]?.toUpperCase() || '?'
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            {isEditing ? (
                                <div className="space-y-3 max-w-sm">
                                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" className="w-full p-2 rounded bg-background border border-border" />
                                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio" className="w-full p-2 rounded bg-background border border-border" rows={2} />
                                    <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="Website" className="w-full p-2 rounded bg-background border border-border" />
                                    <div className="flex items-center gap-2 py-2">
                                        <label className="text-sm font-bold text-foreground flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editIsPublic}
                                                onChange={e => setEditIsPublic(e.target.checked)}
                                                className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                                            />
                                            Public Profile
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-emerald-500 text-white rounded text-sm font-bold">Save</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 bg-slate-700 text-white rounded text-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.username}</h1>
                                    <p className="text-muted-foreground">@{profile.username}</p>
                                    {profile.bio && <p className="text-sm text-foreground/80 max-w-md">{profile.bio}</p>}

                                    {/* Stats */}
                                    <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                                        <button onClick={() => setShowFollowList('followers')} className="text-center hover:opacity-80">
                                            <div className="text-lg font-bold text-foreground">{followerCount}</div>
                                            <div className="text-xs text-muted-foreground">Followers</div>
                                        </button>
                                        <button onClick={() => setShowFollowList('following')} className="text-center hover:opacity-80">
                                            <div className="text-lg font-bold text-foreground">{followingCount}</div>
                                            <div className="text-xs text-muted-foreground">Following</div>
                                        </button>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-foreground">{workouts.length}</div>
                                            <div className="text-xs text-muted-foreground">Workouts</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4">
                                        {isOwnProfile ? (
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary">Edit Profile</button>
                                        ) : (
                                            <button
                                                onClick={handleFollowToggle}
                                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isFollowing
                                                    ? 'bg-secondary text-foreground border border-border'
                                                    : 'bg-primary text-primary-foreground'
                                                    }`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs (Just Workouts for now) */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h2 className="text-xl font-bold mb-4">Workouts</h2>
                <div className="grid gap-4">
                    {workouts.map(w => (
                        <div key={w.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-foreground">{w.name}</h3>
                                <p className="text-xs text-muted-foreground">{new Date(w.lastPerformed || w.createdAt || '').toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">{w.exercises.length} Exercises</div>
                                {w.estimatedDuration && <div className="text-xs text-primary">{w.estimatedDuration} min</div>}
                            </div>
                        </div>
                    ))}
                    {workouts.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground bg-secondary/20 rounded-xl">
                            No workouts yet.
                        </div>
                    )}
                </div>
            </div>

            {showFollowList && (
                <FollowList
                    type={showFollowList}
                    userId={profile.id}
                    onClose={() => setShowFollowList(null)}
                    onNavigate={onSelectUser}
                />
            )}
        </div>
    );
}
