import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { criterionLabel } from "@/lib/myp";
import { TermGradesEditor } from "./term-grades-editor";

export default async function TermGradesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { id } = await params;
  const { term: termParam } = await searchParams;
  const { cls, canManage } = await getClassContext(id);
  if (!canManage) notFound();

  const terms = cls.termLinks
    .map((l) => l.term)
    .sort((a, b) => a.startsOn.getTime() - b.startsOn.getTime());
  if (terms.length === 0) return <p className="text-sm text-slate-500">No linked terms.</p>;
  const activeTerm = terms.find((t) => t.id === termParam) ?? terms[0];

  const termGrades = await db.termGrade.findMany({
    where: { classId: cls.id, termId: activeTerm.id },
  });
  const students = cls.memberships
    .filter((m) => m.role === "STUDENT")
    .map((m) => ({ id: m.userId, name: `${m.user.lastName}, ${m.user.firstName}` }));

  const criterionLabels = Object.fromEntries(
    (["A", "B", "C", "D"] as const).map((c) => [c, criterionLabel(cls.subject.subjectGroup, c)])
  );

  return (
    <TermGradesEditor
      classId={cls.id}
      terms={terms.map((t) => ({
        id: t.id,
        label: `${t.academicYear?.name ?? ""} ${t.name}`.trim(),
      }))}
      activeTermId={activeTerm.id}
      students={students}
      criterionLabels={criterionLabels}
      existing={termGrades.map((g) => ({
        studentId: g.studentId,
        criteriaLevels: (g.criteriaLevels as Record<string, number> | null) ?? {},
        finalGrade: g.finalGrade,
        atl: (g.atl as Record<string, string> | null) ?? {},
        comment: g.comment ?? "",
      }))}
    />
  );
}
