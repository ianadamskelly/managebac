import { notFound } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

/** The children linked to the current parent (empty for non-parents). */
export async function myChildren() {
  const session = await getSession();
  if (!session) return [];
  const links = await db.parentChild.findMany({
    where: { parentId: session.userId, student: { schoolId: session.schoolId, archived: false } },
    include: { student: { include: { gradeLevel: true } } },
  });
  return links.map((l) => l.student);
}

/**
 * Load a student a viewer is allowed to see as a "child overview":
 * the linked parent, admins, or teachers who share a class / advise the year group.
 */
export async function getChildContext(studentId: string) {
  const session = await getSession();
  if (!session) notFound();

  const student = await db.user.findFirst({
    where: { id: studentId, schoolId: session.schoolId, role: "STUDENT" },
    include: { gradeLevel: true },
  });
  if (!student) notFound();

  let allowed = session.role === "ADMIN";
  if (!allowed && session.role === "PARENT") {
    allowed =
      (await db.parentChild.count({
        where: { parentId: session.userId, studentId },
      })) > 0;
  }
  if (!allowed && session.role === "TEACHER") {
    const shares = await db.classMembership.count({
      where: {
        userId: session.userId,
        role: "TEACHER",
        class: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
    });
    const advises = shares
      ? 1
      : await db.yearGroupMembership.count({
          where: {
            userId: session.userId,
            role: { not: "STUDENT" },
            yearGroup: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
          },
        });
    allowed = shares > 0 || advises > 0;
  }
  if (!allowed) notFound();

  return { session, student };
}
