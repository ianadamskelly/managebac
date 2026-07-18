"use client";

import { useState, useRef } from "react";
import { saveTaskGrade } from "../actions";

type TaskCol = {
  id: string;
  title: string;
  dueAt: string;
  model: string;
  maxPoints: number | null;
  criteria: string[];
  categoryName: string | null;
  categoryColor: string | null;
};
type GradeCell = {
  taskId: string;
  studentId: string;
  points: number | null;
  criteriaLevels: Record<string, number> | null;
  complete: boolean | null;
};

export function GradebookGrid({
  classId,
  students,
  tasks,
  grades,
}: {
  classId: string;
  students: { id: string; name: string }[];
  tasks: TaskCol[];
  grades: GradeCell[];
}) {
  const [cells, setCells] = useState<Map<string, GradeCell>>(
    () => new Map(grades.map((g) => [`${g.taskId}:${g.studentId}`, g]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function persist(cell: GradeCell) {
    const key = `${cell.taskId}:${cell.studentId}`;
    setCells((m) => new Map(m).set(key, cell));
    setSaving(key);
    try {
      await saveTaskGrade(classId, cell.taskId, cell.studentId, {
        points: cell.points,
        criteriaLevels: cell.criteriaLevels ?? undefined,
        complete: cell.complete ?? undefined,
      });
      setSavedFlash(key);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setSavedFlash(null), 1200);
    } finally {
      setSaving(null);
    }
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No tasks yet — add a task first.</p>;
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        Auto-save: changes are saved as you edit. {saving ? "Saving…" : ""}
      </p>
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="text-sm min-w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium sticky left-0 bg-slate-50 min-w-44">Student</th>
              {tasks.map((t) => (
                <th key={t.id} className="px-3 py-2 font-medium min-w-36 align-top">
                  <p className="text-xs text-red-600 font-semibold">
                    {new Date(t.dueAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-slate-700 leading-snug line-clamp-2" title={t.title}>
                    {t.title}
                  </p>
                  {t.categoryName && (
                    <span
                      className="inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: t.categoryColor ?? "#64748b" }}
                    >
                      {t.categoryName}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 font-medium text-slate-800 sticky left-0 bg-white whitespace-nowrap">
                  {s.name}
                </td>
                {tasks.map((t) => {
                  const key = `${t.id}:${s.id}`;
                  const cell =
                    cells.get(key) ??
                    ({
                      taskId: t.id,
                      studentId: s.id,
                      points: null,
                      criteriaLevels: null,
                      complete: null,
                    } as GradeCell);
                  return (
                    <td
                      key={t.id}
                      className={`px-3 py-2 align-top transition-colors ${
                        savedFlash === key ? "bg-emerald-50" : ""
                      }`}
                    >
                      <CellEditor task={t} cell={cell} onChange={persist} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellEditor({
  task,
  cell,
  onChange,
}: {
  task: TaskCol;
  cell: GradeCell;
  onChange: (c: GradeCell) => void;
}) {
  if (task.model === "POINTS") {
    return (
      <div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={task.maxPoints ?? 1000}
            defaultValue={cell.points ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== cell.points) onChange({ ...cell, points: v });
            }}
            className="w-14 rounded border border-slate-300 px-1.5 py-1 text-sm text-right"
          />
          <span className="text-xs text-slate-400">/{task.maxPoints}</span>
        </div>
        {task.criteria.length > 0 && (
          <CriteriaPickers task={task} cell={cell} onChange={onChange} />
        )}
      </div>
    );
  }
  if (task.model === "CRITERIA") {
    return <CriteriaPickers task={task} cell={cell} onChange={onChange} />;
  }
  if (task.model === "BINARY") {
    return (
      <select
        defaultValue={cell.complete == null ? "" : cell.complete ? "yes" : "no"}
        onChange={(e) =>
          onChange({
            ...cell,
            complete: e.target.value === "" ? null : e.target.value === "yes",
          })
        }
        className="rounded border border-slate-300 px-1.5 py-1 text-xs"
      >
        <option value="">—</option>
        <option value="yes">Complete</option>
        <option value="no">Incomplete</option>
      </select>
    );
  }
  return <span className="text-xs text-slate-400">Comments only</span>;
}

function CriteriaPickers({
  task,
  cell,
  onChange,
}: {
  task: TaskCol;
  cell: GradeCell;
  onChange: (c: GradeCell) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {task.criteria.map((c) => (
        <label key={c} className="flex items-center gap-0.5 text-xs text-slate-500">
          {c}:
          <select
            defaultValue={cell.criteriaLevels?.[c] ?? ""}
            onChange={(e) => {
              const levels = { ...(cell.criteriaLevels ?? {}) };
              if (e.target.value === "") delete levels[c];
              else levels[c] = Number(e.target.value);
              onChange({ ...cell, criteriaLevels: levels });
            }}
            className="rounded border border-slate-300 px-1 py-0.5 text-xs"
          >
            <option value="">—</option>
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
