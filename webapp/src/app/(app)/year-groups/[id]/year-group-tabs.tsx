"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function YearGroupTabs({
  yearGroupId,
  activityTabLabel,
  hasProjects,
}: {
  yearGroupId: string;
  activityTabLabel: string;
  hasProjects: boolean;
}) {
  const pathname = usePathname();
  const base = `/year-groups/${yearGroupId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/activities`, label: activityTabLabel },
    ...(hasProjects ? [{ href: `${base}/projects`, label: "Projects" }] : []),
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
