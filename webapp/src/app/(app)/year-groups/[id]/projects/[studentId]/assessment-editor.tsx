"use client";

import { useState } from "react";
import { saveProjectAssessment } from "../actions";

export function AssessmentEditor({
  yearGroupId,
  enrollmentId,
  criteria,
  max,
  levels,
}: {
  yearGroupId: string;
  enrollmentId: string;
  criteria: { key: string; label: string }[];
  max: number;
  levels: Record<string, number>;
}) {
  const [current, setCurrent] = useState<Record<string, number>>(levels);
  const [saved, setSaved] = useState(false);
  const total = Object.values(current).reduce((a, b) => a + b, 0);

  async function change(key: string, value: string) {
    const next = { ...current };
    if (value === "") delete next[key];
    else next[key] = Number(value);
    setCurrent(next);
    await saveProjectAssessment(yearGroupId, enrollmentId, {
      criteriaLevels: Object.fromEntries(criteria.map((c) => [c.key, next[c.key] ?? null])),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">Assessment (Supervisor)</h3>
        <span className="text-sm text-slate-600">
          Total <span className="font-semibold text-slate-900">{total}</span>
          {saved && <span className="ml-2 text-xs text-emerald-600">Saved</span>}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {criteria.map((c) => (
          <div key={c.key}>
            <label className="block text-xs text-slate-500 mb-1" title={c.label}>
              {c.key}: {c.label}
            </label>
            <select
              value={current[c.key] ?? ""}
              onChange={(e) => change(c.key, e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {Array.from({ length: max + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
