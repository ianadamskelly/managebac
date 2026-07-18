import type { TaskCategory, TaskType } from "@prisma/client";

export function TaskBadges({
  type,
  category,
}: {
  type: TaskType;
  category: TaskCategory | null;
}) {
  return (
    <span className="inline-flex gap-1.5 mt-1">
      <span
        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
          type === "SUMMATIVE" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
        }`}
      >
        {type === "SUMMATIVE" ? "Summative" : "Formative"}
      </span>
      {category && (
        <span
          className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.name}
        </span>
      )}
    </span>
  );
}
