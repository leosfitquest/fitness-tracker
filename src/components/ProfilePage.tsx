import { useState, useEffect } from 'react';
import { getProfile, updateProfile, getFollowers, getFollowing, followUser, unfollowUser, loadWorkouts, loadExerciseRecords, uploadAvatar } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { UserProfile, Workout, ExerciseRecord } from '../types.ts';
import { FollowList } from './FollowList';
import { Leaderboard } from './Leaderboard';
import { HunterRankCard } from './HunterRankCard';
import { BadgeShowcase } from './AnimatedBadge';
import { ExerciseRankBadge } from './ExerciseRankBadge';
import { getExerciseRank, type ExerciseRank } from '../utils/strengthStandards';
import { calculateHunterTier, checkBadgeEligibility, BADGE_DEFINITIONS, type HunterTierName } from '../utils/hunterTier';
import { getRank, getNextRank } from '../utils/gamification';

interface ProfilePageProps {
    userId?: string;
    onSelectUser?: (userId: string) => void;
}

export function ProfilePage({ userId, onSelectUser }: ProfilePageProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [exerciseRecords, setExerciseRecords] = useState<Record<string, ExerciseRecord>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'ranks'>('overview');

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editBodyweight, setEditBodyweight] = useState('');
    const [editGender, setEditGender] = useState('');

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
                setEditBodyweight(String(p.bodyweight || ''));
                setEditGender(p.gender || '');

                const followers = await getFollowers(targetId);
                const following = await getFollowing(targetId);
                setFollowerCount(followers.length);
                setFollowingCount(following.length);

                if (myId && myId !== targetId) {
                    const amIFollowing = followers.some(f => f.id === myId);
                    setIsFollowing(amIFollowing);
                }

                const w = await loadWorkouts(targetId);
                setWorkouts(w);

                const records = await loadExerciseRecords(targetId);
                setExerciseRecords(records);
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
                is_public: editIsPublic,
                bodyweight: editBodyweight ? parseFloat(editBodyweight) : undefined,
                gender: editGender as any || undefined,
            });
            setProfile(updated);
            setIsEditing(false);
        } catch (e) {
            alert('Error updating profile');
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser || !profile) return;
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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !profile) return;
        const file = event.target.files[0];
        setUploadingAvatar(true);
        try {
            const publicUrl = await uploadAvatar(profile.id, file);
            const updated = await updateProfile(profile.id, { avatar_url: publicUrl });
            setProfile(updated);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar. Make sure the file is an image.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ========== COMPUTED VALUES ==========

    // Calculate exercise ranks
    const exerciseRankList: { exerciseId: string; exerciseName: string; rank: ExerciseRank; est1RM: number; bwMult: number }[] = [];
    const bodyweight = profile?.bodyweight || 0;
    const gender = (profile?.gender === 'male' || profile?.gender === 'female') ? profile.gender : 'male';

    if (bodyweight > 0) {
        Object.values(exerciseRecords).forEach(record => {
            if (record.estimated1RM > 0) {
                const { rank, bwMultiplier } = getExerciseRank(record.exerciseName, record.estimated1RM, bodyweight, gender);
                exerciseRankList.push({
                    exerciseId: record.exerciseId,
                    exerciseName: record.exerciseName,
                    rank,
                    est1RM: record.estimated1RM,
                    bwMult: bwMultiplier,
                });
            }
        });
    }

    // Sort by rank score descending
    const rankOrder: Record<ExerciseRank, number> = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Ember: 5, Diamond: 6 };
    exerciseRankList.sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);

    // Calculate Hunter Tier
    const tierResult = calculateHunterTier(exerciseRankList.map(r => r.rank));

    // Calculate badges
    const totalWorkouts = workouts.length;
    const earnedBadgeIds = checkBadgeEligibility({
        currentStreak: profile?.current_streak || 0,
        totalWorkouts,
        exerciseRanks: exerciseRankList,
        hunterTier: (tierResult.tier.tier as HunterTierName),
    });

    // XP rank info
    const xpRank = getRank(profile?.xp || 0);
    const nextRankInfo = getNextRank(profile?.xp || 0);

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
                        <div className="relative group">
                            <div
                                className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-xl overflow-hidden"
                                style={{
                                    boxShadow: tierResult.tier.tier !== 'E' ? `0 0 20px ${tierResult.tier.glowColor}` : undefined,
                                    borderColor: tierResult.tier.tier !== 'E' ? tierResult.tier.color : undefined,
                                }}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    profile.username?.[0]?.toUpperCase() || '?'
                                )}
                            </div>

                            {/* Hunter Tier badge overlay */}
                            {tierResult.tier.tier !== 'E' && (
                                <div
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                    style={{
                                        background: tierResult.tier.gradient,
                                        border: `2px solid ${tierResult.tier.color}`,
                                        boxShadow: `0 0 10px ${tierResult.tier.glowColor}`,
                                    }}
                                    title={`${tierResult.tier.tier}-Rank: ${tierResult.tier.title}`}
                                >
                                    {tierResult.tier.icon}
                                </div>
                            )}

                            {isOwnProfile && isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-bold">{uploadingAvatar ? '...' : 'Upload'}</span>
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                                </label>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            {isEditing ? (
                                <div className="space-y-3 max-w-sm">
                                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" className="w-full p-2 rounded bg-background border border-border" />
                                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio" className="w-full p-2 rounded bg-background border border-border" rows={2} />
                                    <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="Website" className="w-full p-2 rounded bg-background border border-border" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Bodyweight (kg)</label>
                                            <input type="number" value={editBodyweight} onChange={e => setEditBodyweight(e.target.value)} placeholder="75" className="w-full p-2 rounded bg-background border border-border" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Gender</label>
                                            <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full p-2 rounded bg-background border border-border">
                                                <option value="">Select...</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 py-2">
                                        <label className="text-sm font-bold text-foreground flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editIsPublic} onChange={e => setEditIsPublic(e.target.checked)} className="w-4 h-4 rounded border-border bg-secondary text-primary" />
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
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.username}</h1>
                                        {/* Inline earned badges */}
                                        {earnedBadgeIds.slice(0, 3).map(badgeId => {
                                            const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
                                            return badge ? (
                                                <span key={badgeId} title={badge.name} className="text-lg">{badge.icon}</span>
                                            ) : null;
                                        })}
                                        {profile.is_public === false && <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">Private</span>}
                                    </div>
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
                                        <div className="text-center">
                                            <div className="text-lg font-bold" style={{ color: tierResult.tier.color }}>{tierResult.tier.tier}</div>
                                            <div className="text-xs text-muted-foreground">Hunter</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4">
                                        {isOwnProfile ? (
                                            <div className="flex gap-2 justify-center md:justify-start">
                                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary">Edit Profile</button>
                                                <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 border border-red-900/30 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/10">Sign Out</button>
                                            </div>
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

            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto px-4 mt-4">
                <div className="flex border-b border-border">
                    {[
                        { id: 'overview' as const, label: '📊 Overview' },
                        { id: 'ranks' as const, label: '⚔️ Ranks' },
                        { id: 'workouts' as const, label: '💪 Workouts' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Hunter Rank Card */}
                        <HunterRankCard tierResult={tierResult} userName={profile.username} />

                        {/* XP & Streak Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1">XP Points</div>
                                <div className="text-2xl font-bold text-emerald-400">{profile.xp?.toLocaleString() || 0}</div>
                                <div className="text-xs text-slate-500 mt-1">Level {profile.level || 1} • {xpRank} League</div>
                                {nextRankInfo && (
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${nextRankInfo.progress * 100}%` }} />
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{nextRankInfo.remainingXP} XP to {nextRankInfo.nextRank.name}</div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1">Streak</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-orange-500">{profile.current_streak || 0}</span>
                                    <span className="text-lg">🔥</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Best: {profile.longest_streak || 0} • {profile.streak_freezes || 0} Freeze{(profile.streak_freezes || 0) !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Badge Showcase */}
                        <BadgeShowcase earnedBadges={earnedBadgeIds} />

                        {/* Bodyweight prompt */}
                        {isOwnProfile && !profile.bodyweight && (
                            <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 text-center">
                                <div className="text-amber-400 font-bold mb-1">⚠️ Set Your Bodyweight</div>
                                <p className="text-amber-400/70 text-sm mb-3">Strength ranks require your bodyweight to calculate. Edit your profile to add it.</p>
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold">
                                    Edit Profile
                                </button>
                            </div>
                        )}

                        {/* Leaderboard */}
                        <Leaderboard />
                    </div>
                )}

                {/* RANKS TAB */}
                {activeTab === 'ranks' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            ⚔️ Exercise Ranks
                            <span className="text-sm text-muted-foreground font-normal">({exerciseRankList.length} ranked)</span>
                        </h2>

                        {exerciseRankList.length === 0 && (
                            <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border">
                                <div className="text-4xl mb-4">🏋️</div>
                                <h3 className="font-bold text-foreground mb-2">No Ranks Yet</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                    {!profile.bodyweight
                                        ? 'Set your bodyweight in profile settings to see exercise ranks.'
                                        : 'Complete workouts and log your sets to earn exercise ranks!'}
                                </p>
                            </div>
                        )}

                        {exerciseRankList.map(item => (
                            <div key={item.exerciseId} className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
                                <ExerciseRankBadge rank={item.rank} size="md" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-foreground truncate">{item.exerciseName}</h3>
                                    <div className="text-xs text-muted-foreground">
                                        Est. 1RM: {Math.round(item.est1RM)} {profile.unit_system === 'imperial' ? 'lbs' : 'kg'} • {item.bwMult.toFixed(2)}x BW
                                    </div>
                                </div>
                                <ExerciseRankBadge rank={item.rank} size="sm" showLabel />
                            </div>
                        ))}
                    </div>
                )}

                {/* WORKOUTS TAB */}
                {activeTab === 'workouts' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Workouts</h2>
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
                )}
            </div>

            {/* Follow List Modal */}
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
