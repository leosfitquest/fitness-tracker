export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  frequency: string; // "3x/week", "6x/week", etc.
  exercises: {
    exerciseName: string;
    sets: number;
    repsRange: string; // "8-12", "5-8", etc.
    notes?: string;
  }[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  // ===== PUSH PULL LEGS =====
  {
    id: 'ppl-push',
    name: 'Push (PPL)',
    description: 'Chest, Shoulders, Triceps',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Barbell Bench Press', sets: 4, repsRange: '6-8' },
      { exerciseName: 'Incline Dumbbell Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Dumbbell Shoulder Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Lateral Raise (Dumbbell)', sets: 3, repsRange: '12-15' },
      { exerciseName: 'Triceps Pushdown (Cable)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Overhead Triceps Extension (Dumbbell)', sets: 3, repsRange: '10-12' },
    ],
  },
  {
    id: 'ppl-pull',
    name: 'Pull (PPL)',
    description: 'Back, Biceps',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Deadlift (Barbell)', sets: 3, repsRange: '5-8' },
      { exerciseName: 'Pull Up', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Row', sets: 4, repsRange: '8-10' },
      { exerciseName: 'Lat Pulldown (Cable)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Barbell Curl', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Hammer Curl (Dumbbell)', sets: 3, repsRange: '10-12' },
    ],
  },
  {
    id: 'ppl-legs',
    name: 'Legs (PPL)',
    description: 'Quads, Hamstrings, Glutes, Calves',
    category: 'intermediate',
    frequency: '1-2x/week',
    exercises: [
      { exerciseName: 'Squat (Barbell)', sets: 4, repsRange: '6-10' },
      { exerciseName: 'Romanian Deadlift (Barbell)', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Leg Press', sets: 3, repsRange: '10-15' },
      { exerciseName: 'Leg Curl (Machine)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Leg Extension (Machine)', sets: 3, repsRange: '12-15' },
      { exerciseName: 'Standing Calf Raise (Machine)', sets: 4, repsRange: '12-15' },
    ],
  },

  // ===== PPL VARIATION (Bizeps am Push, Trizeps am Pull) =====
  {
    id: 'ppl-push-biceps',
    name: 'Push + Biceps',
    description: 'Chest, Shoulders, Biceps',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Barbell Bench Press', sets: 4, repsRange: '6-8' },
      { exerciseName: 'Incline Dumbbell Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Dumbbell Shoulder Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Lateral Raise (Dumbbell)', sets: 3, repsRange: '12-15' },
      { exerciseName: 'Barbell Curl', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Hammer Curl (Dumbbell)', sets: 3, repsRange: '10-12' },
    ],
  },
  {
    id: 'ppl-pull-triceps',
    name: 'Pull + Triceps',
    description: 'Back, Triceps',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Deadlift (Barbell)', sets: 3, repsRange: '5-8' },
      { exerciseName: 'Pull Up', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Row', sets: 4, repsRange: '8-10' },
      { exerciseName: 'Lat Pulldown (Cable)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Triceps Pushdown (Cable)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Overhead Triceps Extension (Dumbbell)', sets: 3, repsRange: '10-12' },
    ],
  },

  // ===== UPPER/LOWER =====
  {
    id: 'upper-lower-upper',
    name: 'Upper Body',
    description: 'Chest, Back, Shoulders, Arms',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Barbell Bench Press', sets: 4, repsRange: '6-8' },
      { exerciseName: 'Barbell Row', sets: 4, repsRange: '6-8' },
      { exerciseName: 'Dumbbell Shoulder Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Pull Up', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Curl', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Triceps Pushdown (Cable)', sets: 3, repsRange: '10-12' },
    ],
  },
  {
    id: 'upper-lower-lower',
    name: 'Lower Body',
    description: 'Quads, Hamstrings, Glutes, Calves',
    category: 'intermediate',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Squat (Barbell)', sets: 4, repsRange: '6-10' },
      { exerciseName: 'Romanian Deadlift (Barbell)', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Leg Press', sets: 3, repsRange: '10-15' },
      { exerciseName: 'Leg Curl (Machine)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Standing Calf Raise (Machine)', sets: 4, repsRange: '12-15' },
    ],
  },

  // ===== FULL BODY =====
  {
    id: 'full-body-beginner',
    name: 'Full Body (Beginner)',
    description: 'Complete workout for all muscle groups',
    category: 'beginner',
    frequency: '3x/week',
    exercises: [
      { exerciseName: 'Squat (Barbell)', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Bench Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Row', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Dumbbell Shoulder Press', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Romanian Deadlift (Barbell)', sets: 3, repsRange: '8-12' },
      { exerciseName: 'Barbell Curl', sets: 2, repsRange: '10-12' },
      { exerciseName: 'Triceps Pushdown (Cable)', sets: 2, repsRange: '10-12' },
    ],
  },

  // ===== ARNOLD SPLIT =====
  {
    id: 'arnold-chest-back',
    name: 'Arnold Split: Chest & Back',
    description: 'Classic Arnold Schwarzenegger split',
    category: 'advanced',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Barbell Bench Press', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Incline Dumbbell Press', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Dumbbell Flyes', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Wide Grip Pull Up', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Barbell Row', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Deadlift (Barbell)', sets: 3, repsRange: '6-8' },
    ],
  },
  {
    id: 'arnold-shoulders-arms',
    name: 'Arnold Split: Shoulders & Arms',
    description: 'Classic Arnold Schwarzenegger split',
    category: 'advanced',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Dumbbell Shoulder Press', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Lateral Raise (Dumbbell)', sets: 4, repsRange: '12-15' },
      { exerciseName: 'Rear Delt Fly (Dumbbell)', sets: 3, repsRange: '12-15' },
      { exerciseName: 'Barbell Curl', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Hammer Curl (Dumbbell)', sets: 3, repsRange: '10-12' },
      { exerciseName: 'Close Grip Bench Press (Barbell)', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Overhead Triceps Extension (Dumbbell)', sets: 3, repsRange: '10-12' },
    ],
  },
  {
    id: 'arnold-legs',
    name: 'Arnold Split: Legs',
    description: 'Classic Arnold Schwarzenegger split',
    category: 'advanced',
    frequency: '2x/week',
    exercises: [
      { exerciseName: 'Squat (Barbell)', sets: 5, repsRange: '8-12' },
      { exerciseName: 'Leg Press', sets: 4, repsRange: '12-15' },
      { exerciseName: 'Romanian Deadlift (Barbell)', sets: 4, repsRange: '8-12' },
      { exerciseName: 'Leg Curl (Machine)', sets: 4, repsRange: '10-12' },
      { exerciseName: 'Leg Extension (Machine)', sets: 4, repsRange: '12-15' },
      { exerciseName: 'Standing Calf Raise (Machine)', sets: 5, repsRange: '15-20' },
    ],
  },

  // ===== MIKE MENTZER HIT =====
  {
    id: 'mentzer-workout-a',
    name: 'Heavy Duty: Workout A',
    description: 'Mike Mentzer High Intensity Training',
    category: 'advanced',
    frequency: '1x every 4-7 days',
    exercises: [
      { exerciseName: 'Squat (Barbell)', sets: 1, repsRange: '6-10', notes: 'To absolute failure' },
      { exerciseName: 'Leg Extension (Machine)', sets: 1, repsRange: '6-10', notes: 'Pre-exhaust, then to failure' },
      { exerciseName: 'Standing Calf Raise (Machine)', sets: 1, repsRange: '6-10', notes: 'To failure' },
      { exerciseName: 'Barbell Bench Press', sets: 1, repsRange: '6-10', notes: 'To failure' },
      { exerciseName: 'Dumbbell Flyes', sets: 1, repsRange: '6-10', notes: 'Pre-exhaust' },
    ],
  },
  {
    id: 'mentzer-workout-b',
    name: 'Heavy Duty: Workout B',
    description: 'Mike Mentzer High Intensity Training',
    category: 'advanced',
    frequency: '1x every 4-7 days',
    exercises: [
      { exerciseName: 'Deadlift (Barbell)', sets: 1, repsRange: '6-10', notes: 'To absolute failure' },
      { exerciseName: 'Lat Pulldown (Cable)', sets: 1, repsRange: '6-10', notes: 'To failure' },
      { exerciseName: 'Dumbbell Shoulder Press', sets: 1, repsRange: '6-10', notes: 'To failure' },
      { exerciseName: 'Lateral Raise (Dumbbell)', sets: 1, repsRange: '6-10', notes: 'Pre-exhaust' },
      { exerciseName: 'Close Grip Bench Press (Barbell)', sets: 1, repsRange: '6-10', notes: 'To failure' },
      { exerciseName: 'Barbell Curl', sets: 1, repsRange: '6-10', notes: 'To failure' },
    ],
  },
];

export const TEMPLATE_CATEGORIES = {
  beginner: { name: 'Beginner', color: 'text-green-400' },
  intermediate: { name: 'Intermediate', color: 'text-blue-400' },
  advanced: { name: 'Advanced', color: 'text-red-400' },
};
