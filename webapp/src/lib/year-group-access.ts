import { notFound } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

/**
 * Load a year group scoped to the viewer's school and work out permissions.
 * - Admins, school teachers, and YG advisors can manage worksheets
 *   (approve activities, view every student).
 * - Student members see only their own worksheet.
 */
export async function getYearGroupContext(yearGroupId: string) {
  const session = await getSession();
  if (!session) notFound();

  const yg = await db.yearGroup.findFirst({
    where: { id: yearGroupId, schoolId: session.schoolId },
    include: {
      programme: true,
      gradeLevel: true,
      memberships: { include: { user: true }, orderBy: { user: { lastName: "asc" } } },
    },
  });
  if (!yg) notFound();

  const membership = yg.memberships.find((m) => m.userId === session.userId);
  const isStudentMember = membership?.role === "STUDENT";
  const canManage =
    session.role === "ADMIN" ||
    session.role === "TEACHER" ||
    (membership != null && membership.role !== "STUDENT");

  return { session, yg, canManage, isStudentMember };
}
