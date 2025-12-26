type ExerciseItemProps = {
  id: string;
  name: string;
  muscleGroup: string;
  imageUrl?: string;
  onClick: (id: string) => void;
};

export function ExerciseItem({
  id,
  name,
  muscleGroup,
  imageUrl,
  onClick,
}: ExerciseItemProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-xs hover:bg-slate-800 transition-colors"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="h-10 w-10 rounded-md object-cover border border-slate-700 flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex flex-col overflow-hidden">
        <span className="font-medium truncate">{name}</span>
        <span className="text-[10px] text-slate-400">{muscleGroup}</span>
      </div>
    </button>
  );
}
