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

  const entry = await db.portfolioEntry.findUnique({ where: { id } });
  if (!entry || entry.schoolId !== session.schoolId || !entry.storagePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isOwner = entry.studentId === session.userId;
  let allowed = isOwner || session.role === "ADMIN";
  if (!allowed && session.role === "TEACHER") {
    const shares = await db.classMembership.count({
      where: {
        userId: session.userId,
        role: "TEACHER",
        class: { memberships: { some: { userId: entry.studentId, role: "STUDENT" } } },
      },
    });
    const advises = shares
      ? 0
      : await db.yearGroupMembership.count({
          where: {
            userId: session.userId,
            role: { not: "STUDENT" },
            yearGroup: { memberships: { some: { userId: entry.studentId, role: "STUDENT" } } },
          },
        });
    allowed = shares > 0 || advises > 0;
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const abs = path.join(UPLOADS_DIR, entry.storagePath);
  if (!abs.startsWith(UPLOADS_DIR)) return new NextResponse("Not found", { status: 404 });
  try {
    const info = await stat(abs);
    const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": entry.mimeType ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(entry.fileName ?? "file")}"`,
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
