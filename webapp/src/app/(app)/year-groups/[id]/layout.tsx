import { getYearGroupContext } from "@/lib/year-group-access";
import { activityProgramme } from "@/lib/activities";
import { db } from "@/lib/db";
import { YearGroupTabs } from "./year-group-tabs";

export default async function YearGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { yg } = await getYearGroupContext(id);
  const programme = activityProgramme(yg.programme.code);
  const studentCount = yg.memberships.filter((m) => m.role === "STUDENT").length;
  const hasProjects = (await db.project.count({ where: { yearGroupId: yg.id } })) > 0;

  return (
    <div>
      <p className="text-sm text-slate-500">
        {yg.programme.name}: {yg.gradeLevel.name}
      </p>
      <div className="flex items-center justify-between mt-1 mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">{yg.name}</h1>
        <span className="text-sm text-slate-500">{studentCount} students</span>
      </div>
      <YearGroupTabs
        yearGroupId={yg.id}
        activityTabLabel={programme.shortName}
        hasProjects={hasProjects}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
