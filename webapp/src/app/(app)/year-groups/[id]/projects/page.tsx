import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import { PROJECT_TYPE_LABELS, projectCriterionLabel, projectStatusBadge } from "@/lib/projects";

export default async function ProjectsRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, yg, canManage, isStudentMember } = await getYearGroupContext(id);

  // Student → own workspace.
  if (isStudentMember) redirect(`/year-groups/${id}/projects/${session.userId}`);
  if (!canManage) redirect(`/year-groups/${id}`);

  const project = await db.project.findFirst({
    where: { yearGroupId: yg.id },
    include: {
      enrollments: {
        include: { student: true, supervisor: true },
        orderBy: { student: { lastName: "asc" } },
      },
    },
  });
  if (!project) redirect(`/year-groups/${id}`);

  // Group enrollments by supervisor
  const groups = new Map<string, { name: string; rows: typeof project.enrollments }>();
  for (const e of project.enrollments) {
    const key = e.supervisorId ?? "none";
    const name = e.supervisor
      ? `${e.supervisor.firstName} ${e.supervisor.lastName}`
      : "Unassigned";
    if (!groups.has(key)) groups.set(key, { name, rows: [] });
    groups.get(key)!.rows.push(e);
  }

  const total = (levels: unknown) =>
    Object.values((levels as Record<string, number> | null) ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {PROJECT_TYPE_LABELS[project.type] ?? project.name}
        </h2>
        <p className="text-sm text-slate-500">Grouped by supervisor</p>
      </div>

      {[...groups.values()].map((group) => (
        <section
          key={group.name}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">{group.name}</h3>
          </header>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Student</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium text-right">Total</th>
                {project.criteria.map((c) => (
                  <th key={c} className="px-3 py-2 font-medium text-right" title={projectCriterionLabel(project.type, c)}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.rows.map((e) => {
                const st = projectStatusBadge(e.status);
                const levels = (e.criteriaLevels as Record<string, number> | null) ?? {};
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2">
                      <Link
                        href={`/year-groups/${yg.id}/projects/${e.studentId}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {e.student.lastName}, {e.student.firstName}
                      </Link>
                    </td>
                    <td className="px-5 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.badge}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right font-medium text-slate-800">
                      {total(e.criteriaLevels) || "—"}
                    </td>
                    {project.criteria.map((c) => (
                      <td key={c} className="px-3 py-2 text-right text-slate-600">
                        {levels[c] ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
