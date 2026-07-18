"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// A viewer may add to a portfolio if it's their own, or they are staff who can
// see the student (admin, or a teacher who shares a class / advises the year group).
async function canEditPortfolio(studentId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (session.userId === studentId) return session;
  if (session.role === "ADMIN") return session;
  if (session.role === "TEACHER") {
    const shares = await db.classMembership.count({
      where: {
        userId: session.userId,
        role: "TEACHER",
        class: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
    });
    if (shares > 0) return session;
    const advises = await db.yearGroupMembership.count({
      where: {
        userId: session.userId,
        role: { not: "STUDENT" },
        yearGroup: { memberships: { some: { userId: studentId, role: "STUDENT" } } },
      },
    });
    if (advises > 0) return session;
  }
  throw new Error("Not allowed");
}

const EntrySchema = z.object({
  type: z.enum(["NOTE", "WEBSITE", "FILE", "PHOTO"]),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(20000).optional(),
  url: z.string().trim().url().optional().or(z.literal("")),
});

export async function addPortfolioEntry(studentId: string, formData: FormData) {
  const session = await canEditPortfolio(studentId);

  const student = await db.user.findFirst({
    where: { id: studentId, schoolId: session.schoolId, role: "STUDENT" },
  });
  if (!student) throw new Error("Student not found");

  const parsed = EntrySchema.parse({
    type: formData.get("type"),
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    url: formData.get("url") || undefined,
  });

  let storagePath: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;

  if (parsed.type === "FILE" || parsed.type === "PHOTO") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file to upload");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 20 MB");
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
    const rel = path.join("portfolio", studentId, `${randomBytes(4).toString("hex")}-${safeName}`);
    await mkdir(path.join(UPLOADS_DIR, "portfolio", studentId), { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, rel), Buffer.from(await file.arrayBuffer()));
    storagePath = rel;
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || "application/octet-stream";
  }

  await db.portfolioEntry.create({
    data: {
      schoolId: session.schoolId,
      studentId,
      authorId: session.userId,
      type: parsed.type,
      title: parsed.title,
      content: parsed.content,
      url: parsed.url || null,
      storagePath,
      fileName,
      fileSize,
      mimeType,
    },
  });
  revalidatePath(`/portfolio/${studentId}`);
  revalidatePath("/portfolio");
}
