import { useState } from 'react';
import { WORKOUT_TEMPLATES, TEMPLATE_CATEGORIES, WorkoutTemplate } from '../data/workoutTemplates';

interface WorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
}

export function WorkoutTemplateModal({ isOpen, onClose, onSelectTemplate }: WorkoutTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  if (!isOpen) return null;

  const filteredTemplates = WORKOUT_TEMPLATES.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  );

  // Group by split type
  const groupedTemplates = {
    'Push Pull Legs': filteredTemplates.filter(t => t.id.startsWith('ppl')),
    'Upper/Lower': filteredTemplates.filter(t => t.id.startsWith('upper-lower')),
    'Full Body': filteredTemplates.filter(t => t.id.startsWith('full-body')),
    'Arnold Split': filteredTemplates.filter(t => t.id.startsWith('arnold')),
    'Mike Mentzer HIT': filteredTemplates.filter(t => t.id.startsWith('mentzer')),
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Workout Templates</h2>
              <p className="text-sm text-slate-400">Start with a proven program</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              ✕
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Levels
            </button>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, { name, color }]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-emerald-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className={selectedCategory === key ? '' : color}>{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(groupedTemplates).map(([splitName, templates]) => {
            if (templates.length === 0) return null;
            
            return (
              <div key={splitName}>
                <h3 className="text-lg font-bold text-emerald-400 mb-3">{splitName}</h3>
                <div className="grid gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="group text-left p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-bold group-hover:text-emerald-400 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-sm text-slate-400">{template.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          TEMPLATE_CATEGORIES[template.category].color
                        } bg-slate-900/50`}>
                          {TEMPLATE_CATEGORIES[template.category].name}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        <span>📅 {template.frequency}</span>
                        <span>💪 {template.exercises.length} exercises</span>
                      </div>

                      {/* Exercise Preview */}
                      <div className="space-y-1">
                        {template.exercises.slice(0, 3).map((ex, idx) => (
                          <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{ex.exerciseName}</span>
                            <span className="text-slate-600">
                              {ex.sets}×{ex.repsRange}
                            </span>
                          </div>
                        ))}
                        {template.exercises.length > 3 && (
                          <div className="text-xs text-slate-500 ml-4">
                            +{template.exercises.length - 3} more exercises
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
