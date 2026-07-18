import { PrismaClient, ClassRole, YearGroupRole } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findUnique({ where: { subdomain: "demo" } });
  if (!school) throw new Error("Run the Phase 1 seed first.");
  const schoolId = school.id;

  if ((await db.unit.count({ where: { schoolId } })) > 0) {
    console.log("Phase 3a data already present — skipping.");
    return;
  }

  // ── Units for MYP Biology (Grade 9) B, linking existing tasks ──
  const bioB = await db.class.findFirst({ where: { schoolId, externalId: "MYP9-BIO-B" } });
  if (bioB) {
    const genetics = await db.unit.create({
      data: {
        schoolId,
        classId: bioB.id,
        title: "Reproduction, cell division and growth",
        description:
          "Students explore how living organisms reproduce, grow and develop through cellular processes, and connect these to genetic inheritance.",
        startsOn: new Date("2026-09-01"),
        durationWeeks: 6,
        status: "ACTIVE",
        sections: {
          key_concepts: "Relationships, Systems",
          related_concepts: "Evidence, Function, Interaction",
          statement_of_inquiry:
            "Understanding how organisms reproduce and regulate cell division enables scientific and technological innovation that improves health and agriculture.",
          inquiry_questions:
            "Factual: What are the stages of mitosis and meiosis?\nConceptual: How do cell division and reproduction contribute to growth and variation?\nDebatable: To what extent should genetic technologies be applied to humans?",
          objectives:
            "A: Knowing and understanding\nB: Inquiring and designing\nC: Processing and evaluating\nD: Reflecting on the impacts of science",
          summative_assessment:
            "End of Semester 1 summative exam covering cell division, reproduction and inheritance.",
        },
      },
    });

    const nutrition = await db.unit.create({
      data: {
        schoolId,
        classId: bioB.id,
        title: "Nutrition in food",
        startsOn: new Date("2027-03-15"),
        durationWeeks: 6,
        status: "DRAFT",
        sections: {
          key_concepts: "Change",
          statement_of_inquiry:
            "The chemical composition of food determines its role in maintaining healthy body systems.",
        },
      },
    });

    // Link existing seeded tasks to the genetics unit
    await db.task.updateMany({
      where: {
        classId: bioB.id,
        title: {
          in: [
            "Introduction to genetics — Formative Assessment I",
            "Cell division lab project",
            "End of Semester 1 Biology Summative Assessment",
          ],
        },
      },
      data: { unitId: genetics.id },
    });
    await db.task.updateMany({
      where: { classId: bioB.id, title: "Reproduction & growth reading" },
      data: { unitId: nutrition.id },
    });
  }

  // ── MYP Service as Action activities for Grade 9 students ──
  const g9 = await db.yearGroup.findFirst({
    where: { schoolId, programmeId: (await db.programme.findFirstOrThrow({ where: { schoolId, code: "myp" } })).id, gradeLevel: { name: "Grade 9" } },
    include: { memberships: { where: { role: YearGroupRole.STUDENT }, include: { user: true } } },
  });
  if (g9) {
    const students = g9.memberships;
    const samples = [
      {
        name: "Community clean-up campaign",
        description: "Organised a weekend litter clean-up around the school neighbourhood.",
        status: "COMPLETED" as const,
        hours: 8,
        outcomes: ["awareness", "collaboration", "persevere"],
        reflections: [
          "Before starting I underestimated how much waste our neighbourhood produces.",
          "Working in a team taught me to delegate and listen to others' ideas.",
        ],
      },
      {
        name: "Peer tutoring in mathematics",
        description: "Weekly tutoring sessions for Grade 6 students who need extra support.",
        status: "APPROVED" as const,
        hours: 12,
        outcomes: ["challenge", "collaboration"],
        reflections: ["Explaining fractions to younger students helped me understand them better myself."],
      },
      {
        name: "School garden project",
        description: "Proposal to start a vegetable garden to supply the school kitchen.",
        status: "PROPOSED" as const,
        hours: 0,
        outcomes: ["initiate"],
        reflections: [],
      },
    ];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // Give the first several students activities so the roster shows a spread of statuses.
      const count = i < 3 ? 3 : i < 8 ? 2 : i < 12 ? 1 : 0;
      for (let j = 0; j < count; j++) {
        const s = samples[j];
        const activity = await db.activity.create({
          data: {
            schoolId,
            studentId: student.userId,
            yearGroupId: g9.id,
            name: s.name,
            description: s.description,
            categories: [],
            status: s.status,
            hours: s.hours || null,
            outcomes: s.outcomes,
            supervisorName: "Mr. Kamau",
          },
        });
        for (const content of s.reflections) {
          await db.activityReflection.create({
            data: { activityId: activity.id, authorId: student.userId, content },
          });
        }
      }
    }
  }

  console.log("Phase 3a seeded: units for MYP9-BIO-B + Service as Action activities for Grade 9.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
