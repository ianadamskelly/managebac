import { db } from "./db";
import { getSession } from "./session";

export type ReportContent = {
  student: { name: string; gradeLevel: string; studentCode: string | null };
  term: { name: string; academicYear: string };
  yearGroup: string;
  subjects: {
    className: string;
    subjectGroup: string;
    teacher: string | null;
    criteria: { key: string; label: string; level: number }[];
    finalGrade: number | null;
    localGrade: string | null;
    comment: string | null;
  }[];
  advisoryComment?: string | null;
};

/**
 * Load a report card the current viewer is allowed to see.
 * Staff (admin, or a teacher who teaches/advises the student) see drafts too;
 * the student and their linked parents see it only once published.
 */
export async function getViewableReport(reportId: string) {
  const session = await getSession();
  if (!session) return null;

  const report = await db.reportCard.findFirst({
    where: { id: reportId, schoolId: session.schoolId },
  });
  if (!report) return null;

  const isStaff = session.role === "ADMIN" || (await teachesOrAdvises(session.userId, report.studentId, session.role));
  if (isStaff) return { report, session, isStaff: true };

  // Non-staff: must be published AND (own report or linked parent)
  if (!report.publishedAt) return null;
  if (session.userId === report.studentId) return { report, session, isStaff: false };
  if (session.role === "PARENT") {
    const linked = await db.parentChild.count({
      where: { parentId: session.userId, studentId: report.studentId },
    });
    if (linked > 0) return { report, session, isStaff: false };
  }
  return null;
}

async function teachesOrAdvises(userId: string, studentId: string, role: string) {
  if (role !== "TEACHER") return false;
  const shares = await db.classMembership.count({
    where: {
      userId,
      role: "TEACHER",
      class: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
    },
  });
  if (shares > 0) return true;
  const advises = await db.yearGroupMembership.count({
    where: {
      userId,
      role: { not: "STUDENT" },
      yearGroup: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
    },
  });
  return advises > 0;
}
