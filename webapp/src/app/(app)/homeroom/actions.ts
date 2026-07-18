"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const CommentSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  comment: z.string().trim().max(10000),
});

// Advisors may comment on students in a year group they advise; admins on anyone.
export async function saveAdvisoryComment(input: z.infer<typeof CommentSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const parsed = CommentSchema.parse(input);

  if (session.role !== "ADMIN") {
    const advises = await db.yearGroupMembership.count({
      where: {
        userId: session.userId,
        role: { not: "STUDENT" },
        yearGroup: { memberships: { some: { userId: parsed.studentId, role: "STUDENT" } } },
      },
    });
    if (advises === 0) throw new Error("Not allowed");
  }

  if (parsed.comment.trim() === "") {
    await db.advisoryComment
      .delete({ where: { studentId_termId: { studentId: parsed.studentId, termId: parsed.termId } } })
      .catch(() => {});
  } else {
    await db.advisoryComment.upsert({
      where: { studentId_termId: { studentId: parsed.studentId, termId: parsed.termId } },
      update: { comment: parsed.comment, authorId: session.userId },
      create: {
        schoolId: session.schoolId,
        studentId: parsed.studentId,
        termId: parsed.termId,
        authorId: session.userId,
        comment: parsed.comment,
      },
    });
  }
  revalidatePath("/homeroom");
  return { ok: true };
}
