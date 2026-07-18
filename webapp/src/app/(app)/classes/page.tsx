import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function ClassesPage() {
  const session = (await getSession())!;
  const classes = await db.class.findMany({
    where: { schoolId: session.schoolId, archived: false },
    include: {
      programme: true,
      subject: true,
      gradeLevel: true,
      memberships: { where: { role: "TEACHER" }, include: { user: true } },
      _count: { select: { memberships: { where: { role: "STUDENT" } } } },
    },
    orderBy: [{ gradeLevel: { order: "asc" } }, { subject: { name: "asc" } }, { section: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Browse All Classes ({classes.length})
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/classes/${c.id}`}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-colors"
          >
            <p className="text-xs text-slate-500 mb-1">
              {c.programme.name} · {c.gradeLevel.name}
            </p>
            <h2 className="font-semibold text-slate-900">
              {c.name ?? c.subject.name}
              {c.section ? ` (${c.section})` : ""}
              {c.level ? ` · ${c.level}` : ""}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {c._count.memberships} students
              {c.memberships[0] &&
                ` · ${c.memberships[0].user.firstName} ${c.memberships[0].user.lastName}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
