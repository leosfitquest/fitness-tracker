
import { Home, Dumbbell, User } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'dashboard', icon: Dumbbell, label: 'Workouts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border px-6 py-3 flex justify-between items-center z-40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className={`relative p-1 rounded-full transition-all duration-300 ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
              <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
