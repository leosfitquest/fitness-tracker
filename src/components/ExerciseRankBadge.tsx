import { type ExerciseRank, RANK_COLORS, RANK_ICONS, RANK_GRADIENTS } from '../utils/strengthStandards';

interface ExerciseRankBadgeProps {
  rank: ExerciseRank;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export function ExerciseRankBadge({ rank, size = 'sm', showLabel = false, animated = true }: ExerciseRankBadgeProps) {
  const color = RANK_COLORS[rank];
  const icon = RANK_ICONS[rank];
  const gradient = RANK_GRADIENTS[rank];

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  const isDiamond = rank === 'Diamond';
  const isEmber = rank === 'Ember';

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center shrink-0 ${animated ? 'transition-transform hover:scale-110' : ''}`}
        style={{
          background: gradient,
          boxShadow: isDiamond
            ? `0 0 12px ${color}88, 0 0 24px ${color}44`
            : isEmber
              ? `0 0 8px ${color}66`
              : `0 0 4px ${color}44`,
          border: `2px solid ${color}`,
          animation: isDiamond ? 'diamondPulse 2s ease-in-out infinite' : isEmber ? 'emberGlow 1.5s ease-in-out infinite' : undefined,
        }}
      >
        <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>{icon}</span>
      </div>
      {showLabel && (
        <span
          className="font-bold text-xs"
          style={{ color }}
        >
          {rank}
        </span>
      )}

      <style>{`
        @keyframes diamondPulse {
          0%, 100% { box-shadow: 0 0 12px ${RANK_COLORS.Diamond}88, 0 0 24px ${RANK_COLORS.Diamond}44; }
          50% { box-shadow: 0 0 20px ${RANK_COLORS.Diamond}AA, 0 0 40px ${RANK_COLORS.Diamond}66; }
        }
        @keyframes emberGlow {
          0%, 100% { box-shadow: 0 0 8px ${RANK_COLORS.Ember}66; }
          50% { box-shadow: 0 0 16px ${RANK_COLORS.Ember}88, 0 0 32px ${RANK_COLORS.Ember}44; }
        }
      `}</style>
    </div>
  );
}
