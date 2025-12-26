// Typ für einen Eintrag aus dem Datensatz
export type RawExercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  images: string[];
  category: string;
  // weitere Felder kannst du bei Bedarf ergänzen
};

// JSON importieren (du hast es in src/exercises-data.json)
import raw from "./exercises-data.json";

export const RAW_EXERCISES = raw as RawExercise[];
