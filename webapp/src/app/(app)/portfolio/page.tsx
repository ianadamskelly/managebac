import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Students go to their own portfolio; staff pick a student they can view.
export default async function PortfolioIndexPage() {
  const session = (await getSession())!;
  if (session.role === "STUDENT") redirect(`/portfolio/${session.userId}`);

  let students: { id: string; firstName: string; lastName: string; studentCode: string | null }[];
  if (session.role === "ADMIN") {
    students = await db.user.findMany({
      where: { schoolId: session.schoolId, role: "STUDENT", archived: false },
      select: { id: true, firstName: true, lastName: true, studentCode: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
    });
  } else {
    // Teachers: students in classes they teach or year groups they advise.
    const rows = await db.user.findMany({
      where: {
        schoolId: session.schoolId,
        role: "STUDENT",
        archived: false,
        OR: [
          {
            classMemberships: {
              some: {
                role: "STUDENT",
                class: { memberships: { some: { userId: session.userId, role: "TEACHER" } } },
              },
            },
          },
          {
            yearGroupMemberships: {
              some: {
                role: "STUDENT",
                yearGroup: {
                  memberships: { some: { userId: session.userId, role: { not: "STUDENT" } } },
                },
              },
            },
          },
        ],
      },
      select: { id: true, firstName: true, lastName: true, studentCode: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
    });
    students = rows;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Portfolio</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Students ({students.length})</h2>
        </header>
        {students.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">No students to show.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/portfolio/${s.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {s.lastName}, {s.firstName}
                  </span>
                  <span className="text-xs text-slate-500">{s.studentCode}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
