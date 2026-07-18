"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveTermGrade } from "../actions";
import { mypFinalGrade, localEquivalent, ATL_SKILLS, ATL_RATINGS } from "@/lib/myp";

const CRITERIA = ["A", "B", "C", "D"] as const;

type StudentGrade = {
  studentId: string;
  criteriaLevels: Record<string, number>;
  finalGrade: number | null;
  atl: Record<string, string>;
  comment: string;
};

export function TermGradesEditor({
  classId,
  terms,
  activeTermId,
  students,
  criterionLabels,
  existing,
}: {
  classId: string;
  terms: { id: string; label: string }[];
  activeTermId: string;
  students: { id: string; name: string }[];
  criterionLabels: Record<string, string>;
  existing: StudentGrade[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Map<string, StudentGrade>>(
    () => new Map(existing.map((g) => [g.studentId, g]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  function rowFor(studentId: string): StudentGrade {
    return (
      rows.get(studentId) ?? {
        studentId,
        criteriaLevels: {},
        finalGrade: null,
        atl: {},
        comment: "",
      }
    );
  }

  async function persist(row: StudentGrade) {
    setRows((m) => new Map(m).set(row.studentId, row));
    setSavingId(row.studentId);
    try {
      await saveTermGrade(classId, {
        termId: activeTermId,
        studentId: row.studentId,
        criteriaLevels: Object.fromEntries(
          CRITERIA.map((c) => [c, row.criteriaLevels[c] ?? null])
        ) as Record<"A" | "B" | "C" | "D", number | null>,
        atl: Object.fromEntries(ATL_SKILLS.map((s) => [s, (row.atl[s] as never) ?? null])),
        comment: row.comment || undefined,
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select
          value={activeTermId}
          onChange={(e) => router.push(`/classes/${classId}/term-grades?term=${e.target.value}`)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          Auto-save on change. {savingId ? "Saving…" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {students.map((s) => (
          <StudentCard
            key={s.id}
            student={s}
            row={rowFor(s.id)}
            criterionLabels={criterionLabels}
            onChange={persist}
          />
        ))}
      </div>
    </div>
  );
}

function StudentCard({
  student,
  row,
  criterionLabels,
  onChange,
}: {
  student: { id: string; name: string };
  row: StudentGrade;
  criterionLabels: Record<string, string>;
  onChange: (row: StudentGrade) => void;
}) {
  const { sum, final } = useMemo(() => {
    const values = CRITERIA.map((c) => row.criteriaLevels[c]).filter((v) => v != null);
    const sum = values.reduce((a, b) => a + b, 0);
    return { sum, final: values.length === 4 ? mypFinalGrade(sum) : null };
  }, [row.criteriaLevels]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">{student.name}</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900">{final ?? "—"}</span>
          <span className="text-xs text-slate-500 ml-2">
            Sum: {sum} · Local: {final ? localEquivalent(final) : "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {CRITERIA.map((c) => (
          <div key={c}>
            <label className="block text-xs text-slate-500 mb-1 truncate" title={criterionLabels[c]}>
              {c}: {criterionLabels[c]}
            </label>
            <select
              value={row.criteriaLevels[c] ?? ""}
              onChange={(e) => {
                const levels = { ...row.criteriaLevels };
                if (e.target.value === "") delete levels[c];
                else levels[c] = Number(e.target.value);
                onChange({ ...row, criteriaLevels: levels });
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">N/A</option>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {ATL_SKILLS.map((skill) => (
          <div key={skill}>
            <label className="block text-xs text-slate-500 mb-1">{skill}</label>
            <select
              value={row.atl[skill] ?? ""}
              onChange={(e) => {
                const atl = { ...row.atl };
                if (e.target.value === "") delete atl[skill];
                else atl[skill] = e.target.value;
                onChange({ ...row, atl });
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {ATL_RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Term comment…"
        defaultValue={row.comment}
        rows={2}
        onBlur={(e) => {
          if (e.target.value !== row.comment) onChange({ ...row, comment: e.target.value });
        }}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </section>
  );
}
