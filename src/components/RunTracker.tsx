import { useState, useEffect } from 'react';
import { useGPSTracking } from '../hooks/useGPSTracking';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { formatPace, estimateRunCalories, calculateRunRanks, RUN_RANK_COLORS, RUN_RANK_ICONS, getRunDistanceProgress } from '../utils/runningRanks';
import { formatTime } from '../utils/math';
import { saveRunSession, loadRunSessions } from '../lib/database';
import type { RunSession, GPSPoint } from '../types';
import type { User } from '@supabase/supabase-js';
import 'leaflet/dist/leaflet.css';
import { MapPin, Play, Pause, Square, History, Trophy, TrendingUp, Timer, Route } from 'lucide-react';

// Auto-center map on position changes
function MapAutoCenter({ position }: { position: GPSPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);
  return null;
}

interface RunTrackerProps {
  user: User;
}

type RunView = 'tracker' | 'history' | 'ranks';

export function RunTracker({ user }: RunTrackerProps) {
  const [view, setView] = useState<RunView>('tracker');
  const [runSessions, setRunSessions] = useState<RunSession[]>([]);
  const [selectedRunType, setSelectedRunType] = useState<RunSession['runType']>('easy');
  const [runNotes, setRunNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [lastRun, setLastRun] = useState<RunSession | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const {
    isTracking,
    isPaused,
    route,
    currentPosition,
    distanceKm,
    durationSeconds,
    avgPaceMinKm,
    error,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useGPSTracking();

  // Load run history
  useEffect(() => {
    loadRunSessions(user.id)
      .then(setRunSessions)
      .catch(console.error);
  }, [user.id]);

  const handleStop = async () => {
    const finalState = stopTracking();
    if (finalState.distanceKm < 0.01) return; // Don't save trivial runs

    const now = new Date().toISOString();
    const session: Omit<RunSession, 'id'> = {
      userId: user.id,
      startedAt: new Date(Date.now() - finalState.durationSeconds * 1000).toISOString(),
      endedAt: now,
      durationSeconds: finalState.durationSeconds,
      distanceKm: finalState.distanceKm,
      avgPaceMinKm: finalState.avgPaceMinKm,
      caloriesBurned: estimateRunCalories(finalState.distanceKm),
      route: finalState.route,
      notes: runNotes || undefined,
      runType: selectedRunType,
    };

    try {
      const saved = await saveRunSession(session, user.id);
      setRunSessions(prev => [saved, ...prev]);
      setLastRun(saved);
      setShowSummary(true);
    } catch (err) {
      console.error('Error saving run:', err);
    }
    setRunNotes('');
  };

  const rankResult = calculateRunRanks(runSessions);
  const distProgress = getRunDistanceProgress(rankResult.totalDistanceKm);
  const calories = estimateRunCalories(distanceKm);

  const runTypes: { value: RunSession['runType']; label: string; icon: string }[] = [
    { value: 'easy', label: 'Easy', icon: '🚶' },
    { value: 'tempo', label: 'Tempo', icon: '🏃' },
    { value: 'interval', label: 'Interval', icon: '⚡' },
    { value: 'long', label: 'Long', icon: '🏔️' },
    { value: 'sprint', label: 'Sprint', icon: '💨' },
    { value: 'race', label: 'Race', icon: '🏁' },
  ];

  // ========== SUMMARY MODAL ==========
  if (showSummary && lastRun) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-2">Run Complete!</h2>
          <p className="text-slate-400 mb-8">Great work out there!</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900/60 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-400">{lastRun.distanceKm.toFixed(2)}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">km</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4">
              <div className="text-2xl font-bold text-cyan-400">{formatTime(lastRun.durationSeconds)}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Duration</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400">{formatPace(lastRun.avgPaceMinKm)}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Pace (min/km)</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-400">{lastRun.caloriesBurned || '—'}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Calories</div>
            </div>
          </div>

          {/* Route map */}
          {lastRun.route.length > 1 && (
            <div className="h-48 rounded-xl overflow-hidden mb-6">
              <MapContainer
                center={[lastRun.route[0].lat, lastRun.route[0].lng]}
                zoom={14}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com">CartoDB</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Polyline
                  positions={lastRun.route.map(p => [p.lat, p.lng] as [number, number])}
                  pathOptions={{ color: '#10b981', weight: 4 }}
                />
              </MapContainer>
            </div>
          )}

          <button
            onClick={() => setShowSummary(false)}
            className="w-full py-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-lg hover:bg-emerald-400 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="max-w-4xl mx-auto mb-24">
      {/* TAB NAV */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'tracker' as RunView, icon: MapPin, label: 'Track' },
          { id: 'history' as RunView, icon: History, label: 'History' },
          { id: 'ranks' as RunView, icon: Trophy, label: 'Ranks' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              view === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== TRACKER VIEW ========== */}
      {view === 'tracker' && (
        <div>
          {/* Map */}
          <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 mb-6 relative">
            {currentPosition ? (
              <MapContainer
                center={[currentPosition.lat, currentPosition.lng]}
                zoom={16}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com">CartoDB</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {route.length > 1 && (
                  <Polyline
                    positions={route.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{ color: '#10b981', weight: 4 }}
                  />
                )}
                <MapAutoCenter position={currentPosition} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900/80 text-slate-500">
                <div className="text-center">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{isTracking ? 'Acquiring GPS signal...' : 'Start a run to see the map'}</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <Route className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-3xl font-black text-white">{distanceKm.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">km</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <Timer className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <div className="text-3xl font-black text-white">{formatTime(durationSeconds)}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Duration</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <div className="text-3xl font-black text-white">{formatPace(avgPaceMinKm)}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pace</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-lg">🔥</span>
              <div className="text-3xl font-black text-white">{calories}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Calories</div>
            </div>
          </div>

          {/* Run Type Selector (before starting) */}
          {!isTracking && (
            <div className="mb-6">
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Run Type</label>
              <div className="grid grid-cols-3 gap-2">
                {runTypes.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setSelectedRunType(rt.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                      selectedRunType === rt.value
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900/40 text-slate-400 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {rt.icon} {rt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex-1 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                START RUN
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? resumeTracking : pauseTracking}
                  className={`flex-1 py-5 font-black rounded-2xl text-lg flex items-center justify-center gap-2 transition-all ${
                    isPaused
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/40'
                  }`}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  {isPaused ? 'RESUME' : 'PAUSE'}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 py-5 bg-red-500/20 text-red-400 border-2 border-red-500/40 font-black rounded-2xl text-lg flex items-center justify-center gap-2 hover:bg-red-500/30 transition-all"
                >
                  <Square className="w-5 h-5" fill="currentColor" />
                  FINISH
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== HISTORY VIEW ========== */}
      {view === 'history' && (
        <div>
          <h2 className="text-2xl font-black text-white mb-4">Run History</h2>
          {runSessions.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No runs yet</p>
              <p className="text-sm mt-1">Start your first run to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runSessions.map(run => (
                <div key={run.id}>
                  <button
                    onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{runTypes.find(r => r.value === run.runType)?.icon || '🏃'}</span>
                        <span className="font-bold text-white capitalize">{run.runType || 'Run'}</span>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(run.startedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-emerald-400 font-bold">{run.distanceKm.toFixed(2)} km</span>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-bold">{formatTime(run.durationSeconds)}</span>
                      </div>
                      <div>
                        <span className="text-amber-400 font-bold">{formatPace(run.avgPaceMinKm)} /km</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded route map */}
                  {expandedRunId === run.id && run.route.length > 1 && (
                    <div className="mt-2 h-48 rounded-xl overflow-hidden border border-slate-700">
                      <MapContainer
                        center={[run.route[0].lat, run.route[0].lng]}
                        zoom={14}
                        className="h-full w-full"
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://carto.com">CartoDB</a>'
                          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <Polyline
                          positions={run.route.map(p => [p.lat, p.lng] as [number, number])}
                          pathOptions={{ color: '#10b981', weight: 4 }}
                        />
                      </MapContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== RANKS VIEW ========== */}
      {view === 'ranks' && (
        <div>
          <h2 className="text-2xl font-black text-white mb-6">Running Ranks</h2>

          {/* Overall Rank Card */}
          <div
            className="rounded-2xl p-6 mb-6 text-center border"
            style={{
              background: RUN_RANK_COLORS[rankResult.overallRank] + '15',
              borderColor: RUN_RANK_COLORS[rankResult.overallRank] + '40',
            }}
          >
            <div className="text-5xl mb-2">{RUN_RANK_ICONS[rankResult.overallRank]}</div>
            <h3 className="text-2xl font-black" style={{ color: RUN_RANK_COLORS[rankResult.overallRank] }}>
              {rankResult.overallRank} Runner
            </h3>
            <p className="text-xs text-slate-400 mt-1">{rankResult.totalRuns} runs · {rankResult.totalDistanceKm.toFixed(1)} km total</p>
          </div>

          {/* Distance Progress */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">Distance Rank</span>
              <span className="text-sm font-bold" style={{ color: RUN_RANK_COLORS[rankResult.distanceRank] }}>
                {RUN_RANK_ICONS[rankResult.distanceRank]} {rankResult.distanceRank}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${distProgress.progress * 100}%`,
                  background: RUN_RANK_COLORS[rankResult.distanceRank],
                }}
              />
            </div>
            {distProgress.nextRank && (
              <p className="text-[10px] text-slate-500 mt-1">
                {rankResult.totalDistanceKm.toFixed(0)} / {distProgress.nextThresholdKm} km → {distProgress.nextRank}
              </p>
            )}
          </div>

          {/* Category ranks */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Best Single Run</span>
                <span className="text-sm font-bold" style={{ color: RUN_RANK_COLORS[rankResult.singleRunRank] }}>
                  {RUN_RANK_ICONS[rankResult.singleRunRank]} {rankResult.singleRunRank} ({rankResult.bestSingleRunKm.toFixed(1)} km)
                </span>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Best Pace</span>
                <span className="text-sm font-bold" style={{ color: RUN_RANK_COLORS[rankResult.paceRank] }}>
                  {RUN_RANK_ICONS[rankResult.paceRank]} {rankResult.paceRank} ({formatPace(rankResult.bestPaceMinKm)} /km)
                </span>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Total Time Running</span>
                <span className="text-sm font-bold text-white">
                  {formatTime(rankResult.totalDurationSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* S-Tier hint */}
          <div className="mt-6 bg-gradient-to-r from-red-900/20 to-amber-900/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔱</span>
              <span className="font-bold text-red-400 text-sm">Path to S-Tier</span>
            </div>
            <p className="text-xs text-slate-400">
              Achieve Diamond rank in both Lifting and Running to unlock S-Tier (Shadow Monarch) status.
              Master all disciplines to rise above everyone else.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
