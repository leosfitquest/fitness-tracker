import { useState, useEffect } from 'react';
import { type HunterTierInfo, HUNTER_TIERS } from '../utils/hunterTier';

interface AwakeningAnimationProps {
  tier: HunterTierInfo;
  onComplete: () => void;
}

export function AwakeningAnimation({ tier, onComplete }: AwakeningAnimationProps) {
  const [phase, setPhase] = useState<'dark' | 'reveal' | 'title' | 'fade'>('dark');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('reveal'), 800),
      setTimeout(() => setPhase('title'), 2200),
      setTimeout(() => setPhase('fade'), 4500),
      setTimeout(() => onComplete(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
      onClick={onComplete}
      style={{
        background: phase === 'dark' ? '#000' : 'rgba(0,0,0,0.95)',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Particle burst */}
      {phase !== 'dark' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const distance = 150 + Math.random() * 200;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  backgroundColor: tier.color,
                  opacity: 0,
                  transform: 'translate(-50%, -50%)',
                  animation: `particleBurst 2s ${i * 0.03}s ease-out forwards`,
                  // CSS custom properties for the animation
                  '--x': x + 'px',
                  '--y': y + 'px',
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Central glow */}
      {(phase === 'reveal' || phase === 'title') && (
        <div
          className="absolute rounded-full"
          style={{
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${tier.color}33 0%, transparent 70%)`,
            animation: 'glowPulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Tier icon */}
        {phase !== 'dark' && (
          <div
            className="text-7xl mb-6"
            style={{
              animation: 'scaleIn 0.6s ease-out forwards',
              opacity: 0,
              filter: `drop-shadow(0 0 30px ${tier.color})`,
            }}
          >
            {tier.icon}
          </div>
        )}

        {/* "You have Awakened" text */}
        {(phase === 'reveal' || phase === 'title') && (
          <div
            className="text-white/60 text-sm tracking-[0.3em] uppercase font-medium mb-3"
            style={{
              animation: 'fadeSlideUp 0.8s 0.3s ease-out forwards',
              opacity: 0,
            }}
          >
            You have Awakened
          </div>
        )}

        {/* Tier name */}
        {phase === 'title' && (
          <>
            <div
              className="text-6xl font-black tracking-wider mb-2"
              style={{
                color: tier.color,
                textShadow: `0 0 30px ${tier.glowColor}, 0 0 60px ${tier.glowColor}`,
                animation: 'titleReveal 0.8s ease-out forwards',
                opacity: 0,
              }}
            >
              {tier.tier}-RANK
            </div>
            <div
              className="text-white/80 text-xl font-medium tracking-wider"
              style={{
                animation: 'fadeSlideUp 0.6s 0.3s ease-out forwards',
                opacity: 0,
              }}
            >
              {tier.title}
            </div>
          </>
        )}

        {/* Tap to skip */}
        {phase !== 'dark' && (
          <div
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-white/20 text-xs"
            style={{ animation: 'fadeIn 1s 2s ease-out forwards', opacity: 0 }}
          >
            Tap to skip
          </div>
        )}
      </div>

      {/* Fade out */}
      {phase === 'fade' && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ animation: 'fadeIn 1s ease-out forwards', opacity: 0 }}
        />
      )}

      <style>{`
        @keyframes particleBurst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
          60% { opacity: 0.8; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.3); }
          60% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleReveal {
          0% { opacity: 0; transform: scale(0.5); letter-spacing: 0.5em; }
          100% { opacity: 1; transform: scale(1); letter-spacing: 0.15em; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
