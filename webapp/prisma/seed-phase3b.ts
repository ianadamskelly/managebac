import { PrismaClient, ProjectType, ProjectStatus, PortfolioEntryType } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findUnique({ where: { subdomain: "demo" } });
  if (!school) throw new Error("Run the Phase 1 seed first.");
  const schoolId = school.id;

  if ((await db.project.count({ where: { schoolId } })) > 0) {
    console.log("Phase 3b data already present — skipping.");
    return;
  }

  // ── Personal Project for the MYP Grade 10 year group ──
  const myp = await db.programme.findFirstOrThrow({ where: { schoolId, code: "myp" } });
  const g10 = await db.yearGroup.findFirst({
    where: { schoolId, programmeId: myp.id, gradeLevel: { name: "Grade 10" } },
    include: { memberships: { where: { role: "STUDENT" }, include: { user: true } } },
  });

  const supervisors = await db.user.findMany({
    where: { schoolId, role: "TEACHER" },
    take: 3,
  });

  if (g10 && g10.memberships.length > 0 && supervisors.length > 0) {
    const project = await db.project.create({
      data: {
        schoolId,
        yearGroupId: g10.id,
        name: "Personal Project",
        type: ProjectType.PERSONAL_PROJECT,
        criteria: ["A", "B", "C"],
      },
    });

    const samples = [
      {
        status: ProjectStatus.COMPLETED,
        learningGoal:
          "My learning goal is to develop advanced pencil-drawing skills, focusing on architectural perspective, proportion and realistic shading of three-dimensional structures.",
        productGoal:
          "I will create a detailed, realistic pencil drawing of a house exterior demonstrating accurate perspective, proportion and shading using graphite pencils of varying grades.",
        levels: { A: 8, B: 7, C: 6 },
        journal: [
          "Started by researching one-point and two-point perspective techniques on YouTube.",
          "First draft of the house had proportion issues — the roof was too large relative to the walls.",
        ],
        meetings: [
          { date: "2027-02-10", notes: "Discussed project scope and agreed on the product goal. Student is motivated and has a clear vision." },
          { date: "2027-03-20", notes: "Reviewed first drafts. Advised focusing on consistent light source for shading." },
        ],
      },
      {
        status: ProjectStatus.IN_PROGRESS,
        learningGoal: "Learn the fundamentals of mobile app design and prototyping.",
        productGoal: "Design a clickable prototype of a study-planner app for MYP students.",
        levels: { A: 7, B: 6 },
        journal: ["Sketched initial wireframes for the home screen and task list."],
        meetings: [
          { date: "2027-02-15", notes: "Approved the topic. Suggested the student look at existing planner apps for inspiration." },
        ],
      },
      {
        status: ProjectStatus.SUBMITTED,
        learningGoal: "Understand the science of composting and soil health.",
        productGoal: "Build a small-scale composting system and document its results over six weeks.",
        levels: { A: 6, B: 6, C: 7 },
        journal: [
          "Set up the compost bin and recorded starting temperature and materials.",
          "Week 3: noticeable decomposition and temperature rise — the process is working.",
        ],
        meetings: [
          { date: "2027-02-12", notes: "Good scientific approach. Reminded student to keep consistent measurement records." },
        ],
      },
    ];

    const students = g10.memberships;
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const supervisor = supervisors[i % supervisors.length];
      const sample = i < samples.length ? samples[i] : null;

      const enrollment = await db.projectEnrollment.create({
        data: {
          projectId: project.id,
          studentId: s.userId,
          supervisorId: supervisor.id,
          status: sample?.status ?? ProjectStatus.NOT_STARTED,
          learningGoal: sample?.learningGoal ?? null,
          productGoal: sample?.productGoal ?? null,
          criteriaLevels: sample?.levels ?? undefined,
        },
      });

      if (sample) {
        for (const content of sample.journal) {
          await db.projectJournalEntry.create({
            data: { enrollmentId: enrollment.id, authorId: s.userId, content },
          });
        }
        for (const m of sample.meetings) {
          await db.projectMeeting.create({
            data: {
              enrollmentId: enrollment.id,
              meetingDate: new Date(m.date),
              notes: m.notes,
              createdById: supervisor.id,
            },
          });
        }
      }
    }
  }

  // ── Portfolio evidence for a couple of Grade 9 Biology students ──
  const bioB =
    (await db.portfolioEntry.count({ where: { schoolId } })) > 0
      ? null
      : await db.class.findFirst({
    where: { schoolId, externalId: "MYP9-BIO-B" },
    include: { memberships: { where: { role: "STUDENT" }, include: { user: true }, take: 2 } },
  });
  if (bioB) {
    for (const m of bioB.memberships) {
      await db.portfolioEntry.create({
        data: {
          schoolId,
          studentId: m.userId,
          authorId: m.userId,
          type: PortfolioEntryType.NOTE,
          title: "Reflection on the genetics unit",
          content:
            "I found Punnett squares confusing at first, but after the lab I understood how dominant and recessive alleles combine. I'm proud of how my second assessment improved.",
        },
      });
      await db.portfolioEntry.create({
        data: {
          schoolId,
          studentId: m.userId,
          authorId: m.userId,
          type: PortfolioEntryType.WEBSITE,
          title: "Interactive cell-division animation I used to revise",
          url: "https://www.cellsalive.com/mitosis.htm",
          content: "This animation helped me visualise the stages of mitosis.",
        },
      });
    }
  }

  console.log("Phase 3b seeded: Personal Project for Grade 10 + portfolio evidence for Grade 9.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
