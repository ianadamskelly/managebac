import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";
import { criterionLabel } from "@/lib/myp";
import { TaskBadges } from "../task-badges";
import { SubmitBox } from "./submit-box";
import { DeleteTaskButton } from "./delete-task-button";

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const { session, cls, canManage, isStudent } = await getClassContext(id);
  const task = await db.task.findFirst({
    where: { id: taskId, classId: cls.id },
    include: { category: true, submissions: true, unit: true },
  });
  if (!task) notFound();

  const students = cls.memberships.filter((m) => m.role === "STUDENT");
  const subByStudent = new Map(task.submissions.map((s) => [s.studentId, s]));
  const mySubmission = subByStudent.get(session.userId);

  const statusFor = (studentId: string) => {
    const sub = subByStudent.get(studentId);
    if (!sub) return { label: "WAITING", cls: "bg-slate-100 text-slate-600" };
    return sub.submittedAt <= task.dueAt
      ? { label: "EARLY", cls: "bg-emerald-100 text-emerald-800" }
      : { label: "LATE", cls: "bg-red-100 text-red-700" };
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="text-center w-14 shrink-0">
            <p className="text-xs font-semibold text-red-600 uppercase">
              {task.dueAt.toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p className="text-2xl font-bold text-slate-800 leading-tight">
              {task.dueAt.getDate()}
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
              {canManage && (
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/classes/${cls.id}/tasks/${task.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </a>
                  <DeleteTaskButton classId={cls.id} taskId={task.id} />
                </div>
              )}
            </div>
            <TaskBadges type={task.type} category={task.category} />
            <p className="text-sm text-slate-500 mt-2">
              Due{" "}
              {task.dueAt.toLocaleString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {task.maxPoints != null && <> · out of {task.maxPoints} points</>}
            </p>
          </div>
        </div>
        {task.unit && (
          <p className="mt-3 text-sm">
            <span className="text-slate-500">Unit: </span>
            <a
              href={`/classes/${cls.id}/units/${task.unit.id}`}
              className="text-blue-700 hover:underline font-medium"
            >
              {task.unit.title}
            </a>
          </p>
        )}
        {task.description && (
          <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
        )}
        {task.criteria.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-1">Assessment Criteria</h3>
            <ul className="text-sm text-slate-600 space-y-0.5">
              {task.criteria.map((c) => (
                <li key={c}>
                  Criterion {c}: {criterionLabel(cls.subject.subjectGroup, c)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {isStudent && task.dropboxEnabled && (
        <SubmitBox
          classId={cls.id}
          taskId={task.id}
          existing={
            mySubmission
              ? {
                  fileName: mySubmission.fileName,
                  submittedAt: mySubmission.submittedAt.toLocaleString(),
                  late: mySubmission.submittedAt > task.dueAt,
                }
              : null
          }
        />
      )}

      {canManage && task.dropboxEnabled && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">
              Dropbox ({task.submissions.length}/{students.length} submitted)
            </h2>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((m) => {
                const sub = subByStudent.get(m.userId);
                const st = statusFor(m.userId);
                return (
                  <tr key={m.userId} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {m.user.lastName}, {m.user.firstName}
                    </td>
                    <td className="px-5 py-3">
                      {sub ? (
                        <a
                          href={`/api/submissions/${sub.id}`}
                          className="text-blue-700 hover:underline"
                        >
                          {sub.fileName}
                        </a>
                      ) : (
                        <span className="text-slate-400">No submission</span>
                      )}
                      {sub && (
                        <span className="text-xs text-slate-400 ml-2">{fmtSize(sub.fileSize)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {sub ? sub.submittedAt.toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
