import { Home, Dumbbell, User, Footprints } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'run', icon: Footprints, label: 'Move' },
    { id: 'dashboard', icon: Dumbbell, label: 'Workouts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      {/* Glass background with top glow line */}
      <div className="relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        
        <div className="glass px-4 py-2 flex justify-around items-center"
          style={{
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all duration-200 press-effect"
                style={{
                  minWidth: '60px',
                }}
              >
                {/* Active background pill */}
                {isActive && (
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-xl animate-scale-in" />
                )}

                <div className="relative z-10">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'text-slate-500'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span
                  className={`relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
