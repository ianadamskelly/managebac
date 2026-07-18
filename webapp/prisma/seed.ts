import { PrismaClient, Role, YearGroupRole, ClassRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Demo data is fictional; structure mirrors a real IB continuum school.

const FIRST_NAMES = [
  "Amina", "Omar", "Layla", "Yusuf", "Fatima", "Hassan", "Zainab", "Ali",
  "Maryam", "Ibrahim", "Sofia", "Ahmed", "Nadia", "Khalid", "Hana", "Bilal",
  "Salma", "Idris", "Rania", "Tariq", "Asha", "Daud", "Iman", "Musa",
];
const LAST_NAMES = [
  "Abdi", "Hussein", "Mohamed", "Farah", "Ahmed", "Osman", "Ali", "Ismail",
  "Warsame", "Jama", "Hashi", "Noor", "Adan", "Yusuf", "Sheikh", "Omar",
];

function personName(i: number) {
  return {
    firstName: FIRST_NAMES[i % FIRST_NAMES.length],
    lastName: LAST_NAMES[(i * 7) % LAST_NAMES.length],
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("Demo123!", 10);

  // ── School ──
  const school = await db.school.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      subdomain: "demo",
      name: "Demo International Academy",
      timezone: "Africa/Nairobi",
      theme: "blue",
    },
  });
  const schoolId = school.id;

  // Idempotent-ish seed: bail if programmes already exist
  const existing = await db.programme.count({ where: { schoolId } });
  if (existing > 0) {
    console.log("Seed data already present — skipping.");
    return;
  }

  // ── Programmes ──
  const [pyp, myp, dp] = await Promise.all([
    db.programme.create({ data: { schoolId, code: "pyp", name: "IB Primary Years", displayOrder: 1 } }),
    db.programme.create({ data: { schoolId, code: "myp", name: "IB Middle Years", displayOrder: 2 } }),
    db.programme.create({ data: { schoolId, code: "diploma", name: "IB Diploma", displayOrder: 3 } }),
  ]);

  // ── Grade levels (KG1, KG2, Grade 1..12) ──
  const gradeNames = ["KG1", "KG2", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
  const gradeLevels: Record<string, { id: string }> = {};
  for (let i = 0; i < gradeNames.length; i++) {
    gradeLevels[gradeNames[i]] = await db.gradeLevel.create({
      data: { schoolId, name: gradeNames[i], order: i },
    });
  }

  // Grades & Levels matrix: PYP KG1–G5, MYP G6–G10, DP G11–G12
  const matrix: [string, string[]][] = [
    [pyp.id, ["KG1", "KG2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"]],
    [myp.id, ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"]],
    [dp.id, ["Grade 11", "Grade 12"]],
  ];
  for (const [programmeId, names] of matrix) {
    await db.programmeGradeLevel.createMany({
      data: names.map((n) => ({ programmeId, gradeLevelId: gradeLevels[n].id })),
    });
  }

  // ── Academic years + terms (per programme) ──
  const termsByProgramme: Record<string, { s1: string; s2: string }> = {};
  for (const prog of [pyp, myp, dp]) {
    const year = await db.academicYear.create({
      data: {
        schoolId,
        programmeId: prog.id,
        name: "August 2026 – June 2027",
        startsOn: new Date("2026-08-31"),
        endsOn: new Date("2027-06-26"),
        isCurrent: true,
      },
    });
    const s1 = await db.term.create({
      data: { academicYearId: year.id, name: "Semester 1", startsOn: new Date("2026-08-31"), endsOn: new Date("2027-01-23"), order: 1 },
    });
    const s2 = await db.term.create({
      data: { academicYearId: year.id, name: "Semester 2", startsOn: new Date("2027-02-06"), endsOn: new Date("2027-06-26"), order: 2 },
    });
    termsByProgramme[prog.id] = { s1: s1.id, s2: s2.id };
  }

  // ── Year groups: one per grade level ──
  // In 2026–27, Grade 12 graduates 2027; KG1 graduates 2040.
  const yearGroups: Record<string, { id: string }> = {};
  const gradeNum = (name: string) =>
    name === "KG1" ? -1 : name === "KG2" ? 0 : parseInt(name.replace("Grade ", ""), 10);
  for (const [programmeId, names] of matrix) {
    const prog = [pyp, myp, dp].find((p) => p.id === programmeId)!;
    const prefix =
      prog.code === "diploma" ? "Class of" : prog.code === "myp" ? "IB Middle Years Class of" : "IB Primary Years Class of";
    for (const n of names) {
      const graduationYear = 2027 + (12 - gradeNum(n));
      yearGroups[n] = await db.yearGroup.create({
        data: {
          schoolId,
          programmeId,
          gradeLevelId: gradeLevels[n].id,
          name: `${prefix} ${graduationYear}`,
          graduationYear,
        },
      });
    }
  }

  // ── Subjects ──
  const subjectDefs: { prog: typeof pyp; group: string; names: string[] }[] = [
    { prog: dp, group: "Studies in Language and Literature", names: ["English A Language and Literature"] },
    { prog: dp, group: "Language Acquisition", names: ["Arabic B"] },
    { prog: dp, group: "Individuals and Societies", names: ["Economics", "History"] },
    { prog: dp, group: "Sciences", names: ["Biology", "Chemistry", "Physics", "Design Technology"] },
    { prog: dp, group: "Mathematics", names: ["Mathematics: Applications and Interpretation"] },
    { prog: dp, group: "Core", names: ["Theory of Knowledge", "Extended Essay", "CAS"] },
    { prog: myp, group: "Language and Literature", names: ["English"] },
    { prog: myp, group: "Language Acquisition", names: ["Arabic", "Somali"] },
    { prog: myp, group: "Individuals and Societies", names: ["Individuals and Societies"] },
    { prog: myp, group: "Sciences", names: ["Biology", "Chemistry", "Physics"] },
    { prog: myp, group: "Mathematics", names: ["Standard Mathematics", "Extended Mathematics"] },
    { prog: myp, group: "Arts", names: ["Arts"] },
    { prog: myp, group: "Physical and Health Education", names: ["Physical and Health Education"] },
    { prog: myp, group: "Design", names: ["Digital Design"] },
    { prog: myp, group: "Core", names: ["Personal Project", "Service as Action"] },
    { prog: pyp, group: "Language", names: ["English", "Arabic", "Somali"] },
    { prog: pyp, group: "Mathematics", names: ["Mathematics"] },
    { prog: pyp, group: "Science", names: ["Science"] },
    { prog: pyp, group: "Social Studies", names: ["Social Studies", "Islamic Studies"] },
    { prog: pyp, group: "Arts", names: ["Arts"] },
    { prog: pyp, group: "Personal, Social and Physical Education", names: ["Personal, Social and Physical Education"] },
  ];
  const subjects: Record<string, { id: string; programmeId: string }> = {};
  for (const def of subjectDefs) {
    for (const name of def.names) {
      const s = await db.subject.create({
        data: { schoolId, programmeId: def.prog.id, name, subjectGroup: def.group },
      });
      subjects[`${def.prog.code}:${name}`] = s;
    }
  }

  // ── Users ──
  const admin = await db.user.create({
    data: {
      schoolId, role: Role.ADMIN, email: "admin@demo.school", passwordHash,
      firstName: "Ada", lastName: "Principal", jobFunctions: "Head of School",
    },
  });

  const teacherDefs = [
    { email: "t.english@demo.school", firstName: "Grace", lastName: "Otieno", jobFunctions: "MYP English Teacher" },
    { email: "t.biology@demo.school", firstName: "Victor", lastName: "Mwangi", jobFunctions: "MYP Biology Teacher" },
    { email: "t.math@demo.school", firstName: "Halima", lastName: "Dahir", jobFunctions: "Mathematics Teacher" },
    { email: "t.homeroom9@demo.school", firstName: "Peter", lastName: "Kamau", jobFunctions: "Grade 9 Homeroom Advisor" },
  ];
  const teachers = [];
  for (const t of teacherDefs) {
    teachers.push(await db.user.create({ data: { schoolId, role: Role.TEACHER, passwordHash, ...t } }));
  }

  // 24 Grade 9 students + 12 Grade 6 students + 2 Grade 11 students
  async function makeStudents(count: number, gradeName: string, codePrefix: string, offset = 0) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const { firstName, lastName } = personName(i + offset);
      list.push(
        await db.user.create({
          data: {
            schoolId, role: Role.STUDENT, passwordHash,
            email: `${codePrefix.toLowerCase()}${String(i + 1).padStart(3, "0")}@student.demo.school`,
            firstName, lastName,
            studentCode: `#${codePrefix}${String(i + 1).padStart(4, "0")}`,
            gradeLevelId: gradeLevels[gradeName].id,
          },
        })
      );
    }
    return list;
  }
  const g9Students = await makeStudents(24, "Grade 9", "DIA9");
  const g6Students = await makeStudents(12, "Grade 6", "DIA6", 5);
  const g11Students = await makeStudents(2, "Grade 11", "DIA11", 11);

  // Parents for the first 4 G9 students
  for (let i = 0; i < 4; i++) {
    const s = g9Students[i];
    const parent = await db.user.create({
      data: {
        schoolId, role: Role.PARENT, passwordHash,
        email: `parent${i + 1}@demo.school`,
        firstName: "Parent", lastName: s.lastName,
      },
    });
    await db.parentChild.create({ data: { parentId: parent.id, studentId: s.id } });
  }

  // ── Year group memberships ──
  async function joinYearGroup(students: { id: string }[], gradeName: string, homeroom?: { id: string }) {
    await db.yearGroupMembership.createMany({
      data: students.map((s) => ({
        yearGroupId: yearGroups[gradeName].id, userId: s.id, role: YearGroupRole.STUDENT,
      })),
    });
    if (homeroom) {
      await db.yearGroupMembership.create({
        data: { yearGroupId: yearGroups[gradeName].id, userId: homeroom.id, role: YearGroupRole.HOMEROOM_ADVISOR },
      });
    }
  }
  await joinYearGroup(g9Students, "Grade 9", teachers[3]);
  await joinYearGroup(g6Students, "Grade 6");
  await joinYearGroup(g11Students, "Grade 11");

  // ── Classes ──
  async function makeClass(opts: {
    prog: typeof pyp; subjectKey: string; gradeName: string; section?: string;
    externalId?: string; level?: string; teacher: { id: string }; students: { id: string }[];
  }) {
    const subject = subjects[opts.subjectKey];
    const cls = await db.class.create({
      data: {
        schoolId,
        programmeId: opts.prog.id,
        subjectId: subject.id,
        gradeLevelId: gradeLevels[opts.gradeName].id,
        section: opts.section,
        externalId: opts.externalId,
        level: opts.level,
        termLinks: {
          createMany: {
            data: [
              { termId: termsByProgramme[opts.prog.id].s1 },
              { termId: termsByProgramme[opts.prog.id].s2 },
            ],
          },
        },
      },
    });
    await db.classMembership.createMany({
      data: [
        { classId: cls.id, userId: opts.teacher.id, role: ClassRole.TEACHER },
        ...opts.students.map((s) => ({ classId: cls.id, userId: s.id, role: ClassRole.STUDENT })),
      ],
    });
    return cls;
  }

  const g9A = g9Students.slice(0, 12);
  const g9B = g9Students.slice(12);
  await makeClass({ prog: myp, subjectKey: "myp:English", gradeName: "Grade 9", section: "A", externalId: "MYP9-ENG-A", teacher: teachers[0], students: g9A });
  await makeClass({ prog: myp, subjectKey: "myp:English", gradeName: "Grade 9", section: "B", externalId: "MYP9-ENG-B", teacher: teachers[0], students: g9B });
  await makeClass({ prog: myp, subjectKey: "myp:Biology", gradeName: "Grade 9", section: "A", externalId: "MYP9-BIO-A", teacher: teachers[1], students: g9A });
  await makeClass({ prog: myp, subjectKey: "myp:Biology", gradeName: "Grade 9", section: "B", externalId: "MYP9-BIO-B", teacher: teachers[1], students: g9B });
  await makeClass({ prog: myp, subjectKey: "myp:Standard Mathematics", gradeName: "Grade 9", section: "A", externalId: "MYP9-MAT-A", teacher: teachers[2], students: g9A });
  await makeClass({ prog: myp, subjectKey: "myp:Standard Mathematics", gradeName: "Grade 6", externalId: "MYP6-MAT", teacher: teachers[2], students: g6Students });
  await makeClass({ prog: dp, subjectKey: "diploma:Biology", gradeName: "Grade 11", externalId: "DP1-BIO-HL", level: "HL", teacher: teachers[1], students: g11Students });
  await makeClass({ prog: dp, subjectKey: "diploma:English A Language and Literature", gradeName: "Grade 11", externalId: "DP1-ENG-SL", level: "SL", teacher: teachers[0], students: g11Students });

  console.log("Seeded:", {
    school: school.subdomain,
    admin: admin.email,
    teachers: teachers.length,
    students: g9Students.length + g6Students.length + g11Students.length,
  });
  console.log("Login: admin@demo.school / Demo123!  (teachers & students share the same demo password)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
