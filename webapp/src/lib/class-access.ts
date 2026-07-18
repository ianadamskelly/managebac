import { notFound } from "next/navigation";
import { db } from "./db";
import { getSession, type SessionData } from "./session";

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) notFound();
  return session;
}

/**
 * Load a class scoped to the viewer's school and work out what they may do.
 * - Admins and the class's teachers can manage (create tasks, grade).
 * - Student members see the student view (own submissions/grades only).
 */
export async function getClassContext(classId: string) {
  const session = await requireSession();
  const cls = await db.class.findFirst({
    where: { id: classId, schoolId: session.schoolId },
    include: {
      programme: true,
      subject: true,
      gradeLevel: true,
      termLinks: { include: { term: { include: { academicYear: true } } } },
      memberships: { include: { user: true }, orderBy: { user: { lastName: "asc" } } },
    },
  });
  if (!cls) notFound();

  const membership = cls.memberships.find((m) => m.userId === session.userId);
  const isTeacher = membership?.role === "TEACHER";
  const canManage = session.role === "ADMIN" || isTeacher;
  const isStudent = membership?.role === "STUDENT";

  return { session, cls, canManage, isStudent };
}

export function classDisplayName(cls: {
  name: string | null;
  section: string | null;
  subject: { name: string };
}) {
  return `${cls.name ?? cls.subject.name}${cls.section ? ` (${cls.section})` : ""}`;
}
