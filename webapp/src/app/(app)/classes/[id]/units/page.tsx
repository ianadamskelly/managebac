import Link from "next/link";
import { db } from "@/lib/db";
import { getClassContext } from "@/lib/class-access";

function weekLabel(d: Date) {
  const week = Math.ceil(d.getDate() / 7);
  return `W${week} ${d.toLocaleDateString("en-US", { month: "short" })}`;
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  const units = await db.unit.findMany({
    where: { classId: cls.id, ...(canManage ? {} : { status: "ACTIVE" }) },
    include: { _count: { select: { tasks: true } } },
    orderBy: [{ startsOn: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Link
            href={`/classes/${cls.id}/units/new`}
            className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
          >
            Add Unit
          </Link>
        </div>
      )}
      {units.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No units yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((u) => (
            <Link
              key={u.id}
              href={`/classes/${cls.id}/units/${u.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{u.title}</h2>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                    u.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : u.status === "DRAFT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {u.startsOn ? `Starts ${weekLabel(u.startsOn)}` : "No start date"}
                {u.durationWeeks ? ` · ${u.durationWeeks} weeks` : ""}
                {` · ${u._count.tasks} task${u._count.tasks === 1 ? "" : "s"}`}
              </p>
              {u.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{u.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
