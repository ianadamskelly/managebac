import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function BatchPage({
  params,
}: {
  params: Promise<{ yearGroupId: string; termId: string; title: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const { yearGroupId, termId, title } = await params;
  const decodedTitle = decodeURIComponent(title);

  const reports = await db.reportCard.findMany({
    where: { schoolId: session.schoolId, yearGroupId, termId, title: decodedTitle },
    include: { student: true, yearGroup: true, term: { include: { academicYear: true } } },
    orderBy: { student: { lastName: "asc" } },
  });
  if (reports.length === 0) notFound();
  const first = reports[0];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/reporting/history" className="text-sm text-blue-600 hover:underline">
          ← Reports History
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">{decodedTitle}</h1>
        <p className="text-sm text-slate-500">
          {first.yearGroup.name} · {first.term.academicYear.name} · {first.term.name}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Report Cards ({reports.length})</h2>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">
                  {r.student.lastName}, {r.student.firstName}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      r.publishedAt
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.publishedAt ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/reports/${r.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
