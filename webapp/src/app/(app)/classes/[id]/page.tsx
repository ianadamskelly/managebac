import Link from "next/link";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { TaskBadges } from "./tasks/task-badges";

export default async function ClassOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls } = await getClassContext(id);

  const [recentTasks, submissionCounts] = await Promise.all([
    db.task.findMany({
      where: { classId: cls.id },
      include: { category: true },
      orderBy: { dueAt: "desc" },
      take: 6,
    }),
    db.submission.groupBy({
      by: ["taskId"],
      where: { task: { classId: cls.id } },
      _count: true,
    }),
  ]);
  const teachers = cls.memberships.filter((m) => m.role === "TEACHER");
  const studentCount = cls.memberships.filter((m) => m.role === "STUDENT").length;
  const subsFor = (taskId: string) =>
    submissionCounts.find((s) => s.taskId === taskId)?._count ?? 0;

  return (
    <div className="space-y-6">
      {cls.bulletin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          {cls.bulletin}
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Teachers</h2>
        <div className="flex flex-wrap gap-2">
          {teachers.map((m) => (
            <span
              key={m.userId}
              className="rounded-full bg-blue-50 text-blue-800 text-sm px-3 py-1"
            >
              {m.user.firstName} {m.user.lastName}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Latest Activity</h2>
          <Link href={`/classes/${cls.id}/tasks`} className="text-sm text-blue-600 hover:underline">
            All Tasks
          </Link>
        </header>
        {recentTasks.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">No tasks yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentTasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/classes/${cls.id}/tasks/${t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    <TaskBadges type={t.type} category={t.category} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">
                      {t.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {subsFor(t.id)}/{studentCount} submitted
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
