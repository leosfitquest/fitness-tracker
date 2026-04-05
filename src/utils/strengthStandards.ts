/**
 * Strength Standards — 50 exercises with bodyweight multiplier thresholds.
 * Based on established strength standards (Symmetric Strength / ExRx / StrengthLevel).
 * 
 * Each exercise has male & female thresholds mapping to ranks:
 * Bronze → Silver → Gold → Platinum → Ember → Diamond
 */

export type ExerciseRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Ember' | 'Diamond';

export type StrengthStandard = {
  key: string;           // Unique key for matching
  name: string;          // Display name
  aliases: string[];     // Alternative names for fuzzy matching
  category: string;      // Muscle group
  male: number[];        // [silver, gold, platinum, ember, diamond] thresholds (BW multipliers)
  female: number[];      // Same for female
};

// Thresholds represent the MINIMUM BW multiplier to reach that rank.
// [0] = Silver, [1] = Gold, [2] = Platinum, [3] = Ember, [4] = Diamond
// Below [0] = Bronze

export const STRENGTH_STANDARDS: StrengthStandard[] = [
  // ========== CHEST (6) ==========
  {
    key: 'bench_press', name: 'Barbell Bench Press',
    aliases: ['bench press', 'flat bench', 'barbell bench'],
    category: 'chest',
    male:   [0.50, 0.75, 1.00, 1.25, 1.50],
    female: [0.25, 0.40, 0.55, 0.70, 0.90],
  },
  {
    key: 'incline_bench', name: 'Incline Bench Press',
    aliases: ['incline bench', 'incline barbell bench', 'incline press'],
    category: 'chest',
    male:   [0.40, 0.65, 0.85, 1.10, 1.35],
    female: [0.20, 0.35, 0.50, 0.65, 0.80],
  },
  {
    key: 'dumbbell_bench', name: 'Dumbbell Bench Press',
    aliases: ['dumbbell bench', 'db bench', 'dumbbell press flat'],
    category: 'chest',
    male:   [0.20, 0.35, 0.50, 0.65, 0.80],
    female: [0.10, 0.20, 0.30, 0.40, 0.55],
  },
  {
    key: 'dumbbell_fly', name: 'Dumbbell Fly',
    aliases: ['dumbbell fly', 'dumbbell flye', 'chest fly', 'db fly'],
    category: 'chest',
    male:   [0.10, 0.18, 0.28, 0.38, 0.50],
    female: [0.05, 0.10, 0.18, 0.25, 0.35],
  },
  {
    key: 'cable_crossover', name: 'Cable Crossover',
    aliases: ['cable crossover', 'cable fly', 'cable chest fly'],
    category: 'chest',
    male:   [0.10, 0.18, 0.28, 0.38, 0.50],
    female: [0.05, 0.10, 0.18, 0.25, 0.35],
  },
  {
    key: 'push_up', name: 'Push-Up',
    aliases: ['push up', 'pushup', 'push-up'],
    category: 'chest',
    male:   [0.50, 0.60, 0.70, 0.80, 0.90],
    female: [0.30, 0.45, 0.55, 0.65, 0.75],
  },

  // ========== BACK (7) ==========
  {
    key: 'deadlift', name: 'Deadlift',
    aliases: ['deadlift', 'conventional deadlift', 'barbell deadlift'],
    category: 'back',
    male:   [1.00, 1.25, 1.75, 2.25, 2.75],
    female: [0.60, 0.85, 1.15, 1.50, 1.85],
  },
  {
    key: 'barbell_row', name: 'Barbell Row',
    aliases: ['barbell row', 'bent over row', 'bb row', 'bent-over row'],
    category: 'back',
    male:   [0.50, 0.65, 0.85, 1.00, 1.20],
    female: [0.30, 0.40, 0.55, 0.70, 0.85],
  },
  {
    key: 'pull_up', name: 'Pull-Up',
    aliases: ['pull up', 'pullup', 'pull-up', 'chin up', 'chinup'],
    category: 'back',
    male:   [0.70, 0.85, 1.00, 1.20, 1.50],
    female: [0.40, 0.60, 0.75, 0.90, 1.10],
  },
  {
    key: 'lat_pulldown', name: 'Lat Pulldown',
    aliases: ['lat pulldown', 'lat pull down', 'cable pulldown', 'wide grip pulldown'],
    category: 'back',
    male:   [0.45, 0.60, 0.80, 1.00, 1.20],
    female: [0.25, 0.40, 0.55, 0.70, 0.85],
  },
  {
    key: 'seated_cable_row', name: 'Seated Cable Row',
    aliases: ['seated cable row', 'cable row', 'seated row'],
    category: 'back',
    male:   [0.45, 0.60, 0.80, 1.00, 1.20],
    female: [0.25, 0.40, 0.55, 0.70, 0.85],
  },
  {
    key: 't_bar_row', name: 'T-Bar Row',
    aliases: ['t-bar row', 't bar row', 'tbar row', 'landmine row'],
    category: 'back',
    male:   [0.40, 0.60, 0.80, 1.00, 1.20],
    female: [0.25, 0.35, 0.50, 0.65, 0.80],
  },
  {
    key: 'dumbbell_row', name: 'Dumbbell Row',
    aliases: ['dumbbell row', 'db row', 'one arm row', 'single arm row'],
    category: 'back',
    male:   [0.20, 0.30, 0.45, 0.60, 0.75],
    female: [0.10, 0.20, 0.30, 0.40, 0.55],
  },

  // ========== LEGS (8) ==========
  {
    key: 'squat', name: 'Barbell Squat',
    aliases: ['squat', 'back squat', 'barbell squat', 'barbell back squat'],
    category: 'legs',
    male:   [0.75, 1.00, 1.50, 1.75, 2.25],
    female: [0.50, 0.70, 1.00, 1.25, 1.60],
  },
  {
    key: 'front_squat', name: 'Front Squat',
    aliases: ['front squat', 'barbell front squat'],
    category: 'legs',
    male:   [0.60, 0.85, 1.20, 1.50, 1.85],
    female: [0.40, 0.55, 0.80, 1.05, 1.35],
  },
  {
    key: 'leg_press', name: 'Leg Press',
    aliases: ['leg press', '45 degree leg press', 'machine leg press'],
    category: 'legs',
    male:   [1.50, 2.00, 2.75, 3.50, 4.50],
    female: [1.00, 1.50, 2.00, 2.75, 3.50],
  },
  {
    key: 'romanian_deadlift', name: 'Romanian Deadlift',
    aliases: ['romanian deadlift', 'rdl', 'stiff leg deadlift', 'stiff-leg deadlift'],
    category: 'legs',
    male:   [0.60, 0.85, 1.15, 1.50, 1.85],
    female: [0.40, 0.55, 0.80, 1.05, 1.30],
  },
  {
    key: 'leg_curl', name: 'Leg Curl',
    aliases: ['leg curl', 'hamstring curl', 'lying leg curl', 'seated leg curl'],
    category: 'legs',
    male:   [0.25, 0.40, 0.55, 0.70, 0.90],
    female: [0.15, 0.25, 0.35, 0.50, 0.65],
  },
  {
    key: 'leg_extension', name: 'Leg Extension',
    aliases: ['leg extension', 'quad extension', 'machine leg extension'],
    category: 'legs',
    male:   [0.30, 0.45, 0.60, 0.80, 1.00],
    female: [0.20, 0.30, 0.45, 0.60, 0.75],
  },
  {
    key: 'calf_raise', name: 'Calf Raise',
    aliases: ['calf raise', 'standing calf raise', 'seated calf raise', 'calf press'],
    category: 'legs',
    male:   [0.50, 0.75, 1.00, 1.50, 2.00],
    female: [0.35, 0.55, 0.75, 1.10, 1.50],
  },
  {
    key: 'bulgarian_split_squat', name: 'Bulgarian Split Squat',
    aliases: ['bulgarian split squat', 'split squat', 'rear foot elevated split squat'],
    category: 'legs',
    male:   [0.30, 0.45, 0.65, 0.85, 1.10],
    female: [0.20, 0.30, 0.45, 0.60, 0.80],
  },

  // ========== SHOULDERS (5) ==========
  {
    key: 'overhead_press', name: 'Overhead Press',
    aliases: ['overhead press', 'ohp', 'military press', 'barbell shoulder press', 'standing press'],
    category: 'shoulders',
    male:   [0.35, 0.50, 0.65, 0.85, 1.00],
    female: [0.20, 0.30, 0.40, 0.55, 0.70],
  },
  {
    key: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press',
    aliases: ['dumbbell shoulder press', 'db shoulder press', 'dumbbell press', 'seated dumbbell press', 'arnold press'],
    category: 'shoulders',
    male:   [0.15, 0.25, 0.35, 0.45, 0.60],
    female: [0.08, 0.15, 0.22, 0.30, 0.40],
  },
  {
    key: 'lateral_raise', name: 'Lateral Raise',
    aliases: ['lateral raise', 'side raise', 'side lateral raise', 'dumbbell lateral raise'],
    category: 'shoulders',
    male:   [0.06, 0.10, 0.15, 0.20, 0.28],
    female: [0.03, 0.06, 0.10, 0.14, 0.20],
  },
  {
    key: 'face_pull', name: 'Face Pull',
    aliases: ['face pull', 'cable face pull', 'rope face pull'],
    category: 'shoulders',
    male:   [0.15, 0.25, 0.35, 0.45, 0.60],
    female: [0.08, 0.15, 0.22, 0.30, 0.40],
  },
  {
    key: 'upright_row', name: 'Upright Row',
    aliases: ['upright row', 'barbell upright row', 'cable upright row'],
    category: 'shoulders',
    male:   [0.25, 0.40, 0.55, 0.70, 0.90],
    female: [0.15, 0.25, 0.35, 0.50, 0.65],
  },

  // ========== ARMS (8) ==========
  {
    key: 'barbell_curl', name: 'Barbell Curl',
    aliases: ['barbell curl', 'bb curl', 'straight bar curl', 'ez bar curl', 'ez curl'],
    category: 'arms',
    male:   [0.25, 0.40, 0.55, 0.70, 0.85],
    female: [0.15, 0.22, 0.30, 0.40, 0.55],
  },
  {
    key: 'dumbbell_curl', name: 'Dumbbell Curl',
    aliases: ['dumbbell curl', 'db curl', 'bicep curl', 'dumbbell bicep curl'],
    category: 'arms',
    male:   [0.10, 0.15, 0.25, 0.35, 0.45],
    female: [0.05, 0.10, 0.15, 0.22, 0.30],
  },
  {
    key: 'hammer_curl', name: 'Hammer Curl',
    aliases: ['hammer curl', 'dumbbell hammer curl', 'neutral grip curl'],
    category: 'arms',
    male:   [0.10, 0.17, 0.27, 0.37, 0.50],
    female: [0.05, 0.10, 0.17, 0.25, 0.32],
  },
  {
    key: 'preacher_curl', name: 'Preacher Curl',
    aliases: ['preacher curl', 'scott curl', 'ez preacher curl'],
    category: 'arms',
    male:   [0.20, 0.30, 0.45, 0.60, 0.75],
    female: [0.10, 0.18, 0.28, 0.38, 0.50],
  },
  {
    key: 'tricep_pushdown', name: 'Tricep Pushdown',
    aliases: ['tricep pushdown', 'cable pushdown', 'rope pushdown', 'tricep pressdown'],
    category: 'arms',
    male:   [0.20, 0.30, 0.45, 0.60, 0.75],
    female: [0.10, 0.18, 0.28, 0.38, 0.50],
  },
  {
    key: 'skull_crusher', name: 'Skull Crusher',
    aliases: ['skull crusher', 'lying tricep extension', 'french press', 'skullcrusher'],
    category: 'arms',
    male:   [0.15, 0.25, 0.40, 0.55, 0.70],
    female: [0.08, 0.15, 0.25, 0.35, 0.45],
  },
  {
    key: 'close_grip_bench', name: 'Close-Grip Bench Press',
    aliases: ['close grip bench', 'close-grip bench press', 'cgbp', 'narrow grip bench'],
    category: 'arms',
    male:   [0.45, 0.65, 0.85, 1.10, 1.35],
    female: [0.22, 0.35, 0.50, 0.65, 0.80],
  },
  {
    key: 'dip', name: 'Dip',
    aliases: ['dip', 'dips', 'parallel bar dip', 'chest dip', 'tricep dip'],
    category: 'arms',
    male:   [0.70, 0.85, 1.05, 1.30, 1.60],
    female: [0.40, 0.55, 0.70, 0.90, 1.15],
  },

  // ========== CORE (4) ==========
  {
    key: 'hanging_leg_raise', name: 'Hanging Leg Raise',
    aliases: ['hanging leg raise', 'hanging knee raise', 'leg raise'],
    category: 'core',
    male:   [0.30, 0.50, 0.65, 0.80, 1.00],
    female: [0.20, 0.35, 0.50, 0.65, 0.80],
  },
  {
    key: 'cable_crunch', name: 'Cable Crunch',
    aliases: ['cable crunch', 'kneeling cable crunch', 'rope crunch'],
    category: 'core',
    male:   [0.25, 0.40, 0.55, 0.75, 0.95],
    female: [0.15, 0.25, 0.40, 0.55, 0.70],
  },
  {
    key: 'ab_wheel', name: 'Ab Wheel Rollout',
    aliases: ['ab wheel', 'ab rollout', 'ab wheel rollout', 'roller'],
    category: 'core',
    male:   [0.40, 0.55, 0.70, 0.85, 1.00],
    female: [0.25, 0.40, 0.55, 0.70, 0.85],
  },
  {
    key: 'weighted_plank', name: 'Weighted Plank',
    aliases: ['plank', 'weighted plank', 'front plank'],
    category: 'core',
    male:   [0.10, 0.20, 0.35, 0.50, 0.70],
    female: [0.05, 0.12, 0.22, 0.35, 0.50],
  },

  // ========== GLUTES (3) ==========
  {
    key: 'hip_thrust', name: 'Hip Thrust',
    aliases: ['hip thrust', 'barbell hip thrust', 'glute bridge barbell'],
    category: 'glutes',
    male:   [0.75, 1.00, 1.50, 2.00, 2.50],
    female: [0.50, 0.75, 1.10, 1.50, 2.00],
  },
  {
    key: 'glute_bridge', name: 'Glute Bridge',
    aliases: ['glute bridge', 'barbell glute bridge', 'bridge'],
    category: 'glutes',
    male:   [0.50, 0.75, 1.00, 1.40, 1.80],
    female: [0.35, 0.55, 0.80, 1.10, 1.50],
  },
  {
    key: 'cable_kickback', name: 'Cable Kickback',
    aliases: ['cable kickback', 'glute kickback', 'cable glute kickback'],
    category: 'glutes',
    male:   [0.08, 0.14, 0.22, 0.30, 0.40],
    female: [0.05, 0.10, 0.15, 0.22, 0.30],
  },

  // ========== OLYMPIC / POWER (3) ==========
  {
    key: 'clean', name: 'Clean',
    aliases: ['clean', 'power clean', 'squat clean', 'barbell clean'],
    category: 'compound',
    male:   [0.60, 0.80, 1.05, 1.30, 1.60],
    female: [0.35, 0.50, 0.70, 0.90, 1.15],
  },
  {
    key: 'snatch', name: 'Snatch',
    aliases: ['snatch', 'power snatch', 'squat snatch', 'barbell snatch'],
    category: 'compound',
    male:   [0.45, 0.65, 0.85, 1.05, 1.30],
    female: [0.25, 0.40, 0.55, 0.70, 0.90],
  },
  {
    key: 'clean_and_press', name: 'Clean and Press',
    aliases: ['clean and press', 'clean & press', 'clean and jerk', 'clean & jerk'],
    category: 'compound',
    male:   [0.50, 0.70, 0.90, 1.15, 1.45],
    female: [0.30, 0.45, 0.60, 0.80, 1.00],
  },

  // ========== COMPOUND VARIATIONS (6) ==========
  {
    key: 'farmer_walk', name: "Farmer's Walk",
    aliases: ['farmer walk', "farmer's walk", 'farmers walk', 'farmer carry'],
    category: 'compound',
    male:   [0.50, 0.75, 1.00, 1.25, 1.50],
    female: [0.30, 0.50, 0.70, 0.90, 1.15],
  },
  {
    key: 'rack_pull', name: 'Rack Pull',
    aliases: ['rack pull', 'rack deadlift', 'block pull'],
    category: 'back',
    male:   [1.10, 1.40, 1.90, 2.40, 3.00],
    female: [0.70, 0.95, 1.30, 1.65, 2.10],
  },
  {
    key: 'pendlay_row', name: 'Pendlay Row',
    aliases: ['pendlay row', 'strict row', 'dead stop row'],
    category: 'back',
    male:   [0.45, 0.60, 0.80, 1.00, 1.20],
    female: [0.25, 0.40, 0.55, 0.70, 0.85],
  },
  {
    key: 'sumo_deadlift', name: 'Sumo Deadlift',
    aliases: ['sumo deadlift', 'sumo dead', 'sumo pull'],
    category: 'legs',
    male:   [1.00, 1.25, 1.75, 2.25, 2.75],
    female: [0.60, 0.85, 1.15, 1.50, 1.85],
  },
  {
    key: 'trap_bar_deadlift', name: 'Trap Bar Deadlift',
    aliases: ['trap bar deadlift', 'hex bar deadlift', 'hex deadlift', 'trap bar'],
    category: 'legs',
    male:   [1.00, 1.30, 1.80, 2.30, 2.80],
    female: [0.65, 0.90, 1.20, 1.55, 1.90],
  },
  {
    key: 'hack_squat', name: 'Hack Squat',
    aliases: ['hack squat', 'machine hack squat', 'reverse hack squat'],
    category: 'legs',
    male:   [1.00, 1.40, 1.80, 2.30, 2.80],
    female: [0.60, 0.90, 1.20, 1.60, 2.00],
  },
];

