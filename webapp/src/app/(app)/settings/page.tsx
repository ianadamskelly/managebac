import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { currentSchool } from "@/lib/tenant";

export default async function SettingsPage() {
  const session = (await getSession())!;
  if (session.role !== "ADMIN") redirect("/home");
  const school = (await currentSchool())!;

  const programmes = await db.programme.findMany({
    where: { schoolId: session.schoolId },
    include: {
      gradeLevels: { include: { gradeLevel: true } },
      academicYears: { include: { terms: { orderBy: { order: "asc" } } }, orderBy: { startsOn: "desc" } },
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>

      <section className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Admin</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/behaviour"
            className="rounded-md border border-slate-300 text-slate-700 text-sm px-3 py-1.5 hover:bg-slate-50"
          >
            Behaviour Types
          </Link>
          <Link
            href="/directory"
            className="rounded-md border border-slate-300 text-slate-700 text-sm px-3 py-1.5 hover:bg-slate-50"
          >
            School Directory
          </Link>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-3">School</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm max-w-md">
          <dt className="text-slate-500">Name</dt>
          <dd className="text-slate-800">{school.name}</dd>
          <dt className="text-slate-500">Subdomain</dt>
          <dd className="text-slate-800">{school.subdomain}</dd>
          <dt className="text-slate-500">Timezone</dt>
          <dd className="text-slate-800">{school.timezone}</dd>
          <dt className="text-slate-500">Theme</dt>
          <dd className="text-slate-800 capitalize">{school.theme}</dd>
        </dl>
      </section>

      {programmes.map((p) => (
        <section
          key={p.id}
          className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5"
        >
          <h2 className="font-semibold text-slate-800 mb-3">{p.name}</h2>
          <p className="text-sm text-slate-600 mb-3">
            Grade levels:{" "}
            {p.gradeLevels
              .map((gl) => gl.gradeLevel.name)
              .join(", ")}
          </p>
          {p.academicYears.map((y) => (
            <div key={y.id} className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">
                {y.name}
                {y.isCurrent && (
                  <span className="ml-2 rounded bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">
                    Current
                  </span>
                )}
              </span>
              <span className="ml-2">
                {y.terms.map((t) => t.name).join(" · ")}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
