import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const submission = await db.submission.findUnique({
    where: { id },
    include: {
      task: { include: { class: { include: { memberships: true } } } },
    },
  });
  if (!submission || submission.task.schoolId !== session.schoolId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isOwner = submission.studentId === session.userId;
  const isClassTeacher = submission.task.class.memberships.some(
    (m) => m.userId === session.userId && m.role === "TEACHER"
  );
  if (!isOwner && !isClassTeacher && session.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const abs = path.join(UPLOADS_DIR, submission.storagePath);
  if (!abs.startsWith(UPLOADS_DIR)) return new NextResponse("Not found", { status: 404 });
  try {
    const info = await stat(abs);
    const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": submission.mimeType,
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(submission.fileName)}"`,
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
