import { useState, useEffect } from 'react';
import { type HunterTierResult, getHunterTierProgress, HUNTER_TIERS, type HunterTierName } from '../utils/hunterTier';
import { type ExerciseRank, RANK_COLORS, RANK_ICONS, RANK_ORDER } from '../utils/strengthStandards';

interface HunterRankCardProps {
  tierResult: HunterTierResult;
  userName?: string;
}

export function HunterRankCard({ tierResult, userName }: HunterRankCardProps) {
  const [mounted, setMounted] = useState(false);
  const progress = getHunterTierProgress(tierResult);
  const tier = tierResult.tier;

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const isSRank = tier.tier === 'S';
  const isARank = tier.tier === 'A';
  const isBRank = tier.tier === 'B';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{
        background: tier.gradient,
        boxShadow: `0 0 30px ${tier.glowColor}, 0 4px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Animated background effects */}
      {isSRank && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: Math.random() * 3 + 's',
              }}
            />
          ))}
        </div>
      )}

      {isARank && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
            animation: 'shineEffect 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Tier Icon & Title */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              border: `2px solid rgba(255,255,255,0.2)`,
              boxShadow: isSRank ? `0 0 20px ${tier.glowColor}` : undefined,
              animation: isSRank ? 'pulseGlow 2s ease-in-out infinite' : isBRank ? 'shimmer 2s ease-in-out infinite' : undefined,
            }}
          >
            {tier.icon}
          </div>
          <div>
            <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Hunter Rank</div>
            <div className="text-white text-2xl font-black tracking-wide">{tier.tier}-Rank</div>
            <div className="text-white/80 text-sm font-medium">{tier.title}</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/60 text-sm italic mb-5">{tier.description}</p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-black/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Avg Score</div>
            <div className="text-white text-lg font-bold">{tierResult.avgScore.toFixed(1)}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Diamond %</div>
            <div className="text-white text-lg font-bold">{tierResult.diamondPercent.toFixed(0)}%</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Exercises</div>
            <div className="text-white text-lg font-bold">{tierResult.totalExercises}</div>
          </div>
        </div>

        {/* Rank Distribution */}
        <div className="mb-5">
          <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-2">Rank Distribution</div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-black/20">
            {RANK_ORDER.map(rank => {
              const count = tierResult.rankDistribution[rank];
              const percent = tierResult.totalExercises > 0 ? (count / tierResult.totalExercises) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={rank}
                  style={{
                    width: `${percent}%`,
                    backgroundColor: RANK_COLORS[rank],
                    transition: 'width 1s ease-out',
                  }}
                  title={`${rank}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {RANK_ORDER.map(rank => {
              const count = tierResult.rankDistribution[rank];
              if (count === 0) return null;
              return (
                <div key={rank} className="flex items-center gap-1">
                  <span className="text-xs">{RANK_ICONS[rank]}</span>
                  <span className="text-white/70 text-[10px] font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Tier Progress */}
        {progress.nextTier && (
          <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Next: {progress.nextTier.tier}-Rank</span>
              <span className="text-white/70 text-xs font-bold">{Math.round(progress.overallProgress * 100)}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress.overallProgress * 100}%`,
                  background: progress.nextTier.gradient,
                }}
              />
            </div>
            <div className="text-white/40 text-[10px]">
              Bottleneck: {progress.bottleneck}
            </div>
          </div>
        )}

        {/* Max tier message */}
        {!progress.nextTier && (
          <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm text-center">
            <div className="text-white font-bold text-sm">⚔️ You have reached the pinnacle. ⚔️</div>
            <div className="text-white/50 text-xs mt-1">There is no rank beyond S-Rank. You are the Shadow Monarch.</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes shineEffect {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px ${HUNTER_TIERS[5].glowColor}; }
          50% { box-shadow: 0 0 40px ${HUNTER_TIERS[5].glowColor}, 0 0 60px rgba(239,68,68,0.3); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
