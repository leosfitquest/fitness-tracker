export type RawExercise = {
  id: string;
  name: string;
  images: string[];
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  equipment?: string | null;
};

// Falls du noch keine Exercise-Daten hast, erstelle eine leere Liste:
export const RAW_EXERCISES: RawExercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    images: ["Barbell_Bench_Press/0.jpg"],
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Triceps", "Shoulders"],
    equipment: "Barbell",
  },
  {
    id: "squat",
    name: "Squat",
    images: ["Barbell_Squat/0.jpg"],
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Barbell",
  },
  // Füge mehr hinzu oder lade von API
];
