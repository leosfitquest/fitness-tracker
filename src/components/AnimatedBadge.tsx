import { BADGE_DEFINITIONS, type BadgeDefinition } from '../utils/hunterTier';

interface AnimatedBadgeProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
}

export function AnimatedBadge({ badgeId, size = 'md', locked = false }: AnimatedBadgeProps) {
  const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
  if (!badge) return null;

  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'text-lg', label: 'text-[9px]' },
    md: { container: 'w-14 h-14', icon: 'text-2xl', label: 'text-[10px]' },
    lg: { container: 'w-20 h-20', icon: 'text-3xl', label: 'text-xs' },
  };

  const s = sizes[size];

  if (locked) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`${s.container} rounded-xl flex items-center justify-center bg-slate-800/50 border border-slate-700/50`}
          style={{ opacity: 0.3, filter: 'grayscale(100%)' }}
        >
          <span className={s.icon}>🔒</span>
        </div>
        <span className={`${s.label} text-slate-600 font-medium text-center`}>{badge.name}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 group cursor-pointer">
      <div
        className={`${s.container} rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
        style={{
          background: badge.gradient,
          boxShadow: `0 0 12px ${badge.color}44, 0 2px 8px rgba(0,0,0,0.3)`,
          border: `2px solid ${badge.color}66`,
          animation: getAnimation(badge.id),
        }}
      >
        <span
          className={`${s.icon} transition-transform duration-300 group-hover:scale-125`}
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
        >
          {badge.icon}
        </span>
      </div>
      <span
        className={`${s.label} font-bold text-center transition-colors`}
        style={{ color: badge.color }}
      >
        {badge.name}
      </span>

      <style>{`
        @keyframes badgeFlame {
          0%, 100% { box-shadow: 0 0 12px ${badge.color}44; transform: scale(1); }
          25% { box-shadow: 0 0 18px ${badge.color}66; transform: scale(1.02); }
          50% { box-shadow: 0 0 24px ${badge.color}88; transform: scale(1.04); }
          75% { box-shadow: 0 0 18px ${badge.color}66; transform: scale(1.02); }
        }
        @keyframes badgeElectric {
          0%, 90%, 100% { box-shadow: 0 0 12px ${badge.color}44; }
          92% { box-shadow: 0 0 30px ${badge.color}CC, 0 0 50px ${badge.color}66; }
          94% { box-shadow: 0 0 12px ${badge.color}44; }
          96% { box-shadow: 0 0 25px ${badge.color}AA; }
        }
        @keyframes badgeSparkle {
          0%, 100% { box-shadow: 0 0 12px ${badge.color}44; filter: brightness(1); }
          50% { box-shadow: 0 0 20px ${badge.color}88; filter: brightness(1.2); }
        }
        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes badgeCrown {
          0%, 100% { box-shadow: 0 0 15px ${badge.color}66; transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.02) rotate(1deg); }
          75% { transform: scale(1.02) rotate(-1deg); }
        }
        @keyframes badgeTwinkle {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px ${badge.color}44; }
          50% { opacity: 0.85; box-shadow: 0 0 20px ${badge.color}88; }
        }
        @keyframes badgeShine {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes badgeErupt {
          0%, 100% { box-shadow: 0 0 12px ${badge.color}44; }
          30% { box-shadow: 0 0 25px ${badge.color}AA, 0 -5px 15px ${badge.color}66; }
          60% { box-shadow: 0 0 12px ${badge.color}44; }
        }
      `}</style>
    </div>
  );
}

function getAnimation(badgeId: string): string {
  const animations: Record<string, string> = {
    inferno: 'badgeFlame 2s ease-in-out infinite',
    lightning: 'badgeElectric 4s ease-in-out infinite',
    diamond_hands: 'badgeSparkle 2s ease-in-out infinite',
    champion: 'badgeBounce 2s ease-in-out infinite',
    crown: 'badgeCrown 3s ease-in-out infinite',
    rising_star: 'badgeTwinkle 2.5s ease-in-out infinite',
    iron_will: 'badgeShine 2s ease-in-out infinite',
    perfectionist: 'badgePulse 2s ease-in-out infinite',
    awakened: 'badgeErupt 3s ease-in-out infinite',
  };
  return animations[badgeId] || '';
}

// ============ BADGE SHOWCASE ============

interface BadgeShowcaseProps {
  earnedBadges: string[];
}

export function BadgeShowcase({ earnedBadges }: BadgeShowcaseProps) {
  return (
    <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        🏅 Badges
        <span className="text-xs text-slate-500 font-normal">
          {earnedBadges.length}/{BADGE_DEFINITIONS.length}
        </span>
      </h3>

      <div className="grid grid-cols-5 gap-3">
        {BADGE_DEFINITIONS.map(badge => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <div key={badge.id} className="flex justify-center">
              <AnimatedBadge
                badgeId={badge.id}
                size="sm"
                locked={!isEarned}
              />
            </div>
          );
        })}
      </div>

      {earnedBadges.length === 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          Complete challenges to earn badges!
        </div>
      )}
    </div>
  );
}
