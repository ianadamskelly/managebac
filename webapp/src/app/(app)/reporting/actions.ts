"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { mypFinalGrade, localEquivalent, criterionLabel } from "@/lib/myp";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (session.role !== "ADMIN") throw new Error("Only admins can generate reports");
  return session;
}

const GenerateSchema = z.object({
  yearGroupId: z.string().min(1),
  termId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  preparedOn: z.coerce.date(),
});

export async function generateReports(formData: FormData) {
  const session = await requireAdmin();
  const parsed = GenerateSchema.parse({
    yearGroupId: formData.get("yearGroupId"),
    termId: formData.get("termId"),
    title: formData.get("title"),
    preparedOn: formData.get("preparedOn") || new Date(),
  });

  const yg = await db.yearGroup.findFirst({
    where: { id: parsed.yearGroupId, schoolId: session.schoolId },
    include: {
      gradeLevel: true,
      memberships: { where: { role: "STUDENT" }, include: { user: true } },
    },
  });
  if (!yg) throw new Error("Year group not found");

  const term = await db.term.findFirst({
    where: { id: parsed.termId, academicYear: { schoolId: session.schoolId } },
    include: { academicYear: true },
  });
  if (!term) throw new Error("Term not found");

  let generated = 0;
  for (const m of yg.memberships) {
    const studentId = m.userId;

    // Classes the student is in that are linked to this term
    const classes = await db.class.findMany({
      where: {
        schoolId: session.schoolId,
        termLinks: { some: { termId: term.id } },
        memberships: { some: { userId: studentId, role: "STUDENT" } },
      },
      include: {
        subject: true,
        memberships: { where: { role: "TEACHER" }, include: { user: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const termGrades = await db.termGrade.findMany({
      where: { studentId, termId: term.id, classId: { in: classes.map((c) => c.id) } },
    });
    const gradeByClass = new Map(termGrades.map((g) => [g.classId, g]));

    const subjects = classes.map((c) => {
      const g = gradeByClass.get(c.id);
      const levels = (g?.criteriaLevels as Record<string, number> | null) ?? null;
      const sum = levels ? Object.values(levels).reduce((a, b) => a + b, 0) : null;
      const finalGrade =
        g?.finalGrade ??
        (levels && Object.keys(levels).length === 4 ? mypFinalGrade(sum!) : null);
      const teacher = c.memberships[0]?.user;
      return {
        className: `${c.name ?? c.subject.name}${c.section ? ` (${c.section})` : ""}`,
        subjectGroup: c.subject.subjectGroup,
        teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
        criteria: levels
          ? Object.entries(levels).map(([k, v]) => ({
              key: k,
              label: criterionLabel(c.subject.subjectGroup, k),
              level: v,
            }))
          : [],
        finalGrade,
        localGrade: finalGrade != null ? localEquivalent(finalGrade) : null,
        comment: g?.comment ?? null,
      };
    });

    const content = {
      student: {
        name: `${m.user.firstName} ${m.user.lastName}`,
        gradeLevel: yg.gradeLevel.name,
        studentCode: m.user.studentCode,
      },
      term: { name: term.name, academicYear: term.academicYear.name },
      yearGroup: yg.name,
      subjects,
    };

    await db.reportCard.upsert({
      where: {
        studentId_termId_title: { studentId, termId: term.id, title: parsed.title },
      },
      update: { content, preparedOn: parsed.preparedOn, yearGroupId: yg.id },
      create: {
        schoolId: session.schoolId,
        studentId,
        termId: term.id,
        yearGroupId: yg.id,
        title: parsed.title,
        preparedOn: parsed.preparedOn,
        content,
        createdById: session.userId,
      },
    });
    generated++;
  }

  revalidatePath("/reporting");
  redirect(
    `/reporting/history?generated=${generated}&yg=${yg.id}&term=${term.id}&title=${encodeURIComponent(parsed.title)}`
  );
}

export async function setBatchPublished(
  yearGroupId: string,
  termId: string,
  title: string,
  publish: boolean
) {
  const session = await requireAdmin();
  await db.reportCard.updateMany({
    where: { schoolId: session.schoolId, yearGroupId, termId, title },
    data: { publishedAt: publish ? new Date() : null },
  });
  revalidatePath("/reporting/history");
  revalidatePath("/reporting");
}
