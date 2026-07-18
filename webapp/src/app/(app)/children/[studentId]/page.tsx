import Link from "next/link";
import { db } from "@/lib/db";
import { getChildContext } from "@/lib/parent";
import { mypFinalGrade, localEquivalent } from "@/lib/myp";
import { statusBadge } from "@/lib/activities";

export default async function ChildOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { student } = await getChildContext(studentId);

  const [classMemberships, termGrades, tasks, submissions, activities, reports] = await Promise.all([
    db.classMembership.findMany({
      where: { userId: studentId, role: "STUDENT" },
      include: {
        class: {
          include: {
            subject: true,
            memberships: { where: { role: "TEACHER" }, include: { user: true } },
          },
        },
      },
    }),
    db.termGrade.findMany({ where: { studentId } }),
    db.task.findMany({
      where: {
        class: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
      include: { class: { include: { subject: true } }, category: true },
      orderBy: { dueAt: "asc" },
    }),
    db.submission.findMany({ where: { studentId } }),
    db.activity.findMany({ where: { studentId } }),
    db.reportCard.findMany({
      where: { studentId, publishedAt: { not: null } },
      include: { term: { include: { academicYear: true } } },
      orderBy: { preparedOn: "desc" },
    }),
  ]);

  // Latest term grade per class
  const latestByClass = new Map<string, (typeof termGrades)[number]>();
  for (const g of termGrades) {
    const prev = latestByClass.get(g.classId);
    if (!prev || g.updatedAt > prev.updatedAt) latestByClass.set(g.classId, g);
  }
  const submittedTaskIds = new Set(submissions.map((s) => s.taskId));
  const now = new Date();
  const upcoming = tasks.filter((t) => t.dueAt >= now).slice(0, 8);

  const activityCounts = {
    total: activities.length,
    completed: activities.filter((a) => a.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/home" className="text-sm text-blue-600 hover:underline">
          ← My Children
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-sm text-slate-500">
          {student.gradeLevel?.name}
          {student.studentCode ? ` · ${student.studentCode}` : ""}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Classes & Grades</h2>
          <Link href={`/portfolio/${student.id}`} className="text-sm text-blue-600 hover:underline">
            View Portfolio
          </Link>
        </header>
        {classMemberships.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 text-center">Not enrolled in any classes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Class</th>
                <th className="px-5 py-2 font-medium">Teacher</th>
                <th className="px-5 py-2 font-medium text-right">Latest Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classMemberships.map((m) => {
                const grade = latestByClass.get(m.classId);
                const levels = (grade?.criteriaLevels as Record<string, number> | null) ?? null;
                const sum = levels ? Object.values(levels).reduce((a, b) => a + b, 0) : null;
                const final =
                  grade?.finalGrade ??
                  (levels && Object.keys(levels).length === 4 ? mypFinalGrade(sum!) : null);
                const teacher = m.class.memberships[0]?.user;
                return (
                  <tr key={m.classId} className="hover:bg-slate-50">
                    <td className="px-5 py-2 font-medium text-slate-800">
                      {m.class.name ?? m.class.subject.name}
                      {m.class.section ? ` (${m.class.section})` : ""}
                    </td>
                    <td className="px-5 py-2 text-slate-600">
                      {teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {final != null ? (
                        <span className="font-semibold text-slate-900">
                          {final}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            ({localEquivalent(final)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Upcoming Tasks ({upcoming.length})</h2>
        </header>
        {upcoming.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 text-center">No upcoming tasks.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.class.name ?? t.class.subject.name} ·{" "}
                    {t.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                {t.dropboxEnabled && (
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                      submittedTaskIds.has(t.id)
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {submittedTaskIds.has(t.id) ? "SUBMITTED" : "NOT SUBMITTED"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Report Cards ({reports.length})</h2>
        </header>
        {reports.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 text-center">
            No published reports yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.term.academicYear.name} · {r.term.name}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-2">Service & Activities</h2>
        <p className="text-sm text-slate-600">
          {activityCounts.total} experience{activityCounts.total === 1 ? "" : "s"} ·{" "}
          {activityCounts.completed} completed
        </p>
        {activities.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {activities.slice(0, 5).map((a) => {
              const st = statusBadge(a.status);
              return (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.badge}`}>
                    {st.label}
                  </span>
                  <span className="text-slate-700">{a.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
