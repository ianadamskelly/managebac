import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Student's own published report cards.
export default async function MyReportsPage() {
  const session = (await getSession())!;
  if (session.role !== "STUDENT") redirect("/home");

  const reports = await db.reportCard.findMany({
    where: { schoolId: session.schoolId, studentId: session.userId, publishedAt: { not: null } },
    include: { term: { include: { academicYear: true } } },
    orderBy: { preparedOn: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">My Reports</h1>
      {reports.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No published reports yet.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.term.academicYear.name} · {r.term.name}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
