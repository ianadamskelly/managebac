import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function YearGroupsPage() {
  const session = (await getSession())!;
  const yearGroups = await db.yearGroup.findMany({
    where: { schoolId: session.schoolId, archived: false },
    include: {
      programme: true,
      gradeLevel: true,
      _count: { select: { memberships: { where: { role: "STUDENT" } } } },
    },
    orderBy: { gradeLevel: { order: "desc" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Year Groups</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Year Group</th>
              <th className="px-5 py-3 font-medium">Programme</th>
              <th className="px-5 py-3 font-medium">Grade</th>
              <th className="px-5 py-3 font-medium text-right">Students</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yearGroups.map((yg) => (
              <tr key={yg.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/year-groups/${yg.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {yg.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{yg.programme.name}</td>
                <td className="px-5 py-3 text-slate-600">{yg.gradeLevel.name}</td>
                <td className="px-5 py-3 text-right text-slate-600">
                  {yg._count.memberships}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
