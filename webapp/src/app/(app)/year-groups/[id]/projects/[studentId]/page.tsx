import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import {
  PROJECT_TYPE_LABELS,
  projectCriterionLabel,
  projectCriterionMax,
  projectStatusBadge,
} from "@/lib/projects";
import { GoalsEditor } from "./goals-editor";
import { JournalForm } from "./journal-form";
import { MeetingForm } from "./meeting-form";
import { AssessmentEditor } from "./assessment-editor";
import { StatusSelect } from "./status-select";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const { session, yg, canManage, isStudentMember } = await getYearGroupContext(id);

  if (isStudentMember && studentId !== session.userId) {
    redirect(`/year-groups/${id}/projects/${session.userId}`);
  }
  if (!isStudentMember && !canManage) redirect(`/year-groups/${id}`);

  const project = await db.project.findFirst({ where: { yearGroupId: yg.id } });
  if (!project) notFound();

  const enrollment = await db.projectEnrollment.findFirst({
    where: { projectId: project.id, studentId },
    include: {
      student: true,
      supervisor: true,
      meetings: { orderBy: { meetingDate: "desc" } },
      journal: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!enrollment) notFound();

  const isOwner = isStudentMember && enrollment.studentId === session.userId;
  const canEditGoals = isOwner || canManage;
  const st = projectStatusBadge(enrollment.status);
  const levels = (enrollment.criteriaLevels as Record<string, number> | null) ?? {};
  const total = Object.values(levels).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {enrollment.student.firstName} {enrollment.student.lastName}
            </h2>
            <p className="text-sm text-slate-500">
              {PROJECT_TYPE_LABELS[project.type] ?? project.name}
              {enrollment.supervisor &&
                ` · Supervisor: ${enrollment.supervisor.firstName} ${enrollment.supervisor.lastName}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {Object.keys(levels).length > 0 && (
              <span className="text-sm text-slate-600">
                Total <span className="font-semibold text-slate-900">{total}</span>
              </span>
            )}
            {canEditGoals ? (
              <StatusSelect yearGroupId={yg.id} enrollmentId={enrollment.id} current={enrollment.status} />
            ) : (
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.badge}`}>
                {st.label}
              </span>
            )}
          </div>
        </div>
      </section>

      <GoalsEditor
        yearGroupId={yg.id}
        enrollmentId={enrollment.id}
        learningGoal={enrollment.learningGoal ?? ""}
        productGoal={enrollment.productGoal ?? ""}
        readOnly={!canEditGoals}
      />

      {canManage && (
        <AssessmentEditor
          yearGroupId={yg.id}
          enrollmentId={enrollment.id}
          criteria={project.criteria.map((c) => ({
            key: c,
            label: projectCriterionLabel(project.type, c),
          }))}
          max={projectCriterionMax(project.type)}
          levels={levels}
        />
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">
          Journal ({enrollment.journal.length})
        </h3>
        {(isOwner || canManage) && (
          <JournalForm yearGroupId={yg.id} enrollmentId={enrollment.id} />
        )}
        <div className="space-y-3 mt-4">
          {enrollment.journal.map((j) => (
            <div key={j.id} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">
                {j.author.firstName} {j.author.lastName} · {j.createdAt.toLocaleDateString()}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{j.content}</p>
            </div>
          ))}
          {enrollment.journal.length === 0 && (
            <p className="text-sm text-slate-500">No journal entries yet.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">
          Meetings with Supervisor ({enrollment.meetings.length})
        </h3>
        {canManage && <MeetingForm yearGroupId={yg.id} enrollmentId={enrollment.id} />}
        <div className="space-y-3 mt-4">
          {enrollment.meetings.map((m) => (
            <div key={m.id} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">
                {m.meetingDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.notes}</p>
            </div>
          ))}
          {enrollment.meetings.length === 0 && (
            <p className="text-sm text-slate-500">No meetings logged yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
