import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("SYSTEM_ADMIN"));

adminRouter.get("/schools", async (req, res) => {
  const { status } = req.query as { status?: string };
  const schools = await prisma.drivingSchool.findMany({
    where: status ? { status } : undefined,
    include: { owner: { select: { name: true, email: true, phone: true } }, _count: { select: { instructors: true, vehicles: true, bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(schools);
});

const statusSchema = z.object({ status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]) });

adminRouter.put("/schools/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const school = await prisma.drivingSchool.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
  await prisma.notification.create({
    data: { userId: school.ownerId, message: `Your school "${school.name}" status was updated to ${parsed.data.status}` },
  });
  res.json(school);
});

adminRouter.get("/users", async (req, res) => {
  const { role } = req.query as { role?: string };
  const users = await prisma.user.findMany({
    where: role ? { role: role as never } : undefined,
    select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

const userStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

adminRouter.put("/users/:id/status", async (req, res) => {
  const parsed = userStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
  res.json({ id: user.id, name: user.name, email: user.email, status: user.status });
});

adminRouter.get("/reviews/reported", async (_req, res) => {
  const reviews = await prisma.review.findMany({
    where: { status: "REPORTED" },
    include: { user: { select: { name: true, email: true } }, school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
});

adminRouter.put("/reviews/:id/status", async (req, res) => {
  const parsed = z.object({ status: z.enum(["VISIBLE", "REMOVED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
  res.json(review);
});

adminRouter.get("/stats", async (_req, res) => {
  const [totalUsers, totalLearners, totalInstructors, totalSchools, approvedSchools, pendingSchools, totalBookings, completedBookings] =
    await Promise.all([
      prisma.user.count(),
      prisma.learner.count(),
      prisma.instructor.count(),
      prisma.drivingSchool.count(),
      prisma.drivingSchool.count({ where: { status: "APPROVED" } }),
      prisma.drivingSchool.count({ where: { status: "PENDING" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);
  res.json({
    totalUsers,
    totalLearners,
    totalInstructors,
    totalSchools,
    approvedSchools,
    pendingSchools,
    totalBookings,
    completedBookings,
  });
});
