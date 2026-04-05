import { useState } from 'react';
import { MUSCLE_GROUPS } from '../types.ts';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: { name: string; muscleGroup: string; equipment?: string }) => void;
}

export function CustomExerciseModal({ isOpen, onClose, onSave }: CustomExerciseModalProps) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [equipment, setEquipment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-foreground">Create Exercise</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Exercise Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Incline Smith Machine Press"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Muscle Group</label>
            <select 
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none uppercase text-sm"
            >
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Equipment (Optional)</label>
            <input 
              type="text" 
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Dumbbell, Barbell"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium">
            Cancel
          </button>
          <button 
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), muscleGroup, equipment: equipment.trim() || undefined });
            }}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
