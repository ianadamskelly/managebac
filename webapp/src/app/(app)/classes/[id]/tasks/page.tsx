import Link from "next/link";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { TaskBadges } from "./task-badges";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  const now = new Date();
  const tasks = await db.task.findMany({
    where: { classId: cls.id },
    include: { category: true, _count: { select: { submissions: true } } },
    orderBy: { dueAt: "asc" },
  });
  const studentCount = cls.memberships.filter((m) => m.role === "STUDENT").length;
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
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/classes/${cls.id}/tasks/${t.id}`}
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
                    <TaskBadges type={t.type} category={t.category} />
                  </div>
                </div>
                <div className="text-right shrink-0 text-xs text-slate-500">
                  {t.dropboxEnabled && (
                    <p>
                      {t._count.submissions}/{studentCount} submitted
                    </p>
                  )}
                  {t.maxPoints != null && <p>out of {t.maxPoints} pts</p>}
                  {t.criteria.length > 0 && <p>Criteria {t.criteria.join(", ")}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Link
            href={`/classes/${cls.id}/tasks/new`}
            className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
          >
            Add Task
          </Link>
        </div>
      )}
      <Section title="Upcoming Tasks" items={upcoming} />
      <Section title="Past Tasks" items={past} />
    </div>
  );
}
