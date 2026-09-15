import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const vehiclesRouter = Router();

vehiclesRouter.get("/mine", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const vehicles = await prisma.vehicle.findMany({ where: { schoolId: school.id } });
  res.json(vehicles);
});

const createVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().optional(),
  licencePlate: z.string().min(1),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
});

vehiclesRouter.post("/", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const parsed = createVehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const vehicle = await prisma.vehicle.create({ data: { ...parsed.data, schoolId: school.id } });
  res.status(201).json(vehicle);
});

vehiclesRouter.put("/:id/status", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const { status } = req.body as { status: "ACTIVE" | "MAINTENANCE" | "RETIRED" };
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle || vehicle.schoolId !== school.id) return res.status(404).json({ error: "Vehicle not found" });

  const updated = await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status } });
  res.json(updated);
});

vehiclesRouter.delete("/:id", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle || vehicle.schoolId !== school.id) return res.status(404).json({ error: "Vehicle not found" });

  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  res.status(204).send();
});
