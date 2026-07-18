import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AddEvidenceForm } from "./add-evidence-form";

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

// Can the viewer see this student's portfolio?
async function canView(
  session: { userId: string; schoolId: string; role: string },
  studentId: string
) {
  if (session.userId === studentId) return true;
  if (session.role === "ADMIN") return true;
  if (session.role === "TEACHER") {
    const shares = await db.classMembership.count({
      where: {
        userId: session.userId,
        role: "TEACHER",
        class: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
    });
    if (shares > 0) return true;
    const advises = await db.yearGroupMembership.count({
      where: {
        userId: session.userId,
        role: { not: "STUDENT" },
        yearGroup: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
    });
    if (advises > 0) return true;
  }
  return false;
}

export default async function PortfolioTimelinePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = (await getSession())!;
  if (!(await canView(session, studentId))) notFound();

  const student = await db.user.findFirst({
    where: { id: studentId, schoolId: session.schoolId, role: "STUDENT" },
  });
  if (!student) notFound();

  const [entries, submissions] = await Promise.all([
    db.portfolioEntry.findMany({
      where: { studentId },
      include: { student: true },
    }),
    db.submission.findMany({
      where: { studentId, task: { schoolId: session.schoolId } },
      include: { task: { include: { class: { include: { subject: true } }, category: true } } },
    }),
  ]);

  // Merge manual evidence and coursework submissions into one timeline.
  type Item = {
    id: string;
    when: Date;
    kind: string;
    title: string;
    body?: string | null;
    url?: string | null;
    fileHref?: string;
    fileName?: string | null;
    fileSize?: number | null;
    context?: string;
  };
  const items: Item[] = [
    ...entries.map((e) => ({
      id: `e-${e.id}`,
      when: e.createdAt,
      kind: e.type,
      title: e.title,
      body: e.content,
      url: e.url,
      fileHref: e.storagePath ? `/api/portfolio-files/${e.id}` : undefined,
      fileName: e.fileName,
      fileSize: e.fileSize,
      context: "Evidence of Learning",
    })),
    ...submissions.map((s) => ({
      id: `s-${s.id}`,
      when: s.submittedAt,
      kind: "SUBMISSION",
      title: s.task.title,
      fileHref: `/api/submissions/${s.id}`,
      fileName: s.fileName,
      fileSize: s.fileSize,
      context: `${s.task.class.name ?? s.task.class.subject.name} · ${
        s.submittedAt > s.task.dueAt ? "Late" : "On time"
      }`,
    })),
  ].sort((a, b) => b.when.getTime() - a.when.getTime());

  const canEdit = session.userId === studentId || session.role === "ADMIN" || session.role === "TEACHER";
  const kindBadge: Record<string, string> = {
    NOTE: "bg-slate-100 text-slate-700",
    WEBSITE: "bg-blue-100 text-blue-800",
    FILE: "bg-indigo-100 text-indigo-800",
    PHOTO: "bg-pink-100 text-pink-800",
    SUBMISSION: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Portfolio</h1>
        <p className="text-sm text-slate-500">
          {student.firstName} {student.lastName} · {items.length} items
        </p>
      </div>

      {canEdit && <AddEvidenceForm studentId={studentId} />}

      {items.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No portfolio items yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    kindBadge[item.kind] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.kind === "SUBMISSION" ? "Coursework" : item.kind.toLowerCase()}
                </span>
                <span className="text-xs text-slate-400">
                  {item.when.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {item.context && (
                  <span className="text-xs text-slate-400">· {item.context}</span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              {item.body && (
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{item.body}</p>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline break-all"
                >
                  {item.url}
                </a>
              )}
              {item.fileHref && (
                <a href={item.fileHref} className="text-sm text-blue-700 hover:underline">
                  {item.fileName}
                  {item.fileSize != null && (
                    <span className="text-slate-400 ml-2">{fmtSize(item.fileSize)}</span>
                  )}
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
