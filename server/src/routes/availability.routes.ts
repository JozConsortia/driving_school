import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const availabilityRouter = Router();

// Public: view an instructor's open (unbooked, future) slots
availabilityRouter.get("/instructor/:instructorId", async (req, res) => {
  const slots = await prisma.availability.findMany({
    where: {
      instructorId: req.params.instructorId,
      isBooked: false,
      date: { gte: new Date(new Date().toDateString()) },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  res.json(slots);
});

// Instructor: view own slots (including booked)
availabilityRouter.get("/mine", requireAuth, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
  if (!instructor) return res.status(404).json({ error: "Instructor profile not found" });

  const slots = await prisma.availability.findMany({
    where: { instructorId: instructor.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  res.json(slots);
});

const createSlotSchema = z.object({
  date: z.string(), // "2026-09-20"
  startTime: z.string(), // "09:00"
  endTime: z.string(), // "10:00"
});

availabilityRouter.post("/", requireAuth, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const parsed = createSlotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
  if (!instructor) return res.status(404).json({ error: "Instructor profile not found" });

  const slot = await prisma.availability.create({
    data: {
      instructorId: instructor.id,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });
  res.status(201).json(slot);
});

availabilityRouter.delete("/:id", requireAuth, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
  if (!instructor) return res.status(404).json({ error: "Instructor profile not found" });

  const slot = await prisma.availability.findUnique({ where: { id: req.params.id } });
  if (!slot || slot.instructorId !== instructor.id) return res.status(404).json({ error: "Slot not found" });
  if (slot.isBooked) return res.status(409).json({ error: "Cannot delete a booked slot" });

  await prisma.availability.delete({ where: { id: slot.id } });
  res.status(204).send();
});
