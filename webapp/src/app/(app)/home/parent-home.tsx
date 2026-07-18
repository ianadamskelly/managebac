import Link from "next/link";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string | null;
  gradeLevel: { name: string } | null;
};

export function ParentHome({
  name,
  today,
  children,
}: {
  name: string;
  today: string;
  children: Child[];
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">{today}</p>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Welcome, {name}!</h1>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">My Children</h2>
        </header>
        {children.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">
            No children are linked to your account yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/children/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold">
                      {c.firstName[0]}
                      {c.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.gradeLevel?.name}
                        {c.studentCode ? ` · ${c.studentCode}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
