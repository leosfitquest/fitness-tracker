/**
 * Hunter Tier System — Solo Leveling inspired overall ranking.
 * Derived from per-exercise ranks (Bronze → Diamond).
 */

import { type ExerciseRank, RANK_SCORES } from './strengthStandards';

export type HunterTierName = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface HunterTierInfo {
  tier: HunterTierName;
  title: string;
  color: string;
  glowColor: string;
  gradient: string;
  icon: string;
  minAvgScore: number;
  minDiamondPercent: number;
  minExercises: number;
  description: string;
}

export const HUNTER_TIERS: HunterTierInfo[] = [
  {
    tier: 'E', title: 'Beginner Hunter', color: '#6B7280',
    glowColor: 'rgba(107, 114, 128, 0.3)', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)',
    icon: '🗡️', minAvgScore: 0, minDiamondPercent: 0, minExercises: 0,
    description: 'Every hunter starts here. Keep training to awaken your true power.',
  },
  {
    tier: 'D', title: 'Apprentice Hunter', color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    icon: '⚔️', minAvgScore: 1.5, minDiamondPercent: 0, minExercises: 5,
    description: 'You have begun to awaken. The dungeons await.',
  },
  {
    tier: 'C', title: 'Fighter', color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.4)', gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
    icon: '🛡️', minAvgScore: 2.5, minDiamondPercent: 0, minExercises: 10,
    description: 'A capable fighter. You can handle most challenges.',
  },
  {
    tier: 'B', title: 'Elite Hunter', color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.4)', gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    icon: '⚡', minAvgScore: 3.5, minDiamondPercent: 0, minExercises: 15,
    description: 'Among the elite. Feared by most, respected by all.',
  },
  {
    tier: 'A', title: 'National-Level Hunter', color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)', gradient: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
    icon: '👑', minAvgScore: 4.5, minDiamondPercent: 75, minExercises: 25,
    description: 'A legend among hunters. Nations seek your strength.',
  },
  {
    tier: 'S', title: 'Shadow Monarch', color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)', gradient: 'linear-gradient(135deg, #EF4444, #B91C1C, #7F1D1D)',
    icon: '🔱', minAvgScore: 5.5, minDiamondPercent: 95, minExercises: 40,
    description: 'The pinnacle. You stand above all others. Arise.',
  },
];

export interface HunterTierResult {
  tier: HunterTierInfo;
  avgScore: number;
  diamondPercent: number;
  totalExercises: number;
  rankDistribution: Record<ExerciseRank, number>;
}

/**
 * Calculate the Hunter Tier from an array of exercise ranks.
 */
export function calculateHunterTier(exerciseRanks: ExerciseRank[]): HunterTierResult {
  const totalExercises = exerciseRanks.length;

  // Rank distribution
  const rankDistribution: Record<ExerciseRank, number> = {
    Bronze: 0, Silver: 0, Gold: 0, Platinum: 0, Ember: 0, Diamond: 0,
  };
  let totalScore = 0;

  for (const rank of exerciseRanks) {
    rankDistribution[rank]++;
    totalScore += RANK_SCORES[rank];
  }

  const avgScore = totalExercises > 0 ? totalScore / totalExercises : 0;
  const diamondPercent = totalExercises > 0 ? (rankDistribution.Diamond / totalExercises) * 100 : 0;

  // Find the highest tier that matches all requirements
  let matchedTier = HUNTER_TIERS[0]; // Default to E-Rank

  for (let i = HUNTER_TIERS.length - 1; i >= 0; i--) {
    const t = HUNTER_TIERS[i];
    if (
      avgScore >= t.minAvgScore &&
      diamondPercent >= t.minDiamondPercent &&
      totalExercises >= t.minExercises
    ) {
      matchedTier = t;
      break;
    }
  }

  return {
    tier: matchedTier,
    avgScore,
    diamondPercent,
    totalExercises,
    rankDistribution,
  };
}

/**
 * Get progress toward the next Hunter Tier.
 */
export function getHunterTierProgress(result: HunterTierResult): {
  nextTier: HunterTierInfo | null;
  scoreProgress: number;
  diamondProgress: number;
  exerciseProgress: number;
  overallProgress: number;
  bottleneck: string;
} {
  const currentIdx = HUNTER_TIERS.findIndex(t => t.tier === result.tier.tier);
  if (currentIdx >= HUNTER_TIERS.length - 1) {
    return { nextTier: null, scoreProgress: 1, diamondProgress: 1, exerciseProgress: 1, overallProgress: 1, bottleneck: 'Max Tier' };
  }

  const next = HUNTER_TIERS[currentIdx + 1];
  const current = HUNTER_TIERS[currentIdx];

  const scoreRange = next.minAvgScore - current.minAvgScore;
  const scoreProgress = scoreRange > 0
    ? Math.min(1, Math.max(0, (result.avgScore - current.minAvgScore) / scoreRange))
    : 1;

  const diamondRange = next.minDiamondPercent - current.minDiamondPercent;
  const diamondProgress = diamondRange > 0
    ? Math.min(1, Math.max(0, (result.diamondPercent - current.minDiamondPercent) / diamondRange))
    : 1;

  const exerciseRange = next.minExercises - current.minExercises;
  const exerciseProgress = exerciseRange > 0
    ? Math.min(1, Math.max(0, (result.totalExercises - current.minExercises) / exerciseRange))
    : 1;

  const overallProgress = Math.min(scoreProgress, diamondProgress, exerciseProgress);

  let bottleneck = 'Average Rank Score';
  if (diamondProgress < scoreProgress && diamondProgress < exerciseProgress) bottleneck = 'Diamond Exercises %';
  if (exerciseProgress < scoreProgress && exerciseProgress < diamondProgress) bottleneck = 'Total Exercises';

  return { nextTier: next, scoreProgress, diamondProgress, exerciseProgress, overallProgress, bottleneck };
}

