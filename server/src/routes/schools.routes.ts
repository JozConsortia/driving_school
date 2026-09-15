import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const schoolsRouter = Router();

// Public search: GET /api/schools?city=&licenceCategory=&maxPrice=&minRating=&day=
schoolsRouter.get("/", async (req, res) => {
  const { city, licenceCategory, maxPrice, minRating, day } = req.query as Record<string, string | undefined>;

  const schools = await prisma.drivingSchool.findMany({
    where: {
      status: "APPROVED",
      ...(city ? { city: { contains: city } } : {}),
    },
    include: {
      services: { include: { licenceCategory: true } },
      instructors: { include: { availabilities: true, user: true }, where: { status: "ACTIVE" } },
      vehicles: true,
      reviews: { where: { status: "VISIBLE" } },
    },
  });

  const dayIndex = day ? Number(day) : undefined; // 0-6 (Sun-Sat)

  const results = schools
    .map((school) => {
      const avgRating =
        school.reviews.length > 0
          ? school.reviews.reduce((sum, r) => sum + r.rating, 0) / school.reviews.length
          : null;
      return { school, avgRating };
    })
    .filter(({ school, avgRating }) => {
      if (licenceCategory && !school.services.some((s) => s.licenceCategory.code === licenceCategory)) {
        return false;
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        const hasAffordable = school.services.some((s) => s.pricePerHour <= max);
        if (!hasAffordable) return false;
      }
      if (minRating && (avgRating === null || avgRating < Number(minRating))) {
        return false;
      }
      if (dayIndex !== undefined) {
        const hasDayAvailability = school.instructors.some((instr) =>
          instr.availabilities.some((a) => new Date(a.date).getDay() === dayIndex && !a.isBooked)
        );
        if (!hasDayAvailability) return false;
      }
      return true;
    })
    .map(({ school, avgRating }) => ({
      id: school.id,
      name: school.name,
      description: school.description,
      city: school.city,
      address: school.address,
      phone: school.phone,
      email: school.email,
      avgRating,
      reviewCount: school.reviews.length,
      services: school.services.map((s) => ({
        licenceCategory: s.licenceCategory.code,
        pricePerHour: s.pricePerHour,
      })),
      vehicleTypes: [...new Set(school.vehicles.map((v) => v.transmission))],
      instructorCount: school.instructors.length,
    }));

  res.json(results);
});

schoolsRouter.get("/:id", async (req, res) => {
  const school = await prisma.drivingSchool.findUnique({
    where: { id: req.params.id },
    include: {
      services: { include: { licenceCategory: true } },
      instructors: { include: { user: true }, where: { status: "ACTIVE" } },
      vehicles: true,
      reviews: { where: { status: "VISIBLE" }, include: { user: true } },
    },
  });
  if (!school || school.status !== "APPROVED") {
    return res.status(404).json({ error: "School not found" });
  }
  const avgRating =
    school.reviews.length > 0
      ? school.reviews.reduce((sum, r) => sum + r.rating, 0) / school.reviews.length
      : null;
  res.json({ ...school, avgRating });
});

// School admin: manage own school profile
schoolsRouter.get("/mine/profile", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const school = await prisma.drivingSchool.findUnique({
    where: { ownerId: req.user!.userId },
    include: {
      services: { include: { licenceCategory: true } },
      instructors: { include: { user: true } },
      vehicles: true,
      reviews: true,
    },
  });
  if (!school) return res.status(404).json({ error: "No school found for this account" });
  res.json(school);
});

const updateSchoolSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

schoolsRouter.put("/mine/profile", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const parsed = updateSchoolSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const updated = await prisma.drivingSchool.update({
    where: { id: school.id },
    data: parsed.data,
  });
  res.json(updated);
});

const serviceSchema = z.object({
  licenceCategoryCode: z.string(),
  pricePerHour: z.number().positive(),
});

schoolsRouter.post("/mine/services", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const category = await prisma.licenceCategory.findUnique({ where: { code: parsed.data.licenceCategoryCode } });
  if (!category) return res.status(404).json({ error: "Unknown licence category" });

  const service = await prisma.schoolService.upsert({
    where: { schoolId_licenceCategoryId: { schoolId: school.id, licenceCategoryId: category.id } },
    update: { pricePerHour: parsed.data.pricePerHour },
    create: { schoolId: school.id, licenceCategoryId: category.id, pricePerHour: parsed.data.pricePerHour },
  });
  res.status(201).json(service);
});

schoolsRouter.delete(
  "/mine/services/:serviceId",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: AuthRequest, res) => {
    const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
    if (!school) return res.status(404).json({ error: "No school found for this account" });

    const service = await prisma.schoolService.findUnique({ where: { id: req.params.serviceId } });
    if (!service || service.schoolId !== school.id) return res.status(404).json({ error: "Service not found" });

    await prisma.schoolService.delete({ where: { id: service.id } });
    res.status(204).send();
  }
);
