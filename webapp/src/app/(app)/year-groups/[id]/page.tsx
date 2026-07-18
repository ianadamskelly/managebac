import { getYearGroupContext } from "@/lib/year-group-access";

export default async function YearGroupOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { yg } = await getYearGroupContext(id);

  const students = yg.memberships.filter((m) => m.role === "STUDENT");
  const advisors = yg.memberships.filter((m) => m.role !== "STUDENT");

  return (
    <div className="space-y-6">
      {yg.bulletin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          {yg.bulletin}
        </div>
      )}

      {advisors.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Homeroom Advisors</h2>
          <div className="flex flex-wrap gap-2">
            {advisors.map((m) => (
              <span
                key={m.userId}
                className="rounded-full bg-blue-50 text-blue-800 text-sm px-3 py-1"
              >
                {m.user.firstName} {m.user.lastName}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Students ({students.length})</h2>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Student ID</th>
              <th className="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((m) => (
              <tr key={m.userId} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">
                  {m.user.lastName}, {m.user.firstName}
                </td>
                <td className="px-5 py-3 text-slate-600">{m.user.studentCode}</td>
                <td className="px-5 py-3 text-slate-600">
                  {m.joinedAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
