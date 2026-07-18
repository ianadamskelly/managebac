import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { GenerateForm } from "./generate-form";

export default async function ReportingPage() {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const isAdmin = session.role === "ADMIN";

  const yearGroups = await db.yearGroup.findMany({
    where: { schoolId: session.schoolId, archived: false },
    include: {
      programme: true,
      gradeLevel: true,
      _count: { select: { memberships: { where: { role: "STUDENT" } } } },
    },
    orderBy: { gradeLevel: { order: "desc" } },
  });

  // Terms grouped for the generate form
  const terms = await db.term.findMany({
    where: { academicYear: { schoolId: session.schoolId } },
    include: { academicYear: { include: { programme: true } } },
    orderBy: [{ academicYear: { startsOn: "desc" } }, { order: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reporting</h1>
        <Link href="/reporting/history" className="text-sm text-blue-600 hover:underline">
          Reports History →
        </Link>
      </div>

      <section>
        <h2 className="font-semibold text-slate-800 mb-3">Proofing &amp; Review</h2>
        <p className="text-sm text-slate-500 mb-3">
          Review each cohort&rsquo;s term grades and comments before generating reports.
        </p>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Year Group</th>
                <th className="px-5 py-3 font-medium">Programme</th>
                <th className="px-5 py-3 font-medium text-right">Students</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearGroups
                .filter((yg) => yg._count.memberships > 0)
                .map((yg) => (
                  <tr key={yg.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{yg.name}</td>
                    <td className="px-5 py-3 text-slate-600">{yg.programme.name}</td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {yg._count.memberships}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/reporting/proofing/${yg.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin && (
        <section>
          <h2 className="font-semibold text-slate-800 mb-3">Generate Reports</h2>
          <GenerateForm
            yearGroups={yearGroups
              .filter((yg) => yg._count.memberships > 0)
              .map((yg) => ({ id: yg.id, name: yg.name, programmeId: yg.programmeId }))}
            terms={terms.map((t) => ({
              id: t.id,
              programmeId: t.academicYear.programmeId,
              label: `${t.academicYear.name} · ${t.name}`,
            }))}
          />
        </section>
      )}
    </div>
  );
}
