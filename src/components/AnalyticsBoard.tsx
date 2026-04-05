import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { WorkoutSessionLog } from '../types.ts';

interface AnalyticsBoardProps {
  sessionLogs: WorkoutSessionLog[];
}

export function AnalyticsBoard({ sessionLogs }: AnalyticsBoardProps) {
  const [timeframe, setTimeframe] = useState<'30' | '90' | 'all'>('30');

  // Filter logs by timeframe
  const filteredLogs = useMemo(() => {
    if (timeframe === 'all') return sessionLogs;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeframe));
    return sessionLogs.filter(log => new Date(log.startedAt) >= cutoff);
  }, [sessionLogs, timeframe]);

  // Data 1: Volume over time (Line/Area)
  const volumeData = useMemo(() => {
    const dataMap = new Map<string, number>();
    filteredLogs.forEach(log => {
      const d = new Date(log.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dataMap.set(d, (dataMap.get(d) || 0) + log.totalVolume);
    });
    return Array.from(dataMap.entries()).map(([date, volume]) => ({ date, volume })).reverse();
  }, [filteredLogs]);

  // Data 2: Volume by Muscle Group (Pie)
  const muscleData = useMemo(() => {
    const dataMap = new Map<string, number>();
    filteredLogs.forEach(log => {
      log.exercises.forEach(ex => {
        const validSets = ex.sets.filter(s => s.completed && s.weight && s.reps && s.setType !== 'warmup');
        const vol = validSets.reduce((sum, s) => sum + (s.weight! * s.reps!), 0);
        dataMap.set(ex.muscleGroup, (dataMap.get(ex.muscleGroup) || 0) + vol);
      });
    });
    return Array.from(dataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'];

  return (
    <div className="flex-1 flex flex-col min-h-0 relative max-w-4xl mx-auto w-full pb-24">
      <div className="px-4 pt-12 pb-4 bg-background z-10 sticky top-0 flex items-center justify-between border-b border-border shadow-sm">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Analytics</h1>
        <select 
          value={timeframe} 
          onChange={e => setTimeframe(e.target.value as '30' | '90' | 'all')}
          className="bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1.5 rounded-lg border border-border outline-none"
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Total Volume Area Chart */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">Volume Progression</h2>
          <div className="h-64">
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#60a5fa' }} 
                  />
                  <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data</div>
            )}
          </div>
        </div>

        {/* Muscle Group Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">Volume by Muscle Group</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="h-64 w-full md:w-1/2">
              {muscleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={muscleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {muscleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data</div>
              )}
            </div>
            
            <div className="w-full md:w-1/2 space-y-2">
              {muscleData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-foreground capitalize">{entry.name}</span>
                  </div>
                  <span className="font-medium text-muted-foreground">{(entry.value / 1000).toFixed(1)}k kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
