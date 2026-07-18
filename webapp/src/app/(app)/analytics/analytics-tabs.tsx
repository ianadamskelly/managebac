"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AnalyticsTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/analytics/academic", label: "Academic" },
    { href: "/analytics/engagement", label: "Engagement" },
  ];
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
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

export function YearGroupPicker({
  yearGroups,
  activeId,
  basePath,
  extraParam,
}: {
  yearGroups: { id: string; name: string }[];
  activeId: string;
  basePath: string;
  extraParam?: string;
}) {
  return (
    <form action={basePath} method="get" className="inline-block">
      <select
        name="yg"
        defaultValue={activeId}
        onChange={(e) => {
          const url = `${basePath}?yg=${e.target.value}${extraParam ? `&${extraParam}` : ""}`;
          window.location.href = url;
        }}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {yearGroups.map((yg) => (
          <option key={yg.id} value={yg.id}>
            {yg.name}
          </option>
        ))}
      </select>
    </form>
  );
}
