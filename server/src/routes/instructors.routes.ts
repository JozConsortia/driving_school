import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const instructorsRouter = Router();

instructorsRouter.get("/school/:schoolId", async (req, res) => {
  const instructors = await prisma.instructor.findMany({
    where: { schoolId: req.params.schoolId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  res.json(instructors);
});

// School admin: list own instructors
instructorsRouter.get("/mine", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const instructors = await prisma.instructor.findMany({
    where: { schoolId: school.id },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  res.json(instructors);
});

const createInstructorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

// School admin: add a new instructor (creates the user account too)
instructorsRouter.post("/", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const parsed = createInstructorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      phone: parsed.data.phone,
      role: "INSTRUCTOR",
    },
  });

  const instructor = await prisma.instructor.create({
    data: { userId: user.id, schoolId: school.id, bio: parsed.data.bio },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  res.status(201).json(instructor);
});

instructorsRouter.put("/:id/status", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" };
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const instructor = await prisma.instructor.findUnique({ where: { id: req.params.id } });
  if (!instructor || instructor.schoolId !== school.id) return res.status(404).json({ error: "Instructor not found" });

  const updated = await prisma.instructor.update({ where: { id: instructor.id }, data: { status } });
  res.json(updated);
});
