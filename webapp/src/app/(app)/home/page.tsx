import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { myChildren } from "@/lib/parent";
import { ParentHome } from "./parent-home";

export default async function HomePage() {
  const session = (await getSession())!;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (session.role === "PARENT") {
    const children = await myChildren();
    return <ParentHome name={session.name.split(" ")[0]} today={today} children={children} />;
  }

  const [yearGroupCount, classCount, studentCount, myClasses] = await Promise.all([
    db.yearGroup.count({ where: { schoolId: session.schoolId, archived: false } }),
    db.class.count({ where: { schoolId: session.schoolId, archived: false } }),
    db.user.count({ where: { schoolId: session.schoolId, role: "STUDENT", archived: false } }),
    db.classMembership.findMany({
      where: { userId: session.userId },
      include: { class: { include: { subject: true, gradeLevel: true } } },
      take: 8,
    }),
  ]);

  const firstName = session.name.split(" ")[0];

  return (
    <div>
      <p className="text-sm text-slate-500">{today}</p>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">
        Welcome, {firstName}!
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Students" value={studentCount} href="/directory" />
        <StatCard label="Year Groups" value={yearGroupCount} href="/year-groups" />
        <StatCard label="Classes" value={classCount} href="/classes" />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">My Classes</h2>
          <Link href="/classes" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </header>
        {myClasses.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">
            You are not a member of any classes yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {myClasses.map((m) => (
              <li key={m.classId}>
                <Link
                  href={`/classes/${m.classId}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {m.class.name ?? m.class.subject.name}
                    {m.class.section ? ` (${m.class.section})` : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {m.class.gradeLevel.name} · {m.role.toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-colors"
    >
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </Link>
  );
}