// ========== RANK SYSTEM ==========

export const RANK_ORDER: ExerciseRank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Ember', 'Diamond'];

export const RANK_COLORS: Record<ExerciseRank, string> = {
  Bronze:   '#CD7F32',
  Silver:   '#C0C0C0',
  Gold:     '#FFD700',
  Platinum: '#E5E4E2',
  Ember:    '#FF6B35',
  Diamond:  '#B9F2FF',
};

export const RANK_GRADIENTS: Record<ExerciseRank, string> = {
  Bronze:   'linear-gradient(135deg, #CD7F32, #8B5E3C)',
  Silver:   'linear-gradient(135deg, #C0C0C0, #8C8C8C)',
  Gold:     'linear-gradient(135deg, #FFD700, #B8860B)',
  Platinum: 'linear-gradient(135deg, #E5E4E2, #A0A0A0)',
  Ember:    'linear-gradient(135deg, #FF6B35, #E63900)',
  Diamond:  'linear-gradient(135deg, #B9F2FF, #7DF9FF, #00BFFF)',
};

export const RANK_ICONS: Record<ExerciseRank, string> = {
  Bronze:   '🥉',
  Silver:   '🥈',
  Gold:     '🥇',
  Platinum: '💠',
  Ember:    '🔥',
  Diamond:  '💎',
};

