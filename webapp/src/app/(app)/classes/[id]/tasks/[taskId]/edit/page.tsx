import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { updateTask } from "../../../actions";
import { NewTaskForm } from "../../new/new-task-form";

// Format a Date as a local `datetime-local` input value (YYYY-MM-DDTHH:mm).
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const { cls, canManage } = await getClassContext(id);
  if (!canManage) notFound();

  const task = await db.task.findFirst({ where: { id: taskId, classId: cls.id } });
  if (!task) notFound();

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

  const action = updateTask.bind(null, cls.id, task.id);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Task</h2>
      <NewTaskForm
        action={action}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        units={units.map((u) => ({ id: u.id, title: u.title }))}
        isMyp={cls.programme.code === "myp"}
        submitLabel="Save Changes"
        initial={{
          title: task.title,
          type: task.type,
          categoryId: task.categoryId,
          model: task.model,
          maxPoints: task.maxPoints,
          criteria: task.criteria,
          unitId: task.unitId,
          dueAt: toLocalInput(task.dueAt),
          description: task.description ?? "",
          dropboxEnabled: task.dropboxEnabled,
        }}
      />
    </div>
  );
}