/**
 * Get tier badge styling info.
 */
export function getTierBadgeStyle(tierName: HunterTierName): {
  borderColor: string;
  glowCSS: string;
  textColor: string;
  bgGradient: string;
  animationClass: string;
} {
  const tier = HUNTER_TIERS.find(t => t.tier === tierName) || HUNTER_TIERS[0];

  let animationClass = '';
  if (tierName === 'S') animationClass = 'animate-s-rank-pulse';
  else if (tierName === 'A') animationClass = 'animate-a-rank-glow';
  else if (tierName === 'B') animationClass = 'animate-b-rank-shimmer';

  return {
    borderColor: tier.color,
    glowCSS: `0 0 20px ${tier.glowColor}, 0 0 40px ${tier.glowColor}`,
    textColor: tier.color,
    bgGradient: tier.gradient,
    animationClass,
  };
}

// ========== BADGE SYSTEM ==========

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  animationClass: string;
  condition: string; // human-readable condition
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'inferno', name: 'Inferno', description: '30-day workout streak',
    icon: '🔥', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #F97316)',
    animationClass: 'animate-badge-flame', condition: '30-day streak',
  },
  {
    id: 'lightning', name: 'Lightning', description: '100 workouts completed',
    icon: '⚡', color: '#FBBF24', gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    animationClass: 'animate-badge-electric', condition: '100 workouts',
  },
  {
    id: 'diamond_hands', name: 'Diamond Hands', description: 'First Diamond exercise rank',
    icon: '💎', color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
    animationClass: 'animate-badge-sparkle', condition: '1 Diamond rank',
  },
  {
    id: 'champion', name: 'Champion', description: 'Top 3 on leaderboard',
    icon: '🏆', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    animationClass: 'animate-badge-bounce', condition: 'Top 3 leaderboard',
  },
  {
    id: 'crown', name: 'Crown', description: 'Achieved S-Rank Hunter Tier',
    icon: '👑', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    animationClass: 'animate-badge-crown', condition: 'S-Rank Hunter',
  },
  {
    id: 'rising_star', name: 'Rising Star', description: '10 exercises ranked',
    icon: '🌟', color: '#A855F7', gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    animationClass: 'animate-badge-twinkle', condition: '10 ranked exercises',
  },
  {
    id: 'iron_will', name: 'Iron Will', description: '5 exercises at Platinum or higher',
    icon: '💪', color: '#E5E4E2', gradient: 'linear-gradient(135deg, #E5E4E2, #9CA3AF)',
    animationClass: 'animate-badge-shine', condition: '5 Platinum+ exercises',
  },
  {
    id: 'perfectionist', name: 'Perfectionist', description: 'All sets completed in 10 sessions',
    icon: '🎯', color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
    animationClass: 'animate-badge-pulse', condition: '10 perfect sessions',
  },
  {
    id: 'awakened', name: 'Awakened', description: 'First Hunter Tier upgrade',
    icon: '🌋', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    animationClass: 'animate-badge-erupt', condition: 'First tier-up',
  },
];

/**
 * Check which badges a user has earned based on their stats.
 */
export function checkBadgeEligibility(stats: {
  currentStreak: number;
  totalWorkouts: number;
  exerciseRanks: { rank: ExerciseRank }[];
  hunterTier: HunterTierName;
  leaderboardPosition?: number;
  perfectSessions?: number;
  previousHunterTier?: HunterTierName;
}): string[] {
  const earned: string[] = [];

  if (stats.currentStreak >= 30) earned.push('inferno');
  if (stats.totalWorkouts >= 100) earned.push('lightning');
  if (stats.exerciseRanks.some(r => r.rank === 'Diamond')) earned.push('diamond_hands');
  if (stats.leaderboardPosition !== undefined && stats.leaderboardPosition <= 3) earned.push('champion');
  if (stats.hunterTier === 'S') earned.push('crown');
  if (stats.exerciseRanks.length >= 10) earned.push('rising_star');
  if (stats.exerciseRanks.filter(r => ['Platinum', 'Ember', 'Diamond'].includes(r.rank)).length >= 5) earned.push('iron_will');
  if (stats.perfectSessions !== undefined && stats.perfectSessions >= 10) earned.push('perfectionist');
  if (stats.previousHunterTier && stats.previousHunterTier !== stats.hunterTier) earned.push('awakened');

  return earned;
}
