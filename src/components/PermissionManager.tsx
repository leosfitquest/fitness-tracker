import { useState, useEffect } from 'react';
import { Shield, Footprints, MapPin, Bell, Check, X } from 'lucide-react';

interface PermissionManagerProps {
  onComplete: () => void;
}

type PermissionItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'pending' | 'granted' | 'denied' | 'unsupported';
};

const PERMISSIONS_KEY = 'permissions_requested';

export function PermissionManager({ onComplete }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'motion',
      icon: <Footprints className="w-5 h-5" />,
      title: 'Motion Sensors',
      description: 'Track your steps automatically using your device sensors',
      status: 'pending',
    },
    {
      id: 'location',
      icon: <MapPin className="w-5 h-5" />,
      title: 'Location',
      description: 'Track your running routes with GPS',
      status: 'pending',
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Get workout reminders and social updates',
      status: 'pending',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    // Check what's already granted
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    const updated = [...permissions];

    // Check motion
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const DME = window.DeviceMotionEvent as any;
      if (typeof DME.requestPermission !== 'function') {
        // Non-iOS — motion is auto-granted
        updated[0].status = 'granted';
      }
    } else {
      updated[0].status = 'unsupported';
    }

    // Check notifications
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        updated[2].status = 'granted';
      } else if (Notification.permission === 'denied') {
        updated[2].status = 'denied';
      }
    } else {
      updated[2].status = 'unsupported';
    }

    // Check location
    if (!('geolocation' in navigator)) {
      updated[1].status = 'unsupported';
    }

    setPermissions(updated);

    // Skip to first pending permission
    const firstPending = updated.findIndex(p => p.status === 'pending');
    if (firstPending === -1) {
      // All already handled
      setAllDone(true);
    } else {
      setCurrentIndex(firstPending);
    }
  };

  const requestPermission = async (id: string) => {
    const updated = [...permissions];
    const idx = updated.findIndex(p => p.id === id);
    if (idx === -1) return;

    try {
      if (id === 'motion') {
        const DME = window.DeviceMotionEvent as any;
        if (typeof DME.requestPermission === 'function') {
          const result = await DME.requestPermission();
          updated[idx].status = result === 'granted' ? 'granted' : 'denied';
        } else {
          updated[idx].status = 'granted';
        }
      } else if (id === 'location') {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => { updated[idx].status = 'granted'; resolve(); },
            () => { updated[idx].status = 'denied'; resolve(); },
            { timeout: 5000 }
          );
        });
      } else if (id === 'notifications') {
        if ('Notification' in window) {
          const result = await Notification.requestPermission();
          updated[idx].status = result === 'granted' ? 'granted' : 'denied';
        }
      }
    } catch {
      updated[idx].status = 'denied';
    }

    setPermissions(updated);
    moveToNext(updated);
  };

  const skipPermission = (id: string) => {
    const updated = [...permissions];
    const idx = updated.findIndex(p => p.id === id);
    if (idx !== -1) updated[idx].status = 'denied';
    setPermissions(updated);
    moveToNext(updated);
  };

  const moveToNext = (items: PermissionItem[]) => {
    const next = items.findIndex((p, i) => i > currentIndex && p.status === 'pending');
    if (next === -1) {
      setAllDone(true);
    } else {
      setCurrentIndex(next);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(PERMISSIONS_KEY, 'true');
    onComplete();
  };

  if (allDone) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-fade-in">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">All Set!</h2>
          <p className="text-slate-400 text-sm mb-6">
            You can change permissions anytime in your device settings.
          </p>
          <div className="space-y-2 mb-6">
            {permissions.map(p => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${p.status === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {p.status === 'granted' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </div>
                <span className={p.status === 'granted' ? 'text-white' : 'text-slate-500'}>{p.title}</span>
              </div>
            ))}
          </div>
          <button onClick={handleFinish} className="w-full py-3 bg-gradient-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
            Continue
          </button>
        </div>
      </div>
    );
  }

  const current = permissions[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-fade-in">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in" key={current.id}>
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {permissions.map((p, i) => (
            <div
              key={p.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'w-8 bg-gradient-to-r from-emerald-500 to-cyan-500' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          {current.icon}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
        <p className="text-slate-400 text-sm mb-8">{current.description}</p>

        <div className="space-y-3">
          <button
            onClick={() => requestPermission(current.id)}
            className="w-full py-3 bg-gradient-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity press-effect"
          >
            Allow
          </button>
          <button
            onClick={() => skipPermission(current.id)}
            className="w-full py-3 text-slate-400 text-sm hover:text-white transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if permissions have already been asked */
export function hasRequestedPermissions(): boolean {
  return localStorage.getItem(PERMISSIONS_KEY) === 'true';
}
