import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

async function main() {
  console.log("Seeding database...");

  const categories = await Promise.all(
    [
      { code: "Code 8", name: "Light motor vehicle" },
      { code: "Code 10", name: "Heavy motor vehicle" },
      { code: "Code 14", name: "Extra heavy motor vehicle" },
    ].map((c) => prisma.licenceCategory.upsert({ where: { code: c.code }, update: {}, create: c }))
  );

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@drivesmart.co.za" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@drivesmart.co.za",
      password: passwordHash,
      role: "SYSTEM_ADMIN",
    },
  });

  const schoolOwner = await prisma.user.upsert({
    where: { email: "owner@safedrive.co.za" },
    update: {},
    create: {
      name: "Thabo Mokoena",
      email: "owner@safedrive.co.za",
      password: passwordHash,
      role: "SCHOOL_ADMIN",
    },
  });

  let school = await prisma.drivingSchool.findUnique({ where: { ownerId: schoolOwner.id } });
  if (!school) {
    school = await prisma.drivingSchool.create({
      data: {
        ownerId: schoolOwner.id,
        name: "SafeDrive Driving School",
        description: "Professional, patient driving instruction for all licence categories.",
        city: "Pretoria",
        address: "123 Church Street, Pretoria",
        phone: "012 345 6789",
        email: "owner@safedrive.co.za",
        status: "APPROVED",
      },
    });
  }

  await prisma.schoolService.upsert({
    where: { schoolId_licenceCategoryId: { schoolId: school.id, licenceCategoryId: categories[0].id } },
    update: {},
    create: { schoolId: school.id, licenceCategoryId: categories[0].id, pricePerHour: 280 },
  });
  await prisma.schoolService.upsert({
    where: { schoolId_licenceCategoryId: { schoolId: school.id, licenceCategoryId: categories[1].id } },
    update: {},
    create: { schoolId: school.id, licenceCategoryId: categories[1].id, pricePerHour: 450 },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@safedrive.co.za" },
    update: {},
    create: {
      name: "Naledi Dube",
      email: "instructor@safedrive.co.za",
      password: passwordHash,
      role: "INSTRUCTOR",
    },
  });

  let instructor = await prisma.instructor.findUnique({ where: { userId: instructorUser.id } });
  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: { userId: instructorUser.id, schoolId: school.id, bio: "8 years experience, patient with nervous learners." },
    });
  }

  const vehicle = await prisma.vehicle.findFirst({ where: { schoolId: school.id } });
  if (!vehicle) {
    await prisma.vehicle.create({
      data: { schoolId: school.id, make: "Toyota", model: "Corolla Quest", year: 2022, licencePlate: "GP 123-456", transmission: "MANUAL" },
    });
  }

  const existingSlots = await prisma.availability.count({ where: { instructorId: instructor.id } });
  if (existingSlots === 0) {
    const today = new Date();
    const slots = [];
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);
      slots.push(
        { instructorId: instructor.id, date, startTime: "08:00", endTime: "09:00" },
        { instructorId: instructor.id, date, startTime: "10:00", endTime: "11:00" },
        { instructorId: instructor.id, date, startTime: "14:00", endTime: "15:00" }
      );
    }
    await prisma.availability.createMany({ data: slots });
  }

  const learnerUser = await prisma.user.upsert({
    where: { email: "learner@example.com" },
    update: {},
    create: {
      name: "Lerato Sithole",
      email: "learner@example.com",
      password: passwordHash,
      role: "LEARNER",
    },
  });
  const learner = await prisma.learner.findUnique({ where: { userId: learnerUser.id } });
  if (!learner) {
    await prisma.learner.create({ data: { userId: learnerUser.id } });
  }

  console.log("Seed complete. Test accounts (password: password123):");
  console.log("  System Admin:  admin@drivesmart.co.za");
  console.log("  School Admin:  owner@safedrive.co.za");
  console.log("  Instructor:    instructor@safedrive.co.za");
  console.log("  Learner:       learner@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
