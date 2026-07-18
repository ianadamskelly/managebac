import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AdvisoryEditor } from "./advisory-editor";

export default async function HomeroomPage({
  searchParams,
}: {
  searchParams: Promise<{ yg?: string; term?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const { yg: ygParam, term: termParam } = await searchParams;

  // Year groups this user advises (admins: all with students).
  const advisedYgs = await db.yearGroup.findMany({
    where: {
      schoolId: session.schoolId,
      archived: false,
      memberships: session.role === "ADMIN"
        ? { some: { role: "STUDENT" } }
        : { some: { userId: session.userId, role: { not: "STUDENT" } } },
    },
    include: { programme: true, gradeLevel: true },
    orderBy: { gradeLevel: { order: "desc" } },
  });

  if (advisedYgs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Homeroom</h1>
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          You are not assigned as a homeroom advisor for any year group.
        </p>
      </div>
    );
  }

  const activeYg = advisedYgs.find((y) => y.id === ygParam) ?? advisedYgs[0];

  const terms = await db.term.findMany({
    where: { academicYear: { schoolId: session.schoolId, programmeId: activeYg.programmeId } },
    include: { academicYear: true },
    orderBy: [{ academicYear: { startsOn: "desc" } }, { order: "asc" }],
  });
  const activeTerm = terms.find((t) => t.id === termParam) ?? terms[0];

  const members = await db.yearGroupMembership.findMany({
    where: { yearGroupId: activeYg.id, role: "STUDENT" },
    include: { user: true },
    orderBy: { user: { lastName: "asc" } },
  });
  const comments = activeTerm
    ? await db.advisoryComment.findMany({
        where: { termId: activeTerm.id, studentId: { in: members.map((m) => m.userId) } },
      })
    : [];
  const commentByStudent = new Map(comments.map((c) => [c.studentId, c.comment]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Homeroom · Advisory Comments</h1>

      <div className="flex flex-wrap items-center gap-2">
        <form method="get" className="contents">
          <select
            name="yg"
            defaultValue={activeYg.id}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {advisedYgs.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          {activeTerm && (
            <select
              name="term"
              defaultValue={activeTerm.id}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.academicYear.name} · {t.name}
                </option>
              ))}
            </select>
          )}
          <button className="rounded-md border border-slate-300 text-slate-700 text-sm px-3 py-2 hover:bg-slate-50">
            Go
          </button>
        </form>
      </div>

      {!activeTerm ? (
        <p className="text-sm text-slate-500">No terms configured for this programme.</p>
      ) : (
        <AdvisoryEditor
          termId={activeTerm.id}
          students={members.map((m) => ({
            id: m.userId,
            name: `${m.user.lastName}, ${m.user.firstName}`,
            comment: commentByStudent.get(m.userId) ?? "",
          }))}
        />
      )}
    </div>
  );
}