export const RANK_SCORES: Record<ExerciseRank, number> = {
  Bronze:   1,
  Silver:   2,
  Gold:     3,
  Platinum: 4,
  Ember:    5,
  Diamond:  6,
};

// ========== MATCHING & CALCULATION ==========

/**
 * Fuzzy-match an exercise name from our exercise DB to a strength standard.
 */
export function matchExerciseToStandard(exerciseName: string): StrengthStandard | null {
  const lower = exerciseName.toLowerCase().trim();

  // 1. Exact alias match
  for (const std of STRENGTH_STANDARDS) {
    if (std.aliases.some(a => lower === a)) return std;
  }

  // 2. Partial match (exercise name contains alias or vice versa)
  for (const std of STRENGTH_STANDARDS) {
    if (std.aliases.some(a => lower.includes(a) || a.includes(lower))) return std;
  }

  // 3. Word overlap scoring
  const lowerWords = lower.split(/[\s\-_]+/);
  let bestMatch: StrengthStandard | null = null;
  let bestScore = 0;

  for (const std of STRENGTH_STANDARDS) {
    for (const alias of std.aliases) {
      const aliasWords = alias.split(/[\s\-_]+/);
      const overlap = lowerWords.filter(w => aliasWords.includes(w)).length;
      const score = overlap / Math.max(lowerWords.length, aliasWords.length);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = std;
      }
    }
  }

  return bestMatch;
}

