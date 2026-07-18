"use client";

import type { ReportContent } from "@/lib/reports";

export function ReportCardView({
  content,
  title,
  preparedOn,
  schoolName,
  draft,
}: {
  content: ReportContent;
  title: string;
  preparedOn: string;
  schoolName: string;
  draft: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${
            draft ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {draft ? "Draft — not yet published" : "Published"}
        </span>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <header className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-700 text-white flex items-center justify-center text-lg font-bold">
              {schoolName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{schoolName}</h1>
              <p className="text-sm text-slate-500">{title}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 mt-4 text-sm">
            <div>
              <dt className="text-slate-400 text-xs">Student</dt>
              <dd className="text-slate-800 font-medium">{content.student.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Grade</dt>
              <dd className="text-slate-800">{content.student.gradeLevel}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Term</dt>
              <dd className="text-slate-800">{content.term.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Prepared</dt>
              <dd className="text-slate-800">{preparedOn}</dd>
            </div>
          </dl>
        </header>

        {/* Subjects */}
        <div className="space-y-5">
          {content.subjects.map((s, i) => (
            <section key={i} className="border border-slate-200 rounded-lg p-4 break-inside-avoid">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{s.className}</h2>
                  <p className="text-xs text-slate-500">
                    {s.subjectGroup}
                    {s.teacher ? ` · ${s.teacher}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {s.finalGrade != null ? (
                    <>
                      <span className="text-2xl font-bold text-slate-900">{s.finalGrade}</span>
                      {s.localGrade && (
                        <span className="text-sm text-slate-500 ml-1">({s.localGrade})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Not graded</span>
                  )}
                </div>
              </div>
              {s.criteria.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.criteria.map((c) => (
                    <span
                      key={c.key}
                      className="rounded bg-slate-100 text-slate-700 text-xs px-2 py-1"
                      title={c.label}
                    >
                      {c.key}: {c.label} — <strong>{c.level}</strong>
                    </span>
                  ))}
                </div>
              )}
              {s.comment && (
                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{s.comment}</p>
              )}
            </section>
          ))}
          {content.subjects.length === 0 && (
            <p className="text-sm text-slate-500">No subjects recorded for this term.</p>
          )}
        </div>
      </article>
    </div>
  );
}
