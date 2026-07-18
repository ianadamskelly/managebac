"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (session.role !== "ADMIN") throw new Error("Only admins can manage behaviour types");
  return session;
}

const TypeSchema = z.object({
  title: z.string().trim().min(1).max(100),
  positive: z.boolean(),
});

export async function addBehaviourType(formData: FormData) {
  const session = await requireAdmin();
  const parsed = TypeSchema.parse({
    title: formData.get("title"),
    positive: formData.get("positive") === "on",
  });
  await db.behaviourType.upsert({
    where: { schoolId_title: { schoolId: session.schoolId, title: parsed.title } },
    update: { positive: parsed.positive },
    create: { schoolId: session.schoolId, title: parsed.title, positive: parsed.positive },
  });
  revalidatePath("/settings/behaviour");
}

export async function deleteBehaviourType(typeId: string) {
  const session = await requireAdmin();
  const type = await db.behaviourType.findFirst({
    where: { id: typeId, schoolId: session.schoolId },
  });
  if (!type) throw new Error("Type not found");
  await db.behaviourType.delete({ where: { id: typeId } });
  revalidatePath("/settings/behaviour");
}
