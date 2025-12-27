import React, { useState } from "react";
import type { Exercise } from "../App";

type ExerciseBrowserProps = {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
};

export const ExerciseBrowser: React.FC<ExerciseBrowserProps> = ({ exercises, onSelectExercise }) => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string>("all");

  const muscleGroups = ["all", "chest", "back", "legs", "shoulders", "arms", "core", "glutes"];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Exercise Library</h1>
        <p className="text-slate-400 text-sm">Browse {exercises.length} exercises</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 mb-4"
        />

        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => setMuscleFilter(group)}
              className={`px-3 py-1 text-xs uppercase rounded-md border transition-all ${
                muscleFilter === group
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredExercises.slice(0, 50).map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelectExercise(ex)}
            className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg p-4 transition-all text-left flex items-center gap-4"
          >
            {ex.imageUrl && (
              <img src={ex.imageUrl} alt={ex.name} className="w-16 h-16 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-white">{ex.name}</h3>
              <p className="text-xs text-slate-400 uppercase">{ex.muscleGroup}</p>
            </div>
          </button>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 text-slate-400">No exercises found</div>
      )}
    </div>
  );
};
