import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AddBehaviourNote } from "./add-behaviour-note";
import { DeleteNoteButton } from "./delete-note-button";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");

  const student = await db.user.findFirst({
    where: { id, schoolId: session.schoolId, role: "STUDENT" },
    include: {
      gradeLevel: true,
      parentLinks: { include: { parent: true } },
      classMemberships: {
        where: { role: "STUDENT" },
        include: { class: { include: { subject: true } } },
      },
      yearGroupMemberships: {
        where: { role: "STUDENT" },
        include: { yearGroup: true },
      },
    },
  });
  if (!student) notFound();

  const [behaviourTypes, notes] = await Promise.all([
    db.behaviourType.findMany({
      where: { schoolId: session.schoolId },
      orderBy: [{ positive: "desc" }, { order: "asc" }, { title: "asc" }],
    }),
    db.behaviourNote.findMany({
      where: { studentId: id },
      include: { author: true },
      orderBy: { incidentOn: "desc" },
    }),
  ]);

  const yearGroup = student.yearGroupMemberships[0]?.yearGroup;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/directory" className="text-sm text-blue-600 hover:underline">
          ← School Directory
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-lg font-semibold">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {student.gradeLevel?.name}
              {student.studentCode ? ` · ${student.studentCode}` : ""}
              {yearGroup ? ` · ${yearGroup.name}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/portfolio/${student.id}`}
          className="rounded-md border border-slate-300 text-slate-700 text-sm px-3 py-1.5 hover:bg-slate-50"
        >
          Portfolio
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-400 text-xs">E-mail</dt>
              <dd className="text-slate-700 break-all">{student.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Last accessed</dt>
              <dd className="text-slate-700">
                {student.lastAccessAt ? student.lastAccessAt.toLocaleDateString() : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs">Parents</dt>
              <dd className="text-slate-700">
                {student.parentLinks.length === 0
                  ? "—"
                  : student.parentLinks
                      .map((l) => `${l.parent.firstName} ${l.parent.lastName}`)
                      .join(", ")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-3">Classes</h2>
          {student.classMemberships.length === 0 ? (
            <p className="text-sm text-slate-500">Not enrolled in any classes.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {student.classMemberships.map((m) => (
                <li key={m.classId}>
                  <Link
                    href={`/classes/${m.classId}`}
                    className="rounded-full bg-slate-100 text-slate-700 text-sm px-3 py-1 hover:bg-slate-200"
                  >
                    {m.class.name ?? m.class.subject.name}
                    {m.class.section ? ` (${m.class.section})` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Behaviour &amp; Discipline ({notes.length})</h2>
        </header>
        <div className="p-5 space-y-4">
          <AddBehaviourNote
            studentId={student.id}
            types={behaviourTypes.map((t) => ({ id: t.id, title: t.title, positive: t.positive }))}
          />

          {notes.length === 0 ? (
            <p className="text-sm text-slate-500">No behaviour notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          n.positive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {n.incidentOn.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {(session.role === "ADMIN" || n.authorId === session.userId) && (
                      <DeleteNoteButton studentId={student.id} noteId={n.id} />
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{n.note}</p>
                  {n.nextStep && (
                    <p className="text-sm text-slate-600 mt-2">
                      <span className="font-medium">Next step:</span> {n.nextStep}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    — {n.author.firstName} {n.author.lastName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
