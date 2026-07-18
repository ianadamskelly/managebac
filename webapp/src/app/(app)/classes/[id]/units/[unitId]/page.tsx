import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { unitTemplate } from "@/lib/units";
import { TaskBadges } from "../../tasks/task-badges";
import { UnitPlanner } from "./unit-planner";

export default async function UnitPlannerPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const { cls, canManage } = await getClassContext(id);
  const unit = await db.unit.findFirst({
    where: { id: unitId, classId: cls.id },
    include: { tasks: { include: { category: true }, orderBy: { dueAt: "asc" } } },
  });
  if (!unit) notFound();
  if (!canManage && unit.status !== "ACTIVE") notFound();

  const template = unitTemplate(cls.programme.code);
  const sections = (unit.sections as Record<string, string> | null) ?? {};

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{unit.title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {cls.subject.name} · {cls.gradeLevel.name}
              {unit.startsOn &&
                ` · Starts ${unit.startsOn.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              {unit.durationWeeks && ` · ${unit.durationWeeks} weeks`}
            </p>
          </div>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
              unit.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-800"
                : unit.status === "DRAFT"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {unit.status.charAt(0) + unit.status.slice(1).toLowerCase()}
          </span>
        </div>
        {unit.description && (
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{unit.description}</p>
        )}
      </section>

      {unit.tasks.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <header className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Assessments in this unit</h3>
          </header>
          <ul className="divide-y divide-slate-100">
            {unit.tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/classes/${cls.id}/tasks/${t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    <TaskBadges type={t.type} category={t.category} />
                  </div>
                  <span className="text-xs text-slate-500">
                    {t.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <UnitPlanner
        classId={cls.id}
        unitId={unit.id}
        template={template}
        initialSections={sections}
        readOnly={!canManage}
      />
    </div>
  );
}
