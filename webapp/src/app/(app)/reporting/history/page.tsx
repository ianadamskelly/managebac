import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PublishButton } from "./publish-button";

export default async function ReportsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string }>;
}) {
  const session = (await getSession())!;
  if (session.role !== "ADMIN" && session.role !== "TEACHER") redirect("/home");
  const isAdmin = session.role === "ADMIN";
  const { generated } = await searchParams;

  const reports = await db.reportCard.findMany({
    where: { schoolId: session.schoolId },
    include: { yearGroup: true, term: { include: { academicYear: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Group into batches by (yearGroup, term, title)
  type Batch = {
    key: string;
    yearGroupId: string;
    termId: string;
    title: string;
    yearGroupName: string;
    termLabel: string;
    count: number;
    published: number;
    preparedOn: Date;
    sampleId: string;
  };
  const batches = new Map<string, Batch>();
  for (const r of reports) {
    const key = `${r.yearGroupId}|${r.termId}|${r.title}`;
    if (!batches.has(key)) {
      batches.set(key, {
        key,
        yearGroupId: r.yearGroupId,
        termId: r.termId,
        title: r.title,
        yearGroupName: r.yearGroup.name,
        termLabel: `${r.term.academicYear.name} · ${r.term.name}`,
        count: 0,
        published: 0,
        preparedOn: r.preparedOn,
        sampleId: r.id,
      });
    }
    const b = batches.get(key)!;
    b.count++;
    if (r.publishedAt) b.published++;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/reporting" className="text-sm text-blue-600 hover:underline">
          ← Reporting
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">Reports History</h1>
      </div>

      {generated && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2">
          Generated {generated} report card{generated === "1" ? "" : "s"}. Publish the batch below
          to make them visible to students and parents.
        </div>
      )}

      {batches.size === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No reports generated yet.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Year Group</th>
                <th className="px-5 py-3 font-medium">Term</th>
                <th className="px-5 py-3 font-medium text-right">Reports</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...batches.values()].map((b) => {
                const allPublished = b.published === b.count && b.count > 0;
                return (
                  <tr key={b.key} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/reporting/batch/${b.yearGroupId}/${b.termId}/${encodeURIComponent(b.title)}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {b.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{b.yearGroupName}</td>
                    <td className="px-5 py-3 text-slate-600">{b.termLabel}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{b.count}</td>
                    <td className="px-5 py-3">
                      {allPublished ? (
                        <span className="rounded px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Published
                        </span>
                      ) : b.published > 0 ? (
                        <span className="rounded px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
                          {b.published}/{b.count} published
                        </span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
                          Draft
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <PublishButton
                          yearGroupId={b.yearGroupId}
                          termId={b.termId}
                          title={b.title}
                          publish={!allPublished}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
