import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from './Toast';

interface AccountPageProps {
  user: User;
}

export function AccountPage({ user }: AccountPageProps) {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Reload so the app shows the logged-out state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Account</h1>
        </div>

        {/* Profile Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          
          {/* Email */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-2">Email</label>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-300">
              {user.email}
            </div>
          </div>

          {/* User ID */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">User ID</label>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs flex items-center justify-between">
              <span className="truncate">{user.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  showToast('User ID copied!', 'success');
                }}
                className="ml-2 px-2 py-1 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-600 transition-all"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Settings</h2>

          {/* Theme Selector */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-3">Theme</label>
            <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  theme === 'system'
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💻 System
              </button>
            </div>
          </div>

          {/* Mode (Beginner/Expert) */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">Mode</label>
            <div className="text-sm text-slate-500">
              Expert (Beginner coming soon)
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
        >
          Sign Out
        </button>

        {/* Version */}
        <div className="text-center mt-6 text-sm text-slate-500">
          Version 1.0.0 Beta
        </div>
      </div>
    </div>
  );
}
