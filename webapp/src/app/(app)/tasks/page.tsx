import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { TaskBadges } from "../classes/[id]/tasks/task-badges";

export default async function TasksAndDeadlinesPage() {
  const session = (await getSession())!;
  const memberships = await db.classMembership.findMany({
    where: { userId: session.userId },
    select: { classId: true },
  });
  const classIds = memberships.map((m) => m.classId);

  const tasks = await db.task.findMany({
    where: { classId: { in: classIds } },
    include: {
      category: true,
      class: { include: { subject: true } },
      submissions: { where: { studentId: session.userId } },
    },
    orderBy: { dueAt: "asc" },
  });
  const now = new Date();
  const upcoming = tasks.filter((t) => t.dueAt >= now);
  const past = tasks.filter((t) => t.dueAt < now).reverse();

  const Section = ({ title, items }: { title: string; items: typeof tasks }) => (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <header className="px-5 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">
          {title} ({items.length})
        </h2>
      </header>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500 text-center">No tasks.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((t) => {
            const submitted = t.submissions.length > 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/classes/${t.classId}/tasks/${t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-xs font-semibold text-red-600 uppercase">
                        {t.dueAt.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-lg font-bold text-slate-800 leading-tight">
                        {t.dueAt.getDate()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.class.name ?? t.class.subject.name}
                        {t.class.section ? ` (${t.class.section})` : ""}
                      </p>
                      <TaskBadges type={t.type} category={t.category} />
                    </div>
                  </div>
                  {session.role === "STUDENT" && t.dropboxEnabled && (
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                        submitted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {submitted ? "SUBMITTED" : "WAITING"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tasks & Deadlines</h1>
      <Section title="Upcoming" items={upcoming} />
      <Section title="Past" items={past} />
    </div>
  );
}
