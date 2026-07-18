"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { activityProgramme } from "@/lib/activities";

async function loadContext(yearGroupId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const yg = await db.yearGroup.findFirst({
    where: { id: yearGroupId, schoolId: session.schoolId },
    include: { programme: true, memberships: { where: { userId: session.userId } } },
  });
  if (!yg) throw new Error("Year group not found");
  const membership = yg.memberships[0];
  const isStudentMember = membership?.role === "STUDENT";
  const canManage =
    session.role === "ADMIN" ||
    session.role === "TEACHER" ||
    (membership != null && membership.role !== "STUDENT");
  return { session, yg, isStudentMember, canManage };
}

const CreateActivitySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  categories: z.array(z.string()).default([]),
  startsOn: z.coerce.date().optional(),
  endsOn: z.coerce.date().optional(),
  hours: z.coerce.number().min(0).max(1000).optional(),
  supervisorName: z.string().trim().max(200).optional(),
  supervisorEmail: z.string().trim().email().optional().or(z.literal("")),
  outcomes: z.array(z.string()).default([]),
});

export async function createActivity(
  yearGroupId: string,
  studentId: string,
  formData: FormData
) {
  const { session, yg, isStudentMember, canManage } = await loadContext(yearGroupId);

  // Students may only add to their own worksheet; staff may add for any student.
  if (isStudentMember && studentId !== session.userId) throw new Error("Not allowed");
  if (!isStudentMember && !canManage) throw new Error("Not allowed");

  const isMember = await db.yearGroupMembership.findUnique({
    where: { yearGroupId_userId: { yearGroupId, userId: studentId } },
  });
  if (!isMember || isMember.role !== "STUDENT") throw new Error("Student is not in this year group");

  const programme = activityProgramme(yg.programme.code);
  const validStrands = new Set(programme.strands.map((s) => s.key));
  const validOutcomes = new Set(programme.outcomes.map((o) => o.key));

  const parsed = CreateActivitySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categories: formData.getAll("categories"),
    startsOn: formData.get("startsOn") || undefined,
    endsOn: formData.get("endsOn") || undefined,
    hours: formData.get("hours") || undefined,
    supervisorName: formData.get("supervisorName") || undefined,
    supervisorEmail: formData.get("supervisorEmail") || undefined,
    outcomes: formData.getAll("outcomes"),
  });

  await db.activity.create({
    data: {
      schoolId: session.schoolId,
      studentId,
      yearGroupId,
      name: parsed.name,
      description: parsed.description,
      categories: parsed.categories.filter((c) => validStrands.has(c)),
      startsOn: parsed.startsOn,
      endsOn: parsed.endsOn,
      hours: parsed.hours,
      supervisorName: parsed.supervisorName,
      supervisorEmail: parsed.supervisorEmail || null,
      outcomes: parsed.outcomes.filter((o) => validOutcomes.has(o)),
    },
  });
  revalidatePath(`/year-groups/${yearGroupId}/activities/${studentId}`);
  redirect(`/year-groups/${yearGroupId}/activities/${studentId}`);
}

export async function updateActivityStatus(
  yearGroupId: string,
  activityId: string,
  status: "PROPOSED" | "APPROVED" | "COMPLETED" | "REJECTED"
) {
  const { canManage } = await loadContext(yearGroupId);
  if (!canManage) throw new Error("Only advisors can change activity status");

  const activity = await db.activity.findFirst({ where: { id: activityId, yearGroupId } });
  if (!activity) throw new Error("Activity not found");

  await db.activity.update({ where: { id: activityId }, data: { status } });
  revalidatePath(`/year-groups/${yearGroupId}/activities/${activity.studentId}`);
  revalidatePath(`/year-groups/${yearGroupId}/activities`);
}

const ReflectionSchema = z.object({ content: z.string().trim().min(1).max(20000) });

export async function addReflection(
  yearGroupId: string,
  activityId: string,
  formData: FormData
) {
  const { session, isStudentMember, canManage } = await loadContext(yearGroupId);
  const activity = await db.activity.findFirst({ where: { id: activityId, yearGroupId } });
  if (!activity) throw new Error("Activity not found");

  // The student who owns the worksheet, or staff (advisor feedback), may write.
  const isOwner = isStudentMember && activity.studentId === session.userId;
  if (!isOwner && !canManage) throw new Error("Not allowed");

  const parsed = ReflectionSchema.parse({ content: formData.get("content") });
  await db.activityReflection.create({
    data: { activityId, authorId: session.userId, content: parsed.content },
  });
  revalidatePath(`/year-groups/${yearGroupId}/activities/${activity.studentId}`);
}
