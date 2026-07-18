import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import { activityProgramme, worksheetStatus } from "@/lib/activities";

export default async function ActivitiesRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, yg, canManage, isStudentMember } = await getYearGroupContext(id);

  // Students land on their own worksheet.
  if (isStudentMember) redirect(`/year-groups/${id}/activities/${session.userId}`);
  if (!canManage) redirect(`/year-groups/${id}`);

  const programme = activityProgramme(yg.programme.code);
  const students = yg.memberships.filter((m) => m.role === "STUDENT");

  const activities = await db.activity.findMany({
    where: { yearGroupId: yg.id },
    include: { _count: { select: { reflections: true } } },
  });

  const byStudent = new Map<
    string,
    { activities: number; completed: number; outcomes: Set<string>; reflections: number }
  >();
  for (const a of activities) {
    const entry =
      byStudent.get(a.studentId) ??
      { activities: 0, completed: 0, outcomes: new Set<string>(), reflections: 0 };
    entry.activities += 1;
    if (a.status === "COMPLETED") entry.completed += 1;
    for (const o of a.outcomes) entry.outcomes.add(o);
    entry.reflections += a._count.reflections;
    byStudent.set(a.studentId, entry);
  }

  const statusCounts = { tbd: 0, concern: 0, onTrack: 0, excellent: 0 };
  const rows = students.map((m) => {
    const c = byStudent.get(m.userId) ?? {
      activities: 0,
      completed: 0,
      outcomes: new Set<string>(),
      reflections: 0,
    };
    const status = worksheetStatus({
      activities: c.activities,
      completed: c.completed,
      outcomes: c.outcomes.size,
      reflections: c.reflections,
      totalOutcomes: programme.outcomes.length,
    });
    if (status.label === "To Be Determined") statusCounts.tbd++;
    else if (status.label === "Concern") statusCounts.concern++;
    else if (status.label === "On-track") statusCounts.onTrack++;
    else statusCounts.excellent++;
    return { m, c, status };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Chip label="Excellent" count={statusCounts.excellent} cls="bg-emerald-100 text-emerald-800" />
        <Chip label="On-track" count={statusCounts.onTrack} cls="bg-blue-100 text-blue-800" />
        <Chip label="Concern" count={statusCounts.concern} cls="bg-red-100 text-red-700" />
        <Chip label="To Be Determined" count={statusCounts.tbd} cls="bg-slate-100 text-slate-600" />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            {programme.fullName} — Students ({students.length})
          </h2>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Experiences</th>
              <th className="px-5 py-3 font-medium text-right">Outcomes</th>
              <th className="px-5 py-3 font-medium text-right">Reflections</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ m, c, status }) => (
              <tr key={m.userId} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/year-groups/${yg.id}/activities/${m.userId}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {m.user.lastName}, {m.user.firstName}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${status.badge}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-slate-600">{c.activities}</td>
                <td className="px-5 py-3 text-right text-slate-600">
                  {c.outcomes.size}/{programme.outcomes.length}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">{c.reflections}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Chip({ label, count, cls }: { label: string; count: number; cls: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${cls}`}>
      {label}: {count}
    </span>
  );
}
