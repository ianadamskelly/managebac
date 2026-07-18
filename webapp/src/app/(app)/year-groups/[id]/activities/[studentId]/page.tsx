import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import { activityProgramme, statusBadge } from "@/lib/activities";
import { AddActivityForm } from "./add-activity-form";
import { ReflectionForm } from "./reflection-form";
import { StatusButtons } from "./status-buttons";

export default async function WorksheetPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const { session, yg, canManage, isStudentMember } = await getYearGroupContext(id);

  if (isStudentMember && studentId !== session.userId) {
    redirect(`/year-groups/${id}/activities/${session.userId}`);
  }
  if (!isStudentMember && !canManage) redirect(`/year-groups/${id}`);

  const student = yg.memberships.find(
    (m) => m.userId === studentId && m.role === "STUDENT"
  )?.user;
  if (!student) notFound();

  const programme = activityProgramme(yg.programme.code);
  const activities = await db.activity.findMany({
    where: { yearGroupId: yg.id, studentId },
    include: {
      reflections: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const outcomesCovered = new Set(activities.flatMap((a) => a.outcomes));
  const totalHours = activities.reduce((sum, a) => sum + (a.hours ?? 0), 0);
  const strandLabel = (key: string) =>
    programme.strands.find((s) => s.key === key)?.label ?? key;
  const outcomeLabel = (key: string) =>
    programme.outcomes.find((o) => o.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-slate-500">{programme.fullName} Worksheet</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>
              {activities.length} experience{activities.length === 1 ? "" : "s"} ·{" "}
              {outcomesCovered.size}/{programme.outcomes.length} outcomes
            </p>
            {totalHours > 0 && <p>{totalHours} hours logged</p>}
          </div>
        </div>
      </section>

      {activities.map((a) => {
        const st = statusBadge(a.status);
        return (
          <section key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{a.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.badge}`}>
                    {st.label}
                  </span>
                  {a.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {strandLabel(c)}
                    </span>
                  ))}
                </div>
              </div>
              {canManage && (
                <StatusButtons yearGroupId={yg.id} activityId={a.id} current={a.status} />
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {a.startsOn && a.startsOn.toLocaleDateString()}
              {a.endsOn && ` — ${a.endsOn.toLocaleDateString()}`}
              {a.hours != null && ` · ${a.hours} hours`}
              {a.supervisorName && ` · Supervisor: ${a.supervisorName}`}
            </p>
            {a.description && (
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{a.description}</p>
            )}

            {a.outcomes.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Learning Outcomes</p>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-0.5">
                  {a.outcomes.map((o) => (
                    <li key={o}>{outcomeLabel(o)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Reflections & Evidence ({a.reflections.length})
              </p>
              <div className="space-y-3">
                {a.reflections.map((r) => (
                  <div key={r.id} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">
                      {r.author.firstName} {r.author.lastName} ·{" "}
                      {r.createdAt.toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.content}</p>
                  </div>
                ))}
              </div>
              <ReflectionForm yearGroupId={yg.id} activityId={a.id} />
            </div>
          </section>
        );
      })}

      {activities.length === 0 && (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No experiences yet — add the first one below.
        </p>
      )}

      <AddActivityForm
        yearGroupId={yg.id}
        studentId={studentId}
        strands={programme.strands}
        outcomes={programme.outcomes}
      />
    </div>
  );
}
