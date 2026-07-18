"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireStaff() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (session.role !== "ADMIN" && session.role !== "TEACHER") throw new Error("Not allowed");
  return session;
}

const NoteSchema = z.object({
  typeId: z.string().optional(),
  note: z.string().trim().min(1).max(5000),
  nextStep: z.string().trim().max(2000).optional(),
  incidentOn: z.coerce.date(),
});

export async function addBehaviourNote(studentId: string, formData: FormData) {
  const session = await requireStaff();
  const student = await db.user.findFirst({
    where: { id: studentId, schoolId: session.schoolId, role: "STUDENT" },
  });
  if (!student) throw new Error("Student not found");

  const parsed = NoteSchema.parse({
    typeId: formData.get("typeId") || undefined,
    note: formData.get("note"),
    nextStep: formData.get("nextStep") || undefined,
    incidentOn: formData.get("incidentOn") || new Date(),
  });

  let title = "Note";
  let positive = false;
  if (parsed.typeId) {
    const type = await db.behaviourType.findFirst({
      where: { id: parsed.typeId, schoolId: session.schoolId },
    });
    if (!type) throw new Error("Behaviour type not found");
    title = type.title;
    positive = type.positive;
  }

  await db.behaviourNote.create({
    data: {
      schoolId: session.schoolId,
      studentId,
      typeId: parsed.typeId,
      title,
      positive,
      note: parsed.note,
      nextStep: parsed.nextStep,
      authorId: session.userId,
      incidentOn: parsed.incidentOn,
    },
  });
  revalidatePath(`/students/${studentId}`);
}

export async function deleteBehaviourNote(studentId: string, noteId: string) {
  const session = await requireStaff();
  // Only the author or an admin may delete.
  const note = await db.behaviourNote.findFirst({
    where: { id: noteId, schoolId: session.schoolId, studentId },
  });
  if (!note) throw new Error("Note not found");
  if (session.role !== "ADMIN" && note.authorId !== session.userId) {
    throw new Error("Only the author or an admin can delete this note");
  }
  await db.behaviourNote.delete({ where: { id: noteId } });
  revalidatePath(`/students/${studentId}`);
}
