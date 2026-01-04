import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
      <div className="flex-1">
        <div className="font-medium">Theme</div>
        <div className="text-xs text-slate-400">Choose your preferred theme</div>
      </div>
      
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
        <button
          onClick={() => setTheme('light')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'light'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ☀️ Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'dark'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🌙 Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'system'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💻 System
        </button>
      </div>
    </div>
  );
}
