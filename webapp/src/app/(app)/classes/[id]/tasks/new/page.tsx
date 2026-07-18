import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { createTask } from "../../actions";
import { NewTaskForm } from "./new-task-form";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  if (!canManage) notFound();

  const [categories, units] = await Promise.all([
    db.taskCategory.findMany({
      where: { schoolId: cls.schoolId, programmeId: cls.programmeId },
      orderBy: { name: "asc" },
    }),
    db.unit.findMany({
      where: { classId: cls.id, status: { not: "ARCHIVED" } },
      orderBy: [{ startsOn: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const action = createTask.bind(null, cls.id);
  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Task</h2>
      <NewTaskForm
        action={action}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        units={units.map((u) => ({ id: u.id, title: u.title }))}
        isMyp={cls.programme.code === "myp"}
      />
    </div>
  );
}
