"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// A year-group member (student/advisor) or any staff may participate.
async function requireMember(yearGroupId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const yg = await db.yearGroup.findFirst({
    where: { id: yearGroupId, schoolId: session.schoolId },
    include: { memberships: { where: { userId: session.userId } } },
  });
  if (!yg) throw new Error("Year group not found");
  const isMember =
    session.role === "ADMIN" || session.role === "TEACHER" || yg.memberships.length > 0;
  if (!isMember) throw new Error("Not allowed");
  return session;
}

const ThreadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
});

export async function createYgDiscussion(yearGroupId: string, formData: FormData) {
  const session = await requireMember(yearGroupId);
  const parsed = ThreadSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  const discussion = await db.discussion.create({
    data: {
      schoolId: session.schoolId,
      yearGroupId,
      authorId: session.userId,
      title: parsed.title,
      body: parsed.body,
    },
  });
  revalidatePath(`/year-groups/${yearGroupId}/discussions`);
  redirect(`/year-groups/${yearGroupId}/discussions/${discussion.id}`);
}

const CommentSchema = z.object({ body: z.string().trim().min(1).max(20000) });

export async function addYgComment(yearGroupId: string, discussionId: string, formData: FormData) {
  const session = await requireMember(yearGroupId);
  const discussion = await db.discussion.findFirst({ where: { id: discussionId, yearGroupId } });
  if (!discussion) throw new Error("Discussion not found");

  const parsed = CommentSchema.parse({ body: formData.get("body") });
  await db.discussionComment.create({
    data: { discussionId, authorId: session.userId, body: parsed.body },
  });
  await db.discussion.update({ where: { id: discussionId }, data: { updatedAt: new Date() } });
  revalidatePath(`/year-groups/${yearGroupId}/discussions/${discussionId}`);
}
