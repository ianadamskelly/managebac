import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { GradebookGrid } from "./gradebook-grid";

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  if (!canManage) notFound();

  const [tasks, grades] = await Promise.all([
    db.task.findMany({
      where: { classId: cls.id },
      include: { category: true },
      orderBy: { dueAt: "asc" },
    }),
    db.taskGrade.findMany({ where: { task: { classId: cls.id } } }),
  ]);
  const students = cls.memberships
    .filter((m) => m.role === "STUDENT")
    .map((m) => ({
      id: m.userId,
      name: `${m.user.lastName}, ${m.user.firstName}`,
    }));

  return (
    <GradebookGrid
      classId={cls.id}
      students={students}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt.toISOString(),
        model: t.model,
        maxPoints: t.maxPoints,
        criteria: t.criteria,
        categoryName: t.category?.name ?? null,
        categoryColor: t.category?.color ?? null,
      }))}
      grades={grades.map((g) => ({
        taskId: g.taskId,
        studentId: g.studentId,
        points: g.points,
        criteriaLevels: (g.criteriaLevels as Record<string, number> | null) ?? null,
        complete: g.complete,
      }))}
    />
  );
}
