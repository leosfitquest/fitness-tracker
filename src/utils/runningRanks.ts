/**
 * Running Rank System — Distance-based ranks from Copper to Diamond.
 * Ranks are based on total lifetime distance and best single-run distance.
 *
 * Additionally, each run TYPE has its own rank progression.
 * If a user reaches Diamond in multiple categories (Lifting + Running),
 * they can achieve S-Tier status.
 */

import type { RunRank, RunSession } from '../types';

// ========== RUN RANK THRESHOLDS ==========

// Total lifetime distance thresholds (in km) for overall running rank
export const RUN_DISTANCE_THRESHOLDS: { rank: RunRank; minKm: number }[] = [
  { rank: 'Copper', minKm: 0 },
  { rank: 'Bronze', minKm: 25 },       // ~25km total
  { rank: 'Silver', minKm: 100 },      // ~100km total 
  { rank: 'Gold', minKm: 300 },        // ~300km total
  { rank: 'Platinum', minKm: 750 },    // ~750km total
  { rank: 'Diamond', minKm: 1500 },    // ~1500km total
];

// Single-run distance ranks (best single run)
export const SINGLE_RUN_THRESHOLDS: { rank: RunRank; minKm: number; label: string }[] = [
  { rank: 'Copper', minKm: 0, label: 'Starting Out' },
  { rank: 'Bronze', minKm: 3, label: '3K Runner' },
  { rank: 'Silver', minKm: 5, label: '5K Runner' },
  { rank: 'Gold', minKm: 10, label: '10K Runner' },
  { rank: 'Platinum', minKm: 21.1, label: 'Half Marathon' },
  { rank: 'Diamond', minKm: 42.2, label: 'Marathoner' },
];

// Pace-based rank (min/km — lower is better)
export const PACE_THRESHOLDS: { rank: RunRank; maxPace: number; label: string }[] = [
  { rank: 'Copper', maxPace: 999, label: 'Getting Moving' },
  { rank: 'Bronze', maxPace: 8.0, label: 'Jogger' },
  { rank: 'Silver', maxPace: 6.5, label: 'Runner' },
  { rank: 'Gold', maxPace: 5.5, label: 'Fast Runner' },
  { rank: 'Platinum', maxPace: 4.5, label: 'Competitive' },
  { rank: 'Diamond', maxPace: 3.5, label: 'Elite Pace' },
];

export const RUN_RANK_COLORS: Record<RunRank, string> = {
  Copper:   '#B87333',
  Bronze:   '#CD7F32',
  Silver:   '#C0C0C0',
  Gold:     '#FFD700',
  Platinum: '#E5E4E2',
  Diamond:  '#B9F2FF',
};

export const RUN_RANK_GRADIENTS: Record<RunRank, string> = {
  Copper:   'linear-gradient(135deg, #B87333, #8B5E3C)',
  Bronze:   'linear-gradient(135deg, #CD7F32, #8B5E3C)',
  Silver:   'linear-gradient(135deg, #C0C0C0, #8C8C8C)',
  Gold:     'linear-gradient(135deg, #FFD700, #B8860B)',
  Platinum: 'linear-gradient(135deg, #E5E4E2, #A0A0A0)',
  Diamond:  'linear-gradient(135deg, #B9F2FF, #7DF9FF, #00BFFF)',
};

export const RUN_RANK_ICONS: Record<RunRank, string> = {
  Copper:   '🪙',
  Bronze:   '🥉',
  Silver:   '🥈',
  Gold:     '🥇',
  Platinum: '💠',
  Diamond:  '💎',
};

export const RUN_RANK_SCORES: Record<RunRank, number> = {
  Copper:   0,
  Bronze:   1,
  Silver:   2,
  Gold:     3,
  Platinum: 4,
  Diamond:  5,
};

// ========== CALCULATION ==========

export interface RunRankResult {
  overallRank: RunRank;
  totalDistanceKm: number;
  bestSingleRunKm: number;
  bestPaceMinKm: number;
  totalRuns: number;
  distanceRank: RunRank;
  singleRunRank: RunRank;
  paceRank: RunRank;
  avgDistanceKm: number;
  totalDurationSeconds: number;
}

