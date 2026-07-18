import { PrismaClient, Role, YearGroupRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const FIRST = ["Yasmin", "Abdullahi", "Sahra", "Mustafa", "Halimo", "Yasir", "Ikran", "Suleiman", "Deqa", "Abdirahman"];
const LAST = ["Warsame", "Aden", "Hersi", "Gedi", "Duale", "Elmi", "Barre", "Farah", "Robleh", "Samatar"];

async function main() {
  const school = await db.school.findUniqueOrThrow({ where: { subdomain: "demo" } });
  const schoolId = school.id;
  const g10Level = await db.gradeLevel.findFirstOrThrow({ where: { schoolId, name: "Grade 10" } });
  const myp = await db.programme.findFirstOrThrow({ where: { schoolId, code: "myp" } });
  const g10yg = await db.yearGroup.findFirstOrThrow({
    where: { schoolId, programmeId: myp.id, gradeLevelId: g10Level.id },
  });

  const existing = await db.user.count({ where: { schoolId, gradeLevelId: g10Level.id, role: "STUDENT" } });
  if (existing > 0) {
    console.log(`Grade 10 already has ${existing} students — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash("Demo123!", 10);
  for (let i = 0; i < 10; i++) {
    const student = await db.user.create({
      data: {
        schoolId,
        role: Role.STUDENT,
        passwordHash,
        email: `dia10${String(i + 1).padStart(3, "0")}@student.demo.school`,
        firstName: FIRST[i],
        lastName: LAST[i],
        studentCode: `#DIA10${String(i + 1).padStart(4, "0")}`,
        gradeLevelId: g10Level.id,
      },
    });
    await db.yearGroupMembership.create({
      data: { yearGroupId: g10yg.id, userId: student.id, role: YearGroupRole.STUDENT },
    });
  }
  console.log("Added 10 Grade 10 students to the year group.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
