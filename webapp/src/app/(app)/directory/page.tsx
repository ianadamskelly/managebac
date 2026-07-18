import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Role } from "@prisma/client";

const GROUPS: { key: string; role: Role; label: string }[] = [
  { key: "students", role: "STUDENT", label: "Students" },
  { key: "advisors", role: "TEACHER", label: "Teachers & Advisors" },
  { key: "parents", role: "PARENT", label: "Parents" },
  { key: "observers", role: "OBSERVER", label: "Observers" },
  { key: "admins", role: "ADMIN", label: "Admins" },
];

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN") redirect("/home");

  const { group = "students" } = await searchParams;
  const active = GROUPS.find((g) => g.key === group) ?? GROUPS[0];

  const [counts, users] = await Promise.all([
    db.user.groupBy({
      by: ["role"],
      where: { schoolId: session.schoolId, archived: false },
      _count: true,
    }),
    db.user.findMany({
      where: { schoolId: session.schoolId, role: active.role, archived: false },
      include: { gradeLevel: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
    }),
  ]);
  const countFor = (role: Role) => counts.find((c) => c.role === role)?._count ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">School Directory</h1>

      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {GROUPS.map((g) => (
          <Link
            key={g.key}
            href={`/directory?group=${g.key}`}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-px ${
              g.key === active.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {g.label} ({countFor(g.role)})
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              {active.role === "STUDENT" && (
                <>
                  <th className="px-5 py-3 font-medium">Grade</th>
                  <th className="px-5 py-3 font-medium">Student ID</th>
                </>
              )}
              <th className="px-5 py-3 font-medium">Last Accessed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">
                  {active.role === "STUDENT" ? (
                    <Link href={`/students/${u.id}`} className="text-blue-700 hover:underline">
                      {u.lastName}, {u.firstName}
                    </Link>
                  ) : (
                    <>
                      {u.lastName}, {u.firstName}
                    </>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                {active.role === "STUDENT" && (
                  <>
                    <td className="px-5 py-3 text-slate-600">{u.gradeLevel?.name}</td>
                    <td className="px-5 py-3 text-slate-600">{u.studentCode}</td>
                  </>
                )}
                <td className="px-5 py-3 text-slate-600">
                  {u.lastAccessAt ? u.lastAccessAt.toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
