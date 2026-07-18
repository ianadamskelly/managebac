import { PrismaClient, TaskType, AssessmentModel, ClassRole } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findUnique({ where: { subdomain: "demo" } });
  if (!school) throw new Error("Run the Phase 1 seed first.");
  const schoolId = school.id;

  const existing = await db.task.count({ where: { schoolId } });
  if (existing > 0) {
    console.log("Phase 2 data already present — skipping.");
    return;
  }

  const programmes = await db.programme.findMany({ where: { schoolId } });
  const myp = programmes.find((p) => p.code === "myp")!;
  const dp = programmes.find((p) => p.code === "diploma")!;

  // ── Task categories ──
  const catDefs: { prog: string; name: string; color: string; weight: number }[] = [
    { prog: myp.id, name: "Exam", color: "#dc2626", weight: 40 },
    { prog: myp.id, name: "Project", color: "#7c3aed", weight: 30 },
    { prog: myp.id, name: "Classwork", color: "#2563eb", weight: 20 },
    { prog: myp.id, name: "Homework", color: "#059669", weight: 10 },
    { prog: dp.id, name: "Exam", color: "#dc2626", weight: 50 },
    { prog: dp.id, name: "Paper", color: "#7c3aed", weight: 30 },
    { prog: dp.id, name: "Lab Report", color: "#059669", weight: 20 },
  ];
  const cats: Record<string, string> = {};
  for (const c of catDefs) {
    const row = await db.taskCategory.create({
      data: { schoolId, programmeId: c.prog, name: c.name, color: c.color, defaultWeight: c.weight },
    });
    cats[`${c.prog}:${c.name}`] = row.id;
  }

  // ── Tasks + grades for MYP Biology (Grade 9) B ──
  const bioB = await db.class.findFirst({
    where: { schoolId, externalId: "MYP9-BIO-B" },
    include: { memberships: { where: { role: ClassRole.STUDENT } } },
  });
  if (!bioB) throw new Error("MYP9-BIO-B class not found");
  const bioTeacher = await db.user.findFirst({
    where: { schoolId, email: "t.biology@demo.school" },
  });

  const taskDefs = [
    {
      title: "Introduction to genetics — Formative Assessment I",
      type: TaskType.FORMATIVE, model: AssessmentModel.POINTS,
      category: cats[`${myp.id}:Exam`], maxPoints: 25,
      criteria: ["A"], dueAt: new Date("2026-10-10T10:40:00Z"),
    },
    {
      title: "Cell division lab project",
      type: TaskType.SUMMATIVE, model: AssessmentModel.CRITERIA,
      category: cats[`${myp.id}:Project`], maxPoints: null,
      criteria: ["B", "C"], dueAt: new Date("2026-11-20T15:00:00Z"),
    },
    {
      title: "End of Semester 1 Biology Summative Assessment",
      type: TaskType.SUMMATIVE, model: AssessmentModel.POINTS,
      category: cats[`${myp.id}:Exam`], maxPoints: 60,
      criteria: ["A", "D"], dueAt: new Date("2027-01-17T12:00:00Z"),
    },
    {
      title: "Reproduction & growth reading",
      type: TaskType.FORMATIVE, model: AssessmentModel.BINARY,
      category: cats[`${myp.id}:Homework`], maxPoints: null,
      criteria: [], dueAt: new Date("2027-03-05T08:00:00Z"),
    },
  ];

  const students = bioB.memberships;
  for (const t of taskDefs) {
    const task = await db.task.create({
      data: {
        schoolId,
        classId: bioB.id,
        title: t.title,
        type: t.type,
        model: t.model,
        categoryId: t.category,
        maxPoints: t.maxPoints,
        criteria: t.criteria,
        dueAt: t.dueAt,
        dropboxEnabled: true,
        createdById: bioTeacher?.id,
      },
    });

    // Grade most students on past tasks (leave a few ungraded, like real gradebooks)
    if (t.dueAt < new Date("2027-02-01")) {
      for (let i = 0; i < students.length; i++) {
        if (i % 5 === 4) continue; // every 5th student ungraded
        const s = students[i];
        const base = 3 + ((i * 13) % 6); // deterministic spread 3..8
        if (t.model === AssessmentModel.POINTS) {
          await db.taskGrade.create({
            data: {
              taskId: task.id,
              studentId: s.userId,
              points: Math.min(t.maxPoints!, Math.round((t.maxPoints! * (base + 2)) / 10)),
              criteriaLevels: t.criteria.length
                ? Object.fromEntries(t.criteria.map((c, j) => [c, Math.min(8, base + (j % 2))]))
                : undefined,
            },
          });
        } else if (t.model === AssessmentModel.CRITERIA) {
          await db.taskGrade.create({
            data: {
              taskId: task.id,
              studentId: s.userId,
              criteriaLevels: Object.fromEntries(
                t.criteria.map((c, j) => [c, Math.min(8, base + (j % 2))])
              ),
            },
          });
        }
      }
    }
  }

  // ── One DP task ──
  const dpBio = await db.class.findFirst({ where: { schoolId, externalId: "DP1-BIO-HL" } });
  if (dpBio) {
    await db.task.create({
      data: {
        schoolId,
        classId: dpBio.id,
        title: "Internal Assessment proposal",
        type: TaskType.SUMMATIVE,
        model: AssessmentModel.POINTS,
        categoryId: cats[`${dp.id}:Paper`],
        maxPoints: 24,
        criteria: [],
        dueAt: new Date("2026-12-01T09:00:00Z"),
        dropboxEnabled: true,
        createdById: bioTeacher?.id,
      },
    });
  }

  console.log("Phase 2 seeded: categories, tasks, sample grades for MYP9-BIO-B.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
