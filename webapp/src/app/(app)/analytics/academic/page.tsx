import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { localEquivalent } from "@/lib/myp";
import { achievementBucket, finalFromCriteria } from "@/lib/analytics";
import { AnalyticsTabs, YearGroupPicker } from "../analytics-tabs";

export default async function AcademicAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ yg?: string; term?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const { yg: ygParam, term: termParam } = await searchParams;

  const yearGroups = await db.yearGroup.findMany({
    where: {
      schoolId: session.schoolId,
      archived: false,
      memberships: { some: { role: "STUDENT" } },
    },
    include: { gradeLevel: true, programme: true },
    orderBy: { gradeLevel: { order: "desc" } },
  });

  if (yearGroups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <AnalyticsTabs />
        <p className="text-sm text-slate-500">No cohorts with students yet.</p>
      </div>
    );
  }

  const activeYg = yearGroups.find((y) => y.id === ygParam) ?? yearGroups[0];

  const terms = await db.term.findMany({
    where: { academicYear: { schoolId: session.schoolId, programmeId: activeYg.programmeId } },
    include: { academicYear: true },
    orderBy: [{ academicYear: { startsOn: "desc" } }, { order: "asc" }],
  });
  const activeTerm = terms.find((t) => t.id === termParam) ?? terms[0];

  const students = await db.yearGroupMembership.findMany({
    where: { yearGroupId: activeYg.id, role: "STUDENT" },
    select: { userId: true },
  });
  const studentIds = students.map((s) => s.userId);

  const termGrades = activeTerm
    ? await db.termGrade.findMany({
        where: { termId: activeTerm.id, studentId: { in: studentIds } },
        include: { class: { include: { subject: true } } },
      })
    : [];

  // Build final grades
  const entries = termGrades
    .map((g) => ({
      studentId: g.studentId,
      subject: `${g.class.name ?? g.class.subject.name}${g.class.section ? ` (${g.class.section})` : ""}`,
      final: finalFromCriteria(g.criteriaLevels as Record<string, number> | null, g.finalGrade),
    }))
    .filter((e) => e.final != null) as { studentId: string; subject: string; final: number }[];

  // Achievement snapshot buckets (by grade entry)
  const buckets = { concern: 0, onTrack: 0, excellent: 0 };
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const e of entries) {
    buckets[achievementBucket(e.final)]++;
    dist[e.final] = (dist[e.final] ?? 0) + 1;
    const s = bySubject.get(e.subject) ?? { sum: 0, n: 0 };
    s.sum += e.final;
    s.n++;
    bySubject.set(e.subject, s);
  }
  const totalEntries = entries.length;
  const maxDist = Math.max(1, ...Object.values(dist));
  const gradedStudents = new Set(entries.map((e) => e.studentId)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
      </div>
      <AnalyticsTabs />

      <div className="flex flex-wrap items-center gap-3">
        <YearGroupPicker
          yearGroups={yearGroups.map((y) => ({ id: y.id, name: y.name }))}
          activeId={activeYg.id}
          basePath="/analytics/academic"
          extraParam={activeTerm ? `term=${activeTerm.id}` : undefined}
        />
        <span className="text-sm text-slate-500">
          {activeYg.programme.name} · {activeTerm ? `${activeTerm.academicYear.name} · ${activeTerm.name}` : "No term"}
          {" · "}
          {gradedStudents}/{studentIds.length} students graded
        </span>
      </div>

      {totalEntries === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No term grades recorded for this cohort and term yet.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SnapshotCard label="Concern" value={buckets.concern} total={totalEntries} color="bg-red-500" />
            <SnapshotCard label="On-Track" value={buckets.onTrack} total={totalEntries} color="bg-blue-500" />
            <SnapshotCard label="Excellent" value={buckets.excellent} total={totalEntries} color="bg-emerald-500" />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Grade Distribution</h2>
            <div className="space-y-2">
              {[7, 6, 5, 4, 3, 2, 1].map((grade) => (
                <div key={grade} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-slate-600 shrink-0">
                    {grade}{" "}
                    <span className="text-xs text-slate-400">({localEquivalent(grade)})</span>
                  </span>
                  <div className="flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${(dist[grade] / maxDist) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-slate-600">{dist[grade]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Subject Averages</h2>
            </header>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Subject</th>
                  <th className="px-5 py-2 font-medium text-right">Graded</th>
                  <th className="px-5 py-2 font-medium text-right">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...bySubject.entries()]
                  .sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)
                  .map(([subject, s]) => {
                    const avg = s.sum / s.n;
                    return (
                      <tr key={subject} className="hover:bg-slate-50">
                        <td className="px-5 py-2 text-slate-800">{subject}</td>
                        <td className="px-5 py-2 text-right text-slate-600">{s.n}</td>
                        <td className="px-5 py-2 text-right font-medium text-slate-900">
                          {avg.toFixed(1)}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            ({localEquivalent(Math.round(avg))})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{pct}% of grade entries</p>
    </div>
  );
}
