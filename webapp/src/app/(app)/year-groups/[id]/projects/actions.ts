"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

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

async function loadEnrollment(yearGroupId: string, enrollmentId: string) {
  const enrollment = await db.projectEnrollment.findFirst({
    where: { id: enrollmentId, project: { yearGroupId } },
    include: { project: true },
  });
  if (!enrollment) throw new Error("Enrollment not found");
  return enrollment;
}

// ── Student edits their own goals ──

const GoalsSchema = z.object({
  learningGoal: z.string().trim().max(10000).optional(),
  productGoal: z.string().trim().max(10000).optional(),
});

export async function saveGoals(
  yearGroupId: string,
  enrollmentId: string,
  input: z.infer<typeof GoalsSchema>
) {
  const { session, isStudentMember, canManage } = await loadContext(yearGroupId);
  const enrollment = await loadEnrollment(yearGroupId, enrollmentId);
  const isOwner = isStudentMember && enrollment.studentId === session.userId;
  if (!isOwner && !canManage) throw new Error("Not allowed");

  const parsed = GoalsSchema.parse(input);
  await db.projectEnrollment.update({
    where: { id: enrollmentId },
    data: {
      learningGoal: parsed.learningGoal || null,
      productGoal: parsed.productGoal || null,
    },
  });
  revalidatePath(`/year-groups/${yearGroupId}/projects/${enrollment.studentId}`);
  return { ok: true };
}

// ── Student or supervisor updates status ──

export async function updateProjectStatus(
  yearGroupId: string,
  enrollmentId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED"
) {
  const { session, isStudentMember, canManage } = await loadContext(yearGroupId);
  const enrollment = await loadEnrollment(yearGroupId, enrollmentId);
  const isOwner = isStudentMember && enrollment.studentId === session.userId;
  if (!isOwner && !canManage) throw new Error("Not allowed");

  await db.projectEnrollment.update({ where: { id: enrollmentId }, data: { status } });
  revalidatePath(`/year-groups/${yearGroupId}/projects/${enrollment.studentId}`);
  revalidatePath(`/year-groups/${yearGroupId}/projects`);
}

// ── Journal entry (student or supervisor) ──

const JournalSchema = z.object({ content: z.string().trim().min(1).max(20000) });

export async function addJournalEntry(
  yearGroupId: string,
  enrollmentId: string,
  formData: FormData
) {
  const { session, isStudentMember, canManage } = await loadContext(yearGroupId);
  const enrollment = await loadEnrollment(yearGroupId, enrollmentId);
  const isOwner = isStudentMember && enrollment.studentId === session.userId;
  if (!isOwner && !canManage) throw new Error("Not allowed");

  const parsed = JournalSchema.parse({ content: formData.get("content") });
  await db.projectJournalEntry.create({
    data: { enrollmentId, authorId: session.userId, content: parsed.content },
  });
  revalidatePath(`/year-groups/${yearGroupId}/projects/${enrollment.studentId}`);
}

// ── Supervisor logs a meeting ──

const MeetingSchema = z.object({
  meetingDate: z.coerce.date(),
  notes: z.string().trim().min(1).max(20000),
});

export async function addMeeting(
  yearGroupId: string,
  enrollmentId: string,
  formData: FormData
) {
  const { session, canManage } = await loadContext(yearGroupId);
  if (!canManage) throw new Error("Only supervisors can log meetings");
  const enrollment = await loadEnrollment(yearGroupId, enrollmentId);

  const parsed = MeetingSchema.parse({
    meetingDate: formData.get("meetingDate"),
    notes: formData.get("notes"),
  });
  await db.projectMeeting.create({
    data: {
      enrollmentId,
      meetingDate: parsed.meetingDate,
      notes: parsed.notes,
      createdById: session.userId,
    },
  });
  revalidatePath(`/year-groups/${yearGroupId}/projects/${enrollment.studentId}`);
}

// ── Supervisor assesses criteria ──

const AssessSchema = z.object({
  criteriaLevels: z.record(z.string(), z.number().int().min(0).max(10).nullable()),
});

export async function saveProjectAssessment(
  yearGroupId: string,
  enrollmentId: string,
  input: z.infer<typeof AssessSchema>
) {
  const { canManage } = await loadContext(yearGroupId);
  if (!canManage) throw new Error("Only supervisors can assess");
  const enrollment = await loadEnrollment(yearGroupId, enrollmentId);

  const parsed = AssessSchema.parse(input);
  const levels = Object.fromEntries(
    Object.entries(parsed.criteriaLevels).filter(([, v]) => v != null)
  );
  await db.projectEnrollment.update({
    where: { id: enrollmentId },
    data: { criteriaLevels: levels },
  });
  revalidatePath(`/year-groups/${yearGroupId}/projects/${enrollment.studentId}`);
  revalidatePath(`/year-groups/${yearGroupId}/projects`);
  return { ok: true };
}
