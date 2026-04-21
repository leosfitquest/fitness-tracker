import { useState, useRef, useEffect } from 'react';
import type { MuscleGroup } from '../types';

interface ExerciseGifProps {
  images: string[];
  muscleGroup?: MuscleGroup | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  legs: '#22c55e',
  shoulders: '#f59e0b',
  arms: '#a855f7',
  core: '#ec4899',
  glutes: '#f97316',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  glutes: 'Glutes',
};

export function ExerciseGif({ images, muscleGroup, className = '', size = 'md' }: ExerciseGifProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const color = MUSCLE_COLORS[muscleGroup || ''] || '#10b981';
  const label = MUSCLE_LABELS[muscleGroup || ''] || muscleGroup || '';

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-full h-48',
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleAnimation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (!images || images.length <= 1) return;

    if (isAnimating) {
      // Stop animation
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setFrame(0);
      setIsAnimating(false);
    } else {
      // Start animation
      setIsAnimating(true);
      intervalRef.current = window.setInterval(() => {
        setFrame(prev => (prev + 1) % images.length);
      }, 700);
    }
  };

  // No images available — show muscle group placeholder
  if (!images || images.length === 0 || error) {
    return (
      <div className={`exercise-img-container flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <div className="flex flex-col items-center gap-1">
          <MuscleIcon muscleGroup={muscleGroup || ''} color={color} />
          {size !== 'sm' && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color }}>
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`exercise-img-container relative cursor-pointer group ${sizeClasses[size]} ${className}`}
      onClick={toggleAnimation}
      role="button"
      tabIndex={0}
      aria-label={isAnimating ? 'Stop animation' : 'Play exercise animation'}
    >
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" />
      )}

      {/* Exercise image */}
      <img
        ref={imgRef}
        src={`${BASE_URL}${images[frame]}`}
        alt={`Exercise — ${label}`}
        className={`w-full h-full object-contain mix-blend-multiply transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ background: 'white', borderRadius: 'inherit' }}
      />

      {/* Muscle group badge */}
      {muscleGroup && size !== 'sm' && (
        <div
          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${color}20`,
            color: color,
            border: `1px solid ${color}40`,
          }}
        >
          {label}
        </div>
      )}

      {/* Play/pause indicator */}
      {images.length > 1 && loaded && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isAnimating ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {isAnimating ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Animating indicator ring */}
      {isAnimating && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            border: `2px solid ${color}60`,
            boxShadow: `0 0 12px ${color}30`,
          }}
        />
      )}
    </div>
  );
}

// Simple SVG icon for muscle groups
function MuscleIcon({ muscleGroup, color }: { muscleGroup: string; color: string }) {
  const iconSize = 24;

  const icons: Record<string, React.ReactNode> = {
    chest: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M12 4C8 4 4 7 4 12c0 3 2 4 4 4h8c2 0 4-1 4-4 0-5-4-8-8-8z" />
        <path d="M12 4v12M8 8c2 2 6 2 8 0" />
      </svg>
    ),
    back: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M12 3c-3 0-6 2-7 6-1 4 0 8 2 10h10c2-2 3-6 2-10-1-4-4-6-7-6z" />
        <path d="M12 3v16M9 7l3 4 3-4" />
      </svg>
    ),
    legs: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M9 4v7c0 2-1 4-2 6l-1 4M15 4v7c0 2 1 4 2 6l1 4" />
        <path d="M8 4h8M7 11h4M13 11h4" />
      </svg>
    ),
    shoulders: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="12" cy="10" r="3" />
        <path d="M4 14c0-4 3-7 8-7s8 3 8 7" />
        <path d="M8 14v4M16 14v4" />
      </svg>
    ),
    arms: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M6 6c0 3 1 5 3 7l2 3M18 6c0 3-1 5-3 7l-2 3" />
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="5" r="2" />
      </svg>
    ),
    core: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="7" y="4" width="10" height="16" rx="2" />
        <path d="M7 8h10M7 12h10M7 16h10M12 4v16" />
      </svg>
    ),
    glutes: (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M6 8c0 5 2 9 6 9s6-4 6-9" />
        <path d="M12 8v9M8 10c2 1 4 1 4 1s2 0 4-1" />
      </svg>
    ),
  };

  return icons[muscleGroup] || icons.core || null;
}

export default ExerciseGif;
