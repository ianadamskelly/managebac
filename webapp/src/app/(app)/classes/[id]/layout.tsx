import { getClassContext, classDisplayName } from "@/lib/class-access";
import { ClassTabs } from "./class-tabs";

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  const studentCount = cls.memberships.filter((m) => m.role === "STUDENT").length;

  return (
    <div>
      <p className="text-sm text-slate-500">
        {cls.subject.subjectGroup} — {cls.subject.name} · {cls.gradeLevel.name} ·{" "}
        {cls.programme.name}
      </p>
      <div className="flex items-center justify-between mt-1 mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">{classDisplayName(cls)}</h1>
        <span className="text-sm text-slate-500">{studentCount} students</span>
      </div>
      <ClassTabs classId={cls.id} canManage={canManage} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
