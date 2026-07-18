import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { mypFinalGrade, localEquivalent } from "@/lib/myp";

export default async function ProofingPage({
  params,
  searchParams,
}: {
  params: Promise<{ yearGroupId: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const { yearGroupId } = await params;
  const { term: termParam } = await searchParams;

  const yg = await db.yearGroup.findFirst({
    where: { id: yearGroupId, schoolId: session.schoolId },
    include: {
      gradeLevel: true,
      programme: true,
      memberships: { where: { role: "STUDENT" }, include: { user: true }, orderBy: { user: { lastName: "asc" } } },
    },
  });
  if (!yg) notFound();

  const terms = await db.term.findMany({
    where: { academicYear: { schoolId: session.schoolId, programmeId: yg.programmeId } },
    include: { academicYear: true },
    orderBy: [{ academicYear: { startsOn: "desc" } }, { order: "asc" }],
  });
  if (terms.length === 0) {
    return <p className="text-sm text-slate-500">No terms configured for this programme.</p>;
  }
  const activeTerm = terms.find((t) => t.id === termParam) ?? terms[0];

  const studentIds = yg.memberships.map((m) => m.userId);
  const [classes, termGrades] = await Promise.all([
    db.class.findMany({
      where: {
        schoolId: session.schoolId,
        termLinks: { some: { termId: activeTerm.id } },
        memberships: { some: { userId: { in: studentIds }, role: "STUDENT" } },
      },
      include: { subject: true, memberships: { where: { role: "STUDENT" }, select: { userId: true } } },
      orderBy: { subject: { name: "asc" } },
    }),
    db.termGrade.findMany({ where: { termId: activeTerm.id, studentId: { in: studentIds } } }),
  ]);

  // grade lookup: studentId -> classId -> final grade
  const gradeMap = new Map<string, Map<string, { final: number | null; hasComment: boolean }>>();
  for (const g of termGrades) {
    const levels = (g.criteriaLevels as Record<string, number> | null) ?? null;
    const sum = levels ? Object.values(levels).reduce((a, b) => a + b, 0) : null;
    const final = g.finalGrade ?? (levels && Object.keys(levels).length === 4 ? mypFinalGrade(sum!) : null);
    if (!gradeMap.has(g.studentId)) gradeMap.set(g.studentId, new Map());
    gradeMap.get(g.studentId)!.set(g.classId, { final, hasComment: !!g.comment?.trim() });
  }
  const classMembers = new Map(classes.map((c) => [c.id, new Set(c.memberships.map((m) => m.userId))]));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/reporting" className="text-sm text-blue-600 hover:underline">
          ← Reporting
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">{yg.name}</h1>
        <p className="text-sm text-slate-500">
          {yg.programme.name}: {yg.gradeLevel.name} · Proofing &amp; Review
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {terms.map((t) => (
          <Link
            key={t.id}
            href={`/reporting/proofing/${yg.id}?term=${t.id}`}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              t.id === activeTerm.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.academicYear.name} · {t.name}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="text-sm min-w-full">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium sticky left-0 bg-slate-50">Student</th>
              {classes.map((c) => (
                <th key={c.id} className="px-3 py-3 font-medium text-center min-w-28">
                  {c.subject.name}
                  {c.section ? ` (${c.section})` : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yg.memberships.map((m) => (
              <tr key={m.userId} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800 sticky left-0 bg-white whitespace-nowrap">
                  {m.user.lastName}, {m.user.firstName}
                </td>
                {classes.map((c) => {
                  const enrolled = classMembers.get(c.id)?.has(m.userId);
                  const cell = gradeMap.get(m.userId)?.get(c.id);
                  return (
                    <td key={c.id} className="px-3 py-2 text-center">
                      {!enrolled ? (
                        <span className="text-slate-300">·</span>
                      ) : cell?.final != null ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-slate-800">{cell.final}</span>
                          <span className="text-xs text-slate-400">
                            {localEquivalent(cell.final)}
                          </span>
                          {cell.hasComment && (
                            <span title="Has comment" className="text-emerald-500">
                              💬
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-500" title="No grade entered">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Bold number = MYP final grade (1&ndash;7) with local equivalent. 💬 = teacher comment
        present. &mdash; = enrolled but ungraded.
      </p>
    </div>
  );
}