/**
 * Get the rank for an exercise given the user's estimated 1RM, bodyweight, and gender.
 */
export function getExerciseRank(
  exerciseName: string,
  estimated1RM: number,
  bodyweight: number,
  gender: 'male' | 'female' = 'male'
): { rank: ExerciseRank; standard: StrengthStandard | null; bwMultiplier: number } {
  if (!bodyweight || bodyweight <= 0 || !estimated1RM || estimated1RM <= 0) {
    return { rank: 'Bronze', standard: null, bwMultiplier: 0 };
  }

  const standard = matchExerciseToStandard(exerciseName);
  const bwMultiplier = estimated1RM / bodyweight;

  if (!standard) {
    // Generic fallback: use reasonable defaults
    const genericThresholds = gender === 'male'
      ? [0.30, 0.50, 0.75, 1.00, 1.25]
      : [0.15, 0.30, 0.45, 0.65, 0.85];
    return { rank: getRankFromThresholds(bwMultiplier, genericThresholds), standard: null, bwMultiplier };
  }

  const thresholds = gender === 'male' ? standard.male : standard.female;
  return { rank: getRankFromThresholds(bwMultiplier, thresholds), standard, bwMultiplier };
}

function getRankFromThresholds(multiplier: number, thresholds: number[]): ExerciseRank {
  // thresholds = [silver, gold, platinum, ember, diamond]
  if (multiplier >= thresholds[4]) return 'Diamond';
  if (multiplier >= thresholds[3]) return 'Ember';
  if (multiplier >= thresholds[2]) return 'Platinum';
  if (multiplier >= thresholds[1]) return 'Gold';
  if (multiplier >= thresholds[0]) return 'Silver';
  return 'Bronze';
}

