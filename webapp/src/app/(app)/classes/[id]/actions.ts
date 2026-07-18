"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { mypFinalGrade } from "@/lib/myp";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function requireManage(classId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const cls = await db.class.findFirst({
    where: { id: classId, schoolId: session.schoolId },
    include: { memberships: { where: { userId: session.userId } } },
  });
  if (!cls) throw new Error("Class not found");
  const isTeacher = cls.memberships[0]?.role === "TEACHER";
  if (session.role !== "ADMIN" && !isTeacher) throw new Error("Not allowed");
  return { session, cls };
}

// ── Create task ──

const CreateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(["SUMMATIVE", "FORMATIVE"]),
  model: z.enum(["POINTS", "CRITERIA", "BINARY", "OBSERVATION"]),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  maxPoints: z.coerce.number().int().min(1).max(1000).optional(),
  criteria: z.array(z.enum(["A", "B", "C", "D"])).default([]),
  dueAt: z.coerce.date(),
  description: z.string().trim().max(5000).optional(),
  dropboxEnabled: z.boolean(),
});

export async function createTask(classId: string, formData: FormData) {
  const { session } = await requireManage(classId);
  const parsed = CreateTaskSchema.parse({
    title: formData.get("title"),
    type: formData.get("type"),
    model: formData.get("model"),
    categoryId: formData.get("categoryId") || undefined,
    unitId: formData.get("unitId") || undefined,
    maxPoints: formData.get("maxPoints") || undefined,
    criteria: formData.getAll("criteria"),
    dueAt: formData.get("dueAt"),
    description: formData.get("description") || undefined,
    dropboxEnabled: formData.get("dropboxEnabled") === "on",
  });

  if (parsed.unitId) {
    const unit = await db.unit.findFirst({ where: { id: parsed.unitId, classId } });
    if (!unit) throw new Error("Unit not found in this class");
  }

  const task = await db.task.create({
    data: {
      schoolId: session.schoolId,
      classId,
      title: parsed.title,
      type: parsed.type,
      model: parsed.model,
      categoryId: parsed.categoryId,
      unitId: parsed.unitId,
      maxPoints: parsed.model === "POINTS" ? parsed.maxPoints ?? 100 : null,
      criteria: parsed.model === "CRITERIA" || parsed.model === "POINTS" ? parsed.criteria : [],
      dueAt: parsed.dueAt,
      description: parsed.description,
      dropboxEnabled: parsed.dropboxEnabled,
      createdById: session.userId,
    },
  });
  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}/tasks/${task.id}`);
}

// ── Task grade (gradebook cell) ──

const GradeSchema = z.object({
  points: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  criteriaLevels: z.record(z.enum(["A", "B", "C", "D"]), z.number().int().min(0).max(8)).optional(),
  complete: z.boolean().optional(),
  comment: z.string().max(5000).optional(),
});

export async function saveTaskGrade(
  classId: string,
  taskId: string,
  studentId: string,
  input: z.infer<typeof GradeSchema>
) {
  await requireManage(classId);
  const parsed = GradeSchema.parse(input);
  const task = await db.task.findFirst({ where: { id: taskId, classId } });
  if (!task) throw new Error("Task not found");

  await db.taskGrade.upsert({
    where: { taskId_studentId: { taskId, studentId } },
    update: {
      points: parsed.points ?? null,
      criteriaLevels: parsed.criteriaLevels,
      complete: parsed.complete,
      comment: parsed.comment,
    },
    create: {
      taskId,
      studentId,
      points: parsed.points ?? null,
      criteriaLevels: parsed.criteriaLevels,
      complete: parsed.complete,
      comment: parsed.comment,
    },
  });
  revalidatePath(`/classes/${classId}/gradebook`);
  return { ok: true };
}

// ── Term grade ──

const TermGradeSchema = z.object({
  termId: z.string(),
  studentId: z.string(),
  criteriaLevels: z.record(z.enum(["A", "B", "C", "D"]), z.number().int().min(0).max(8).nullable()),
  atl: z.record(z.string(), z.enum(["Exceeding", "Meeting", "Approaching", "Below"]).nullable()),
  comment: z.string().max(10000).optional(),
});

export async function saveTermGrade(classId: string, input: z.infer<typeof TermGradeSchema>) {
  await requireManage(classId);
  const parsed = TermGradeSchema.parse(input);

  const levels = Object.fromEntries(
    Object.entries(parsed.criteriaLevels).filter(([, v]) => v != null)
  ) as Record<string, number>;
  const atl = Object.fromEntries(Object.entries(parsed.atl).filter(([, v]) => v != null));
  const sum = Object.values(levels).reduce((a, b) => a + b, 0);
  const finalGrade = Object.keys(levels).length === 4 ? mypFinalGrade(sum) : null;

  await db.termGrade.upsert({
    where: {
      classId_termId_studentId: {
        classId,
        termId: parsed.termId,
        studentId: parsed.studentId,
      },
    },
    update: { criteriaLevels: levels, finalGrade, atl, comment: parsed.comment },
    create: {
      classId,
      termId: parsed.termId,
      studentId: parsed.studentId,
      criteriaLevels: levels,
      finalGrade,
      atl,
      comment: parsed.comment,
    },
  });
  revalidatePath(`/classes/${classId}/term-grades`);
  return { ok: true, finalGrade };
}

// ── Student submission (dropbox upload) ──

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export async function submitToDropbox(classId: string, taskId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const membership = await db.classMembership.findUnique({
    where: { classId_userId: { classId, userId: session.userId } },
  });
  if (membership?.role !== "STUDENT") throw new Error("Only class students can submit");

  const task = await db.task.findFirst({
    where: { id: taskId, classId, schoolId: session.schoolId },
  });
  if (!task || !task.dropboxEnabled) throw new Error("Dropbox is not available for this task");
  if (task.submissionsOpenAt && task.submissionsOpenAt > new Date()) {
    throw new Error("Submissions are not open yet");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file to upload");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 20 MB");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const storagePath = path.join(taskId, `${session.userId}-${randomBytes(4).toString("hex")}-${safeName}`);
  const absDir = path.join(UPLOADS_DIR, taskId);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, storagePath), Buffer.from(await file.arrayBuffer()));

  await db.submission.upsert({
    where: { taskId_studentId: { taskId, studentId: session.userId } },
    update: {
      fileName: file.name,
      storagePath,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      submittedAt: new Date(),
    },
    create: {
      taskId,
      studentId: session.userId,
      fileName: file.name,
      storagePath,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  });
  revalidatePath(`/classes/${classId}/tasks/${taskId}`);
}
