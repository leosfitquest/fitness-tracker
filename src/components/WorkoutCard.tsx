import { Play, Pencil, Trash2, Clock, Dumbbell } from 'lucide-react';

interface WorkoutCardProps {
  id: string;
  name: string;
  description?: string;
  exercises: number;
  estimatedDuration?: number;
  lastPerformed?: string;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({
  id, name, description, exercises, estimatedDuration, lastPerformed,
  onStart, onEdit, onDelete
}: WorkoutCardProps) {

  const formatLastPerformed = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  };

  const lastText = formatLastPerformed(lastPerformed);
  const isRecent = lastPerformed && (new Date().getTime() - new Date(lastPerformed).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 cursor-move group relative overflow-hidden">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
          <Dumbbell className="w-5 h-5 text-emerald-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate text-[15px]">{name}</h3>
          {description && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {exercises} exercise{exercises !== 1 ? 's' : ''}
            </span>
            {estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{estimatedDuration}m
              </span>
            )}
          </div>

          {/* Last performed badge */}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isRecent
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              {lastText}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(id); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onStart(id); }}
        className="w-full mt-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all press-effect"
      >
        <Play className="w-4 h-4 fill-current" />
        Start Workout
      </button>
    </div>
  );
}
