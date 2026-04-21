import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { RunTracker } from './RunTracker';
import { useStepCounter } from '../hooks/useStepCounter';
import { getFriendsDailySteps, getProfile, updateProfile } from '../lib/database';
import { Footprints, MapPin, Play, Square, AlertCircle, PlusCircle, Trophy, Bot, Zap, Crown } from 'lucide-react';

interface MovementHubProps {
  user: User;
}

type LeaderboardEntry = {
  id: string;
  name: string;
  avatar?: string;
  steps: number;
  isBot?: boolean;
  isUser?: boolean;
};

// Bot step generation — deterministic per day so values stay consistent
function getBotSteps(botName: string, date: string): number {
  let hash = 0;
  const seed = `${botName}-${date}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const rand = Math.abs(hash);

  if (botName === 'lazy') {
    // Lazy bot: 2000-5000 steps
    return 2000 + (rand % 3000);
  }
  // Active bot: 8000-13000 steps
  return 8000 + (rand % 5000);
}

export function MovementHub({ user }: MovementHubProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'run'>('steps');
  const {
    steps, goal, isActive, isSupported, permissionGranted,
    startCounting, stopCounting, addManualSteps, setGoal
  } = useStepCounter(user.id);
  const [manualStepInput, setManualStepInput] = useState('');
  const [friendsSteps, setFriendsSteps] = useState<{ userId: string; username: string; avatarUrl?: string; steps: number }[]>([]);
  const [username, setUsername] = useState('You');

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Load friends and user profile
  useEffect(() => {
    getFriendsDailySteps(user.id, todayDate).then(setFriendsSteps).catch(() => {});
    getProfile(user.id).then(p => {
      if (p?.username) setUsername(p.username);
    }).catch(() => {});
  }, [user.id, todayDate]);

  // Build leaderboard
  const leaderboard = useMemo((): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];

    // User
    entries.push({
      id: 'user',
      name: username,
      steps: steps,
      isUser: true,
    });

    // Lazy Bot
    entries.push({
      id: 'lazy-bot',
      name: '🦥 Lazy Bot',
      steps: getBotSteps('lazy', todayDate),
      isBot: true,
    });

    // Active Bot
    entries.push({
      id: 'active-bot',
      name: '⚡ Active Bot',
      steps: getBotSteps('active', todayDate),
      isBot: true,
    });

    // Friends
    friendsSteps.forEach(f => {
      entries.push({
        id: f.userId,
        name: f.username,
        avatar: f.avatarUrl,
        steps: f.steps,
      });
    });

    // Sort by steps descending
    return entries.sort((a, b) => b.steps - a.steps);
  }, [steps, friendsSteps, username, todayDate]);

  // XP rewards for leaderboard position
  useEffect(() => {
    if (steps === 0) return;

    const userRank = leaderboard.findIndex(e => e.isUser) + 1;
    const lazyBot = leaderboard.find(e => e.id === 'lazy-bot');
    const activeBot = leaderboard.find(e => e.id === 'active-bot');

    // Beat Lazy Bot XP
    if (lazyBot && steps > lazyBot.steps) {
      const key = `step_beat_lazy_${todayDate}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        import('../lib/database').then(async ({ getProfile: gp, updateProfile: up }) => {
          const p = await gp(user.id);
          if (p) await up(user.id, { xp: (p.xp || 0) + 25 });
        });
      }
    }

    // Beat Active Bot XP
    if (activeBot && steps > activeBot.steps) {
      const key = `step_beat_active_${todayDate}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        import('../lib/database').then(async ({ getProfile: gp, updateProfile: up }) => {
          const p = await gp(user.id);
          if (p) await up(user.id, { xp: (p.xp || 0) + 75 });
        });
      }
    }

    // #1 on leaderboard XP
    if (userRank === 1 && leaderboard.length > 1) {
      const key = `step_top_${todayDate}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        import('../lib/database').then(async ({ getProfile: gp, updateProfile: up }) => {
          const p = await gp(user.id);
          if (p) await up(user.id, { xp: (p.xp || 0) + 100 });
        });
      }
    }
  }, [steps, leaderboard, todayDate, user.id]);

  const handleAddManual = () => {
    const s = parseInt(manualStepInput);
    if (!isNaN(s) && s > 0) {
      addManualSteps(s);
      setManualStepInput('');
    }
  };

  const progress = Math.min((steps / goal) * 100, 100);
  const userRank = leaderboard.findIndex(e => e.isUser) + 1;

  return (
    <div className="flex flex-col h-full bg-background relative pb-20">

      {/* Mode Toggle Header */}
      <div className="flex justify-center mb-6">
        <div className="flex glass-card rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === 'steps'
                ? 'bg-gradient-primary text-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-4 h-4" />
            Steps
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === 'run'
                ? 'bg-gradient-primary text-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {activeTab === 'run' ? (
          <RunTracker user={user} />
        ) : (
          <div className="max-w-md mx-auto px-4 flex flex-col items-center">

            {/* Step Circular Progress */}
            <div className="relative w-56 h-56 mt-4 mb-8 flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-emerald-500/5 blur-[40px] rounded-full" />

              {/* SVG Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="43" className="fill-none" stroke="hsl(225, 16%, 14%)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  className="fill-none transition-all duration-1000 ease-out"
                  stroke="url(#stepGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 43}`}
                  strokeDashoffset={`${2 * Math.PI * 43 * (1 - progress / 100)}`}
                />
                <defs>
                  <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(160, 84%, 50%)" />
                    <stop offset="100%" stopColor="hsl(188, 85%, 55%)" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="w-6 h-6 text-emerald-400 mb-1.5 opacity-70" />
                <div className="text-4xl font-black text-gradient tracking-tighter">
                  {steps.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  / {goal.toLocaleString()}
                </div>
                {progress >= 100 && (
                  <div className="text-xs text-emerald-400 font-bold mt-1 animate-pulse">🎉 Goal reached!</div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="w-full glass-card rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">Auto Tracker</h3>
                {isActive && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                )}
              </div>

              {!isSupported ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Motion tracking unavailable on this device. Use manual entry instead.</span>
                </div>
              ) : permissionGranted === false ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Permission denied. Enable motion access in browser settings.</span>
                </div>
              ) : (
                <button
                  onClick={isActive ? stopCounting : startCounting}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all press-effect ${
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-gradient-primary text-black shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      Stop Counting
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Start Counting
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Manual Entry */}
            <div className="w-full glass-card rounded-2xl p-5 mb-4">
              <h3 className="text-white font-bold mb-1">Add Steps Manually</h3>
              <p className="text-slate-500 text-xs mb-3">From your smartwatch or fitness band</p>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={manualStepInput}
                  onChange={(e) => setManualStepInput(e.target.value)}
                  className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleAddManual}
                  disabled={!manualStepInput}
                  className="px-5 bg-gradient-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1 press-effect"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Step Leaderboard */}
            <div className="w-full glass-card rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-bold">Daily Ranking</h3>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const isMe = entry.isUser;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all leaderboard-item ${
                        isMe
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-slate-800/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-7 h-7 flex items-center justify-center font-bold rounded-full text-xs ${
                        index === 0 ? 'bg-amber-400 text-black' :
                        index === 1 ? 'bg-slate-400 text-black' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {index === 0 ? <Crown className="w-3.5 h-3.5" /> : index + 1}
                      </div>

                      {/* Avatar / Bot icon */}
                      <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {entry.isBot ? (
                          <Bot className={`w-4 h-4 ${entry.id === 'active-bot' ? 'text-cyan-400' : 'text-slate-400'}`} />
                        ) : entry.avatar ? (
                          <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            {entry.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${isMe ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {entry.name} {isMe && '(You)'}
                        </div>
                        {entry.isBot && (
                          <div className="text-[10px] text-slate-500">AI Competitor</div>
                        )}
                      </div>

                      {/* Steps */}
                      <div className="text-right">
                        <div className={`font-bold text-sm ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                          {entry.steps.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">steps</div>
                      </div>

                      {/* XP badge for beating bots */}
                      {isMe && index === 0 && leaderboard.length > 1 && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] font-bold text-amber-400">
                          <Zap className="w-3 h-3" /> +100 XP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* XP info */}
              <div className="mt-4 p-3 bg-slate-800/30 rounded-xl">
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Beat 🦥 Lazy Bot</span>
                    <span className="text-amber-400 font-bold">+25 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beat ⚡ Active Bot</span>
                    <span className="text-amber-400 font-bold">+75 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🥇 #1 Daily Leader</span>
                    <span className="text-amber-400 font-bold">+100 XP</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
