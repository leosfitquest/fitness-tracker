/**
 * MuscleHeatmap — Gray anatomy body with colored muscle highlights.
 * Uses wger.de open-source muscle SVG assets (Apache 2.0 license).
 * Primary muscles → emerald green glow
 * Secondary muscles → cyan highlight
 */

const WGER_BASE = 'https://wger.de/static/images/muscles';

// Mapping from free-exercise-db muscle names → wger muscle IDs + view
// view: which body diagram shows this muscle best
interface MuscleEntry { id: number; view: 'front' | 'back'; }

const MUSCLE_MAP: Record<string, MuscleEntry[]> = {
  // ── CHEST ──────────────────────────────────────────
  'chest':                  [{ id: 4, view: 'front' }],
  'pectorals':              [{ id: 4, view: 'front' }],
  'pectoralis major':       [{ id: 4, view: 'front' }],
  'pectoralis minor':       [{ id: 4, view: 'front' }],

  // ── BICEPS ─────────────────────────────────────────
  'biceps':                 [{ id: 1, view: 'front' }],
  'biceps brachii':         [{ id: 1, view: 'front' }],

  // ── SHOULDERS ──────────────────────────────────────
  'shoulders':              [{ id: 2, view: 'front' }, { id: 14, view: 'back' }],
  'deltoids':               [{ id: 2, view: 'front' }, { id: 14, view: 'back' }],
  'anterior deltoid':       [{ id: 2, view: 'front' }],
  'front deltoid':          [{ id: 2, view: 'front' }],
  'posterior deltoid':      [{ id: 14, view: 'back' }],
  'rear deltoid':           [{ id: 14, view: 'back' }],
  'middle deltoid':         [{ id: 14, view: 'back' }],
  'lateral deltoid':        [{ id: 14, view: 'back' }],

  // ── TRICEPS ────────────────────────────────────────
  'triceps':                [{ id: 5, view: 'back' }],
  'triceps brachii':        [{ id: 5, view: 'back' }],

  // ── ABS & CORE ─────────────────────────────────────
  'abdominals':             [{ id: 10, view: 'front' }],
  'abs':                    [{ id: 10, view: 'front' }],
  'rectus abdominis':       [{ id: 10, view: 'front' }],
  'obliques':               [{ id: 10, view: 'front' }],
  'core':                   [{ id: 10, view: 'front' }],
  'serratus anterior':      [{ id: 3,  view: 'front' }],

  // ── BACK ───────────────────────────────────────────
  'back':                   [{ id: 9,  view: 'back' }, { id: 12, view: 'back' }],
  'lats':                   [{ id: 9,  view: 'back' }],
  'latissimus dorsi':       [{ id: 9,  view: 'back' }],
  'traps':                  [{ id: 12, view: 'back' }],
  'trapezius':              [{ id: 12, view: 'back' }],
  'rhomboids':              [{ id: 12, view: 'back' }],
  'erector spinae':         [{ id: 12, view: 'back' }],
  'lower back':             [{ id: 9,  view: 'back' }],

  // ── LEGS ───────────────────────────────────────────
  'quadriceps':             [{ id: 11, view: 'front' }],
  'quads':                  [{ id: 11, view: 'front' }],
  'hamstrings':             [{ id: 6,  view: 'back' }],
  'biceps femoris':         [{ id: 6,  view: 'back' }],
  'glutes':                 [{ id: 8,  view: 'back' }],
  'gluteus maximus':        [{ id: 8,  view: 'back' }],
  'gluteal muscles':        [{ id: 8,  view: 'back' }],
  'calves':                 [{ id: 7,  view: 'back' }],
  'gastrocnemius':          [{ id: 7,  view: 'back' }],
  'soleus':                 [{ id: 7,  view: 'back' }],
  'adductors':              [{ id: 11, view: 'front' }],
  'abductors':              [{ id: 11, view: 'front' }],

  // ── ARMS ───────────────────────────────────────────
  'forearms':               [{ id: 13, view: 'front' }],
  'brachioradialis':        [{ id: 13, view: 'front' }],
  'brachialis':             [{ id: 1,  view: 'front' }],
};

function resolveMuscles(names: string[]): MuscleEntry[] {
  const result: MuscleEntry[] = [];
  const addedIds = new Set<number>();

  for (const raw of names) {
    const name = raw.toLowerCase().trim();
    // Try exact match first
    let entries = MUSCLE_MAP[name];
    // Fallback: substring match
    if (!entries) {
      for (const [key, val] of Object.entries(MUSCLE_MAP)) {
        if (name.includes(key) || key.includes(name)) {
          entries = val;
          break;
        }
      }
    }
    if (entries) {
      entries.forEach(e => {
        if (!addedIds.has(e.id)) {
          addedIds.add(e.id);
          result.push(e);
        }
      });
    }
  }
  return result;
}

// CSS filter to turn a black SVG into the desired color
// emerald green: hsl(152, 68%, 50%)
const FILTERS = {
  base:      'brightness(0) invert(0.35)',           // dark gray silhouette
  primary:   'brightness(0) saturate(100%) invert(60%) sepia(96%) saturate(400%) hue-rotate(107deg) brightness(105%)', // emerald
  secondary: 'brightness(0) saturate(100%) invert(72%) sepia(60%) saturate(350%) hue-rotate(162deg) brightness(110%)', // cyan
};

interface MuscleHeatmapProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  /** px height of the diagram */
  height?: number;
  className?: string;
}

export function MuscleHeatmap({
  primaryMuscles = [],
  secondaryMuscles = [],
  height = 140,
  className = '',
}: MuscleHeatmapProps) {
  const primary   = resolveMuscles(primaryMuscles);
  const secondary = resolveMuscles(
    secondaryMuscles.filter(m => !primaryMuscles.some(p => p.toLowerCase() === m.toLowerCase()))
  );

  // Determine dominant view
  const allEntries = [...primary, ...secondary];
  if (allEntries.length === 0) return null;

  const backCount  = allEntries.filter(e => e.view === 'back').length;
  const frontCount = allEntries.filter(e => e.view === 'front').length;
  const view = backCount > frontCount ? 'back' : 'front';

  const pEntries = primary.filter(e => e.view === view);
  const sEntries = secondary.filter(e => e.view === view);

  const width = Math.round(height * 0.58);

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width, height }}
      aria-label="Muscle diagram"
    >
      {/* Gray base body */}
      <img
        src={`${WGER_BASE}/muscular_system_${view}.svg`}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none"
        style={{ filter: FILTERS.base }}
        loading="lazy"
      />

      {/* Secondary muscles — cyan */}
      {sEntries.map(e => (
        <img
          key={`s-${e.id}`}
          src={`${WGER_BASE}/secondary/muscle-${e.id}.svg`}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{ filter: FILTERS.secondary }}
          loading="lazy"
        />
      ))}

      {/* Primary muscles — emerald (rendered on top) */}
      {pEntries.map(e => (
        <img
          key={`p-${e.id}`}
          src={`${WGER_BASE}/main/muscle-${e.id}.svg`}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{ filter: FILTERS.primary }}
          loading="lazy"
        />
      ))}
    </div>
  );
}