/**
 * Get progress toward the next rank for an exercise.
 */
export function getExerciseRankProgress(
  exerciseName: string,
  estimated1RM: number,
  bodyweight: number,
  gender: 'male' | 'female' = 'male'
): { currentRank: ExerciseRank; nextRank: ExerciseRank | null; progress: number; nextThreshold1RM: number | null } {
  if (!bodyweight || bodyweight <= 0) {
    return { currentRank: 'Bronze', nextRank: 'Silver', progress: 0, nextThreshold1RM: null };
  }

  const standard = matchExerciseToStandard(exerciseName);
  const bwMultiplier = estimated1RM / bodyweight;
  const thresholds = standard
    ? (gender === 'male' ? standard.male : standard.female)
    : (gender === 'male' ? [0.30, 0.50, 0.75, 1.00, 1.25] : [0.15, 0.30, 0.45, 0.65, 0.85]);

  // Find current rank index
  let currentIdx = -1; // Bronze
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (bwMultiplier >= thresholds[i]) {
      currentIdx = i;
      break;
    }
  }

  const currentRank = RANK_ORDER[currentIdx + 1]; // +1 because Bronze = index 0, Silver = index 1, etc.
  const nextRankIdx = currentIdx + 2;

  if (nextRankIdx > 5) {
    // Already Diamond
    return { currentRank: 'Diamond', nextRank: null, progress: 1, nextThreshold1RM: null };
  }

  const nextRank = RANK_ORDER[nextRankIdx];
  const lowerBound = currentIdx >= 0 ? thresholds[currentIdx] : 0;
  const upperBound = thresholds[currentIdx + 1];
  const progress = Math.min(1, Math.max(0, (bwMultiplier - lowerBound) / (upperBound - lowerBound)));
  const nextThreshold1RM = upperBound * bodyweight;

  return { currentRank, nextRank, progress, nextThreshold1RM };
}