export function calculateRunRanks(sessions: RunSession[]): RunRankResult {
  if (!sessions || sessions.length === 0) {
    return {
      overallRank: 'Copper',
      totalDistanceKm: 0,
      bestSingleRunKm: 0,
      bestPaceMinKm: 0,
      totalRuns: 0,
      distanceRank: 'Copper',
      singleRunRank: 'Copper',
      paceRank: 'Copper',
      avgDistanceKm: 0,
      totalDurationSeconds: 0,
    };
  }

  const totalDistanceKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  const bestSingleRunKm = Math.max(...sessions.map(s => s.distanceKm));
  const bestPaceMinKm = Math.min(...sessions.filter(s => s.avgPaceMinKm > 0).map(s => s.avgPaceMinKm)) || 0;
  const totalDurationSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const avgDistanceKm = totalDistanceKm / sessions.length;

  // Calculate individual ranks
  let distanceRank: RunRank = 'Copper';
  for (let i = RUN_DISTANCE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalDistanceKm >= RUN_DISTANCE_THRESHOLDS[i].minKm) {
      distanceRank = RUN_DISTANCE_THRESHOLDS[i].rank;
      break;
    }
  }

  let singleRunRank: RunRank = 'Copper';
  for (let i = SINGLE_RUN_THRESHOLDS.length - 1; i >= 0; i--) {
    if (bestSingleRunKm >= SINGLE_RUN_THRESHOLDS[i].minKm) {
      singleRunRank = SINGLE_RUN_THRESHOLDS[i].rank;
      break;
    }
  }

  let paceRank: RunRank = 'Copper';
  if (bestPaceMinKm > 0) {
    for (let i = PACE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (bestPaceMinKm <= PACE_THRESHOLDS[i].maxPace) {
        paceRank = PACE_THRESHOLDS[i].rank;
        break;
      }
    }
  }

  // Overall = average of all three rank scores
  const avgScore = (RUN_RANK_SCORES[distanceRank] + RUN_RANK_SCORES[singleRunRank] + RUN_RANK_SCORES[paceRank]) / 3;
  
  let overallRank: RunRank = 'Copper';
  if (avgScore >= 4.5) overallRank = 'Diamond';
  else if (avgScore >= 3.5) overallRank = 'Platinum';
  else if (avgScore >= 2.5) overallRank = 'Gold';
  else if (avgScore >= 1.5) overallRank = 'Silver';
  else if (avgScore >= 0.5) overallRank = 'Bronze';

  return {
    overallRank,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    bestSingleRunKm: Math.round(bestSingleRunKm * 100) / 100,
    bestPaceMinKm: Math.round(bestPaceMinKm * 100) / 100,
    totalRuns: sessions.length,
    distanceRank,
    singleRunRank,
    paceRank,
    avgDistanceKm: Math.round(avgDistanceKm * 100) / 100,
    totalDurationSeconds,
  };
}

/**
 * Get progress toward next distance rank
 */
export function getRunDistanceProgress(totalKm: number): {
  currentRank: RunRank;
  nextRank: RunRank | null;
  progress: number;
  nextThresholdKm: number | null;
} {
  let currentIdx = 0;
  for (let i = RUN_DISTANCE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalKm >= RUN_DISTANCE_THRESHOLDS[i].minKm) {
      currentIdx = i;
      break;
    }
  }

  if (currentIdx >= RUN_DISTANCE_THRESHOLDS.length - 1) {
    return { currentRank: 'Diamond', nextRank: null, progress: 1, nextThresholdKm: null };
  }

  const current = RUN_DISTANCE_THRESHOLDS[currentIdx];
  const next = RUN_DISTANCE_THRESHOLDS[currentIdx + 1];
  const range = next.minKm - current.minKm;
  const progress = range > 0 ? Math.min(1, (totalKm - current.minKm) / range) : 1;

  return {
    currentRank: current.rank,
    nextRank: next.rank,
    progress,
    nextThresholdKm: next.minKm,
  };
}

/**
 * Format pace as M:SS min/km
 */
export function formatPace(paceMinKm: number): string {
  if (!paceMinKm || paceMinKm <= 0 || !isFinite(paceMinKm)) return '--:--';
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimate calories burned during a run.
 * Rough MET-based estimate: ~1 kcal/kg/km for running.
 */
export function estimateRunCalories(distanceKm: number, bodyweightKg: number = 70): number {
  return Math.round(distanceKm * bodyweightKg * 1.036);
}
