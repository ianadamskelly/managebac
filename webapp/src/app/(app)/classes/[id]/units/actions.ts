"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

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

const CreateUnitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  startsOn: z.coerce.date().optional(),
  durationWeeks: z.coerce.number().int().min(1).max(52).optional(),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

export async function createUnit(classId: string, formData: FormData) {
  const { session } = await requireManage(classId);
  const parsed = CreateUnitSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsOn: formData.get("startsOn") || undefined,
    durationWeeks: formData.get("durationWeeks") || undefined,
    status: formData.get("status") ?? "ACTIVE",
  });

  const unit = await db.unit.create({
    data: {
      schoolId: session.schoolId,
      classId,
      title: parsed.title,
      description: parsed.description,
      startsOn: parsed.startsOn,
      durationWeeks: parsed.durationWeeks,
      status: parsed.status,
    },
  });
  revalidatePath(`/classes/${classId}/units`);
  redirect(`/classes/${classId}/units/${unit.id}`);
}

export async function saveUnitSection(
  classId: string,
  unitId: string,
  sectionKey: string,
  content: string
) {
  await requireManage(classId);
  const unit = await db.unit.findFirst({ where: { id: unitId, classId } });
  if (!unit) throw new Error("Unit not found");
  if (!/^[a-z0-9_]+$/.test(sectionKey)) throw new Error("Bad section key");

  const sections = { ...((unit.sections as Record<string, string> | null) ?? {}) };
  const trimmed = content.slice(0, 20000);
  if (trimmed.trim() === "") delete sections[sectionKey];
  else sections[sectionKey] = trimmed;

  await db.unit.update({ where: { id: unit.id }, data: { sections } });
  revalidatePath(`/classes/${classId}/units/${unitId}`);
  return { ok: true };
}

export async function updateUnitStatus(
  classId: string,
  unitId: string,
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
) {
  await requireManage(classId);
  await db.unit.update({
    where: { id: unitId },
    data: { status },
  });
  revalidatePath(`/classes/${classId}/units`);
}
