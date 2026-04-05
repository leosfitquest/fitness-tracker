import type { WorkoutSessionLog } from '../types';

export const XP_CONFIG = {
    BASE_WORKOUT_XP: 100,
    XP_PER_SET: 5,
    PROGRESS_BONUS: 50, // Per exercise with improvement
    DAILY_CAP: 1000,
};

export const RANKS = [
    { name: 'Bronze', minXP: 0 },
    { name: 'Silver', minXP: 1000 },
    { name: 'Gold', minXP: 5000 },
    { name: 'Platinum', minXP: 15000 },
    { name: 'Ember', minXP: 30000 },
    { name: 'Diamond', minXP: 60000 },
] as const;

export function calculateSessionXP(
    session: WorkoutSessionLog,
    previousBestMap?: Record<string, { weight: number; reps: number }>
): { totalXP: number; breakdown: { base: number; sets: number; progress: number } } {
    const base = XP_CONFIG.BASE_WORKOUT_XP;
    const setsXP = session.totalSetsCompleted * XP_CONFIG.XP_PER_SET;

    let progressXP = 0;

    // Calculate Progress Bonus
    // Use existing PRs from the session log if available (calculated on frontend)
    if (session.newPRs && session.newPRs.length > 0) {
        progressXP = session.newPRs.length * XP_CONFIG.PROGRESS_BONUS;
    } else if (previousBestMap) {
        session.exercises.forEach(ex => {
            const prevBest = previousBestMap[ex.exerciseId];
            if (!prevBest) return;

            // Check if any set in this session exceeded previous best weight or reps at same weight
            const improved = ex.sets.some(set => {
                if (!set.completed || !set.weight || !set.reps) return false;
                // Simple logic: Heavier weight OR same weight + more reps
                return (set.weight > prevBest.weight) || (set.weight === prevBest.weight && set.reps > prevBest.reps);
            });

            if (improved) {
                progressXP += XP_CONFIG.PROGRESS_BONUS;
            }
        });
    }

    const rawTotal = base + setsXP + progressXP;
    // Apply Cap
    const totalXP = Math.min(rawTotal, XP_CONFIG.DAILY_CAP);

    return {
        totalXP,
        breakdown: {
            base,
            sets: setsXP,
            progress: progressXP
        }
    };
}

export function calculateNewStreak(
    currentStreak: number,
    lastWorkoutDate: string | null | undefined, // ISO string
    workoutDate: Date = new Date()
): number {
    if (!lastWorkoutDate) return 1;

    const last = new Date(lastWorkoutDate);
    const current = new Date(workoutDate);

    // Reset time part for dates to compare just days
    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(current.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Same day, streak doesn't change
        return currentStreak;
    } else if (diffDays <= 7) {
        // Within 7 days window (Forgiving Streak)
        return currentStreak + 1;
    } else {
        // Missed the week window
        return 1; // Reset to 1 (counting today)
    }
}

export function getRank(xp: number): string {
    // Find highest rank where xp >= minXP
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXP) return RANKS[i].name;
    }
    return RANKS[0].name;
}

export function getNextRank(xp: number) {
    for (let i = 0; i < RANKS.length; i++) {
        if (xp < RANKS[i].minXP) {
            return {
                nextRank: RANKS[i],
                remainingXP: RANKS[i].minXP - xp,
                progress: (xp - RANKS[i - 1].minXP) / (RANKS[i].minXP - RANKS[i - 1].minXP)
            };
        }
    }
    return null; // Max rank
}

/**
 * Calculate level from total XP.
 * Every 500 XP = 1 level. Minimum level 1.
 */
export function calculateLevel(xp: number): number {
    return Math.max(1, Math.floor(xp / 500) + 1);
}

