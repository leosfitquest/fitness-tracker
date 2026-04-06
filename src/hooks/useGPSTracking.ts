import { useState, useRef, useCallback, useEffect } from 'react';
import type { GPSPoint } from '../types';

interface GPSState {
  isTracking: boolean;
  isPaused: boolean;
  route: GPSPoint[];
  currentPosition: GPSPoint | null;
  distanceKm: number;
  durationSeconds: number;
  avgPaceMinKm: number;
  error: string | null;
}

/** Haversine formula — great-circle distance between two lat/lng points */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGPSTracking() {
  const [state, setState] = useState<GPSState>({
    isTracking: false,
    isPaused: false,
    route: [],
    currentPosition: null,
    distanceKm: 0,
    durationSeconds: 0,
    avgPaceMinKm: 0,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const lastPointRef = useRef<GPSPoint | null>(null);
  const distanceRef = useRef(0);

  // Timer for elapsed seconds
  useEffect(() => {
    if (state.isTracking && !state.isPaused) {
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedTimeRef.current;
          const pace = distanceRef.current > 0.01
            ? (elapsed / 60) / distanceRef.current
            : 0;
          setState(prev => ({
            ...prev,
            durationSeconds: elapsed,
            avgPaceMinKm: Math.round(pace * 100) / 100,
          }));
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isTracking, state.isPaused]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported by this browser.' }));
      return;
    }

    // Reset
    distanceRef.current = 0;
    lastPointRef.current = null;
    pausedTimeRef.current = 0;
    startTimeRef.current = Date.now();

    setState({
      isTracking: true,
      isPaused: false,
      route: [],
      currentPosition: null,
      distanceKm: 0,
      durationSeconds: 0,
      avgPaceMinKm: 0,
      error: null,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          altitude: position.coords.altitude ?? undefined,
        };

        // Calculate distance from last point
        if (lastPointRef.current) {
          const d = haversineDistance(
            lastPointRef.current.lat, lastPointRef.current.lng,
            point.lat, point.lng
          );
          // Filter GPS jitter (skip tiny jumps < 3m)
          if (d > 0.003) {
            distanceRef.current += d;
            lastPointRef.current = point;
          }
        } else {
          lastPointRef.current = point;
        }

        setState(prev => ({
          ...prev,
          currentPosition: point,
          route: [...prev.route, point],
          distanceKm: Math.round(distanceRef.current * 1000) / 1000,
          error: null,
        }));
      },
      (err) => {
        setState(prev => ({ ...prev, error: `GPS Error: ${err.message}` }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );
  }, []);

  const pauseTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    setState(prev => ({ ...prev, isPaused: false }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          altitude: position.coords.altitude ?? undefined,
        };

        if (lastPointRef.current) {
          const d = haversineDistance(
            lastPointRef.current.lat, lastPointRef.current.lng,
            point.lat, point.lng
          );
          if (d > 0.003) {
            distanceRef.current += d;
            lastPointRef.current = point;
          }
        } else {
          lastPointRef.current = point;
        }

        setState(prev => ({
          ...prev,
          currentPosition: point,
          route: [...prev.route, point],
          distanceKm: Math.round(distanceRef.current * 1000) / 1000,
          error: null,
        }));
      },
      (err) => {
        setState(prev => ({ ...prev, error: `GPS Error: ${err.message}` }));
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopTracking = useCallback((): GPSState => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const finalState = { ...state, isTracking: false, isPaused: false };
    setState(finalState);
    return finalState;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    ...state,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  };
}
