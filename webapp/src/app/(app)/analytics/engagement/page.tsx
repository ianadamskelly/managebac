import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { engagementBucket } from "@/lib/analytics";
import { AnalyticsTabs, YearGroupPicker } from "../analytics-tabs";

export default async function EngagementAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ yg?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const { yg: ygParam } = await searchParams;

  const yearGroups = await db.yearGroup.findMany({
    where: {
      schoolId: session.schoolId,
      archived: false,
      memberships: { some: { role: "STUDENT" } },
    },
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

  const members = await db.yearGroupMembership.findMany({
    where: { yearGroupId: activeYg.id, role: "STUDENT" },
    include: { user: true },
    orderBy: { user: { lastName: "asc" } },
  });
  const studentIds = members.map((m) => m.userId);

  // For each student: count dropbox tasks in their classes, and their submissions, plus activities.
  const [classMemberships, submissions, activities] = await Promise.all([
    db.classMembership.findMany({
      where: { userId: { in: studentIds }, role: "STUDENT" },
      select: { userId: true, classId: true },
    }),
    db.submission.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, taskId: true },
    }),
    db.activity.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true },
    }),
  ]);

  const classIds = [...new Set(classMemberships.map((m) => m.classId))];
  const dropboxTasks = await db.task.findMany({
    where: { classId: { in: classIds }, dropboxEnabled: true },
    select: { id: true, classId: true },
  });
  const tasksByClass = new Map<string, number>();
  for (const t of dropboxTasks) tasksByClass.set(t.classId, (tasksByClass.get(t.classId) ?? 0) + 1);

  const classesByStudent = new Map<string, string[]>();
  for (const m of classMemberships) {
    const arr = classesByStudent.get(m.userId) ?? [];
    arr.push(m.classId);
    classesByStudent.set(m.userId, arr);
  }
  const submittedByStudent = new Map<string, number>();
  for (const s of submissions) {
    submittedByStudent.set(s.studentId, (submittedByStudent.get(s.studentId) ?? 0) + 1);
  }
  const activitiesByStudent = new Map<string, number>();
  for (const a of activities) {
    activitiesByStudent.set(a.studentId, (activitiesByStudent.get(a.studentId) ?? 0) + 1);
  }

  const counts = { not: 0, risk: 0, ontrack: 0, high: 0 };
  const rows = members.map((m) => {
    const totalTasks = (classesByStudent.get(m.userId) ?? []).reduce(
      (sum, cid) => sum + (tasksByClass.get(cid) ?? 0),
      0
    );
    const submitted = submittedByStudent.get(m.userId) ?? 0;
    const bucket = engagementBucket({ totalTasks, submitted, lastAccessAt: m.user.lastAccessAt });
    counts[bucket.key as keyof typeof counts]++;
    return {
      user: m.user,
      totalTasks,
      submitted,
      rate: totalTasks > 0 ? Math.round((submitted / totalTasks) * 100) : null,
      activities: activitiesByStudent.get(m.userId) ?? 0,
      bucket,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
      <AnalyticsTabs />

      <div className="flex flex-wrap items-center gap-3">
        <YearGroupPicker
          yearGroups={yearGroups.map((y) => ({ id: y.id, name: y.name }))}
          activeId={activeYg.id}
          basePath="/analytics/engagement"
        />
        <span className="text-sm text-slate-500">{studentIds.length} students</span>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Bucket label="Highly Engaged" value={counts.high} color="bg-emerald-500" />
        <Bucket label="On-Track" value={counts.ontrack} color="bg-blue-500" />
        <Bucket label="At-Risk" value={counts.risk} color="bg-amber-500" />
        <Bucket label="Not Engaged" value={counts.not} color="bg-red-500" />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Students</h2>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Student</th>
              <th className="px-5 py-2 font-medium">Status</th>
              <th className="px-5 py-2 font-medium text-right">Task Completion</th>
              <th className="px-5 py-2 font-medium text-right">Activities</th>
              <th className="px-5 py-2 font-medium text-right">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.user.id} className="hover:bg-slate-50">
                <td className="px-5 py-2 font-medium text-slate-800">
                  {r.user.lastName}, {r.user.firstName}
                </td>
                <td className="px-5 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${r.bucket.badge}`}>
                    {r.bucket.label}
                  </span>
                </td>
                <td className="px-5 py-2 text-right text-slate-600">
                  {r.totalTasks === 0 ? (
                    <span className="text-slate-400">No tasks</span>
                  ) : (
                    <>
                      {r.submitted}/{r.totalTasks} ({r.rate}%)
                    </>
                  )}
                </td>
                <td className="px-5 py-2 text-right text-slate-600">{r.activities}</td>
                <td className="px-5 py-2 text-right text-slate-600">
                  {r.user.lastAccessAt ? r.user.lastAccessAt.toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Bucket({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
