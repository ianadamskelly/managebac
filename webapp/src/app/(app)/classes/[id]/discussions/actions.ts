"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// A class member (teacher or student) or admin may participate.
async function requireMember(classId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const cls = await db.class.findFirst({
    where: { id: classId, schoolId: session.schoolId },
    include: { memberships: { where: { userId: session.userId } } },
  });
  if (!cls) throw new Error("Class not found");
  const isMember = session.role === "ADMIN" || cls.memberships.length > 0;
  if (!isMember) throw new Error("Not allowed");
  return session;
}

const ThreadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
});

export async function createDiscussion(classId: string, formData: FormData) {
  const session = await requireMember(classId);
  const parsed = ThreadSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  const discussion = await db.discussion.create({
    data: {
      schoolId: session.schoolId,
      classId,
      authorId: session.userId,
      title: parsed.title,
      body: parsed.body,
    },
  });
  revalidatePath(`/classes/${classId}/discussions`);
  redirect(`/classes/${classId}/discussions/${discussion.id}`);
}

const CommentSchema = z.object({ body: z.string().trim().min(1).max(20000) });

export async function addComment(classId: string, discussionId: string, formData: FormData) {
  const session = await requireMember(classId);
  const discussion = await db.discussion.findFirst({ where: { id: discussionId, classId } });
  if (!discussion) throw new Error("Discussion not found");

  const parsed = CommentSchema.parse({ body: formData.get("body") });
  await db.discussionComment.create({
    data: { discussionId, authorId: session.userId, body: parsed.body },
  });
  // Bump the thread's updatedAt so it sorts to the top of the list.
  await db.discussion.update({ where: { id: discussionId }, data: { updatedAt: new Date() } });
  revalidatePath(`/classes/${classId}/discussions/${discussionId}`);
}
