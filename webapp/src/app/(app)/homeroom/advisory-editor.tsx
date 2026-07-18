"use client";

import { useState } from "react";
import { saveAdvisoryComment } from "./actions";

export function AdvisoryEditor({
  termId,
  students,
}: {
  termId: string;
  students: { id: string; name: string; comment: string }[];
}) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [current] = useState(() => new Map(students.map((s) => [s.id, s.comment])));

  async function persist(studentId: string, comment: string) {
    if (current.get(studentId) === comment) return;
    current.set(studentId, comment);
    setSavingId(studentId);
    try {
      await saveAdvisoryComment({ studentId, termId, comment });
      setSavedId(studentId);
      setTimeout(() => setSavedId((s) => (s === studentId ? null : s)), 1500);
    } finally {
      setSavingId(null);
    }
  }

  if (students.length === 0) {
    return <p className="text-sm text-slate-500">No students in this year group.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Auto-saves when you click away. {savingId ? "Saving…" : ""}
      </p>
      {students.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-800">{s.name}</h3>
            {savedId === s.id && <span className="text-xs text-emerald-600">Saved</span>}
          </div>
          <textarea
            defaultValue={s.comment}
            rows={2}
            placeholder="Advisory comment for this term…"
            onBlur={(e) => persist(s.id, e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
}
