import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, destroySession } from "@/lib/session";
import { currentSchool } from "@/lib/tenant";
import { NavLink } from "./nav-link";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const school = await currentSchool();
  const isAdmin = session.role === "ADMIN";
  const isParent = session.role === "PARENT";
  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-4 z-20">
        <Link href="/home" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
            {(school?.name ?? "S").charAt(0)}
          </div>
          <span className="font-semibold text-slate-800 text-sm hidden sm:block">
            {school?.name}
          </span>
        </Link>
        <div className="flex-1" />
        {isAdmin && (
          <Link
            href="/settings"
            className="text-slate-500 hover:text-slate-800 text-sm font-medium"
          >
            Settings
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm text-slate-700 hidden sm:block">{session.name}</span>
        </div>
        <form action={logout}>
          <button className="text-sm text-slate-500 hover:text-red-600 font-medium">
            Logout
          </button>
        </form>
      </header>

      {/* Left nav */}
      <aside className="fixed top-14 bottom-0 left-0 w-56 bg-white border-r border-slate-200 py-4 px-2 overflow-y-auto z-10 hidden md:block">
        <nav className="space-y-1">
          {isParent ? (
            <NavLink href="/home" label="My Children" />
          ) : (
            <>
              <NavLink href="/home" label="My Workspace" />
              <NavLink href="/tasks" label="Tasks & Deadlines" />
              <NavLink href="/activities" label="CAS & Service" />
              <NavLink href="/portfolio" label="Portfolio" />
              {session.role === "STUDENT" && <NavLink href="/reports" label="My Reports" />}
              <NavLink href="/year-groups" label="Year Groups" />
              <NavLink href="/classes" label="Classes" />
              {(isAdmin || session.role === "TEACHER") && (
                <>
                  <NavLink href="/analytics" label="Analytics" />
                  <NavLink href="/reporting" label="Reporting" />
                </>
              )}
              {isAdmin && <NavLink href="/directory" label="School Directory" />}
            </>
          )}
        </nav>
      </aside>

      <main className="pt-14 md:pl-56">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
