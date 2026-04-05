import { useState } from 'react';
import { updateProfile } from '../lib/database';
import { useToast } from './Toast';

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

type OnboardingStep = 'body' | 'preferences' | 'goals';

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('body');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Body stats
  const [bodyweight, setBodyweight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<string>('');

  // Preferences
  const [unitSystem, setUnitSystem] = useState<string>('metric');
  const [trainingExperience, setTrainingExperience] = useState<string>('beginner');
  const [trainingStyles, setTrainingStyles] = useState<string[]>(['general']);

  const toggleTrainingStyle = (value: string) => {
    setTrainingStyles(prev => {
      if (prev.includes(value)) {
        const next = prev.filter(v => v !== value);
        return next.length === 0 ? ['general'] : next;
      }
      // Remove 'general' when picking a specific style
      const next = value === 'general' ? ['general'] : [...prev.filter(v => v !== 'general'), value];
      return next;
    });
  };

  // Goals
  const [fitnessGoals, setFitnessGoals] = useState<string>('general');
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(3);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, {
        bodyweight: bodyweight ? parseFloat(bodyweight) : undefined,
        height: height ? parseFloat(height) : undefined,
        gender: gender as any || undefined,
        date_of_birth: dob || undefined,
        unit_system: unitSystem as any,
        training_experience: trainingExperience as any,
        training_style: trainingStyles.join(','),
        fitness_goals: fitnessGoals as any,
        workout_frequency: workoutFrequency,
        onboarding_completed: true,
      });
      onComplete();
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Error saving profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const steps: { id: OnboardingStep; title: string; subtitle: string }[] = [
    { id: 'body', title: 'Body Stats', subtitle: 'This personalizes your strength rankings' },
    { id: 'preferences', title: 'Training Style', subtitle: 'Help us customize your experience' },
    { id: 'goals', title: 'Your Goals', subtitle: 'What are you training for?' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const currentStepInfo = steps[currentStepIndex];

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].id);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{
                background: i <= currentStepIndex
                  ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                  : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="text-3xl mb-2">
            {step === 'body' ? '💪' : step === 'preferences' ? '⚙️' : '🎯'}
          </div>
          <h2 className="text-2xl font-bold text-white">{currentStepInfo.title}</h2>
          <p className="text-slate-400 text-sm mt-1">{currentStepInfo.subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="space-y-5 mb-8" style={{ animation: 'fadeSlide 0.3s ease-out' }}>
          {step === 'body' && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">
                  Bodyweight ({unitSystem === 'metric' ? 'kg' : 'lbs'}) *
                </label>
                <input
                  type="number"
                  value={bodyweight}
                  onChange={e => setBodyweight(e.target.value)}
                  placeholder={unitSystem === 'metric' ? '75' : '165'}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <p className="text-slate-500 text-xs mt-1">Required for strength rank calculations</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">
                  Height ({unitSystem === 'metric' ? 'cm' : 'ft/in'})
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder={unitSystem === 'metric' ? '180' : '72'}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">Gender *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'male', label: '♂ Male', emoji: '🧔' },
                    { value: 'female', label: '♀ Female', emoji: '👩' },
                    { value: 'prefer_not_to_say', label: 'Skip', emoji: '🤷' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        gender === option.value
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{option.emoji}</div>
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-1">Affects strength standard calculations</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </>
          )}

          {step === 'preferences' && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Unit System</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'metric', label: 'Metric', desc: 'kg, cm' },
                    { value: 'imperial', label: 'Imperial', desc: 'lbs, ft/in' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setUnitSystem(option.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        unitSystem === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className={`font-bold ${unitSystem === option.value ? 'text-emerald-400' : 'text-white'}`}>{option.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'beginner', label: '🌱 Beginner', desc: '< 1 year' },
                    { value: 'intermediate', label: '💪 Intermediate', desc: '1-3 years' },
                    { value: 'advanced', label: '🔥 Advanced', desc: '3-5 years' },
                    { value: 'elite', label: '⚡ Elite', desc: '5+ years' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTrainingExperience(option.value)}
                      className={`p-3 rounded-xl border text-left text-sm transition-all ${
                        trainingExperience === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className={`font-bold ${trainingExperience === option.value ? 'text-emerald-400' : 'text-white'}`}>{option.label}</div>
                      <div className="text-xs text-slate-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  Training Style
                  <span className="text-slate-500 font-normal normal-case tracking-normal ml-1">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'powerlifting', label: '🏋️ Powerlifting' },
                    { value: 'bodybuilding', label: '💪 Bodybuilding' },
                    { value: 'crossfit', label: '🔥 CrossFit' },
                    { value: 'calisthenics', label: '🤸 Calisthenics' },
                    { value: 'olympic', label: '🥇 Olympic Lifting' },
                    { value: 'general', label: '🎯 General Fitness' },
                  ].map(option => {
                    const isSelected = trainingStyles.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleTrainingStyle(option.value)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-[10px] text-black font-bold">✓</span>
                          </span>
                        )}
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                {trainingStyles.length > 1 && (
                  <p className="text-emerald-400/60 text-xs mt-2">
                    Selected: {trainingStyles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ')}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 'goals' && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Primary Goal</label>
                <div className="space-y-2">
                  {[
                    { value: 'strength', label: '🏋️ Get Stronger', desc: 'Increase max lifts and overall power' },
                    { value: 'hypertrophy', label: '💪 Build Muscle', desc: 'Maximize muscle growth and size' },
                    { value: 'endurance', label: '🏃 Improve Endurance', desc: 'Better stamina and conditioning' },
                    { value: 'weight_loss', label: '🔥 Lose Weight', desc: 'Burn fat and improve body composition' },
                    { value: 'general', label: '🎯 General Fitness', desc: 'Stay healthy and active' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFitnessGoals(option.value)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        fitnessGoals === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className={`font-bold ${fitnessGoals === option.value ? 'text-emerald-400' : 'text-white'}`}>{option.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  Target Workouts Per Week: <span className="text-emerald-400 text-base font-bold">{workoutFrequency}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={workoutFrequency}
                  onChange={e => setWorkoutFrequency(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1 day</span>
                  <span>7 days</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={goBack}
              className="px-5 py-3 text-slate-400 hover:text-white transition-colors font-medium"
            >
              ← Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={saving}
            className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : currentStepIndex === steps.length - 1 ? '🚀 Start Training' : 'Continue →'}
          </button>
          {currentStepIndex < steps.length - 1 && (
            <button
              onClick={() => setStep(steps[currentStepIndex + 1].id)}
              className="px-4 py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
