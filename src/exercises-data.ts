// Import der JSON-Datei mit allen 800+ Übungen
import exercisesJson from './exercises-data.json';

export type RawExercise = {
  id: string;
  name: string;
  images: string[];
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  equipment?: string | null;
};

// Exportiere die Übungen aus der JSON-Datei
export const RAW_EXERCISES: RawExercise[] = exercisesJson as RawExercise[];
