interface ExerciseItemProps {
  id: string;
  name: string;
  muscleGroup: string;
  imageUrl?: string;
  onAdd: (id: string) => void; // 🆕 NEU: onAdd hinzugefügt
  onInfoClick: () => void;
}

export function ExerciseItem({
  id,
  name,
  muscleGroup,
  imageUrl,
  onAdd,
  onInfoClick,
}: ExerciseItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition-all">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-10 h-10 rounded object-cover"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-slate-500 uppercase">{muscleGroup}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInfoClick();
        }}
        className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
        title="Info"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <button
        onClick={() => onAdd(id)}
        className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-black rounded font-medium transition-all"
      >
        +
      </button>
    </div>
  );
}