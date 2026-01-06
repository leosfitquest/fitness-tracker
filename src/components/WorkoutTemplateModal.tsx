import { useState } from 'react';
import { WORKOUT_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/workoutTemplates';
import type { WorkoutTemplate } from '../data/workoutTemplates';

interface WorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate | null) => void;
}

export function WorkoutTemplateModal({ isOpen, onClose, onSelectTemplate }: WorkoutTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  if (!isOpen) return null;

  const filteredTemplates = WORKOUT_TEMPLATES.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  );

  const groupedTemplates = {
    'Push Pull Legs': filteredTemplates.filter(t => t.id.startsWith('ppl')),
    'Upper/Lower': filteredTemplates.filter(t => t.id.startsWith('upper-lower')),
    'Full Body': filteredTemplates.filter(t => t.id.startsWith('full-body')),
    'Arnold Split': filteredTemplates.filter(t => t.id.startsWith('arnold')),
    'Mike Mentzer HIT': filteredTemplates.filter(t => t.id.startsWith('mentzer')),
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-secondary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Workout Templates</h2>
              <p className="text-sm text-muted-foreground">Start with a proven program or create your own</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-4 items-center">
            {/* Quick Start Button */}
            <button
              onClick={() => {
                onSelectTemplate(null); // Null implies empty/quick start
                onClose();
              }}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
            >
              <span>⚡</span> Quick Start (Empty)
            </button>

            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap flex-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all'
                  ? 'bg-secondary text-foreground ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
              >
                All Levels
              </button>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, { name, color }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === key
                    ? 'bg-secondary text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                >
                  <span className={selectedCategory === key ? '' : color.replace('text-', 'text-')}>{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
          {Object.entries(groupedTemplates).map(([splitName, templates]) => {
            if (templates.length === 0) return null;

            return (
              <div key={splitName}>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  {splitName}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="group text-left p-5 bg-card hover:bg-secondary/50 border border-border hover:border-primary rounded-xl transition-all shadow-sm hover:shadow-md h-full flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-foreground font-bold group-hover:text-primary transition-colors text-lg">
                            {template.name}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TEMPLATE_CATEGORIES[template.category].color
                          } bg-secondary border border-border`}>
                          {TEMPLATE_CATEGORIES[template.category].name}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 mt-auto">
                        <span className="flex items-center gap-1">📅 {template.frequency}</span>
                        <span className="flex items-center gap-1">💪 {template.exercises.length} exercises</span>
                      </div>

                      {/* Exercise Preview */}
                      <div className="space-y-1.5 pt-4 border-t border-border/50 w-full">
                        {template.exercises.slice(0, 3).map((ex, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="text-primary">•</span>
                            <span className="font-medium text-foreground/80">{ex.exerciseName}</span>
                            <span className="text-muted-foreground ml-auto">
                              {ex.sets}×{ex.repsRange}
                            </span>
                          </div>
                        ))}
                        {template.exercises.length > 3 && (
                          <div className="text-xs text-primary/80 ml-4 font-medium mt-1">
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
