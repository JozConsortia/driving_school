import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const licenceCategoriesRouter = Router();

licenceCategoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.licenceCategory.findMany({ orderBy: { code: "asc" } });
  res.json(categories);
});

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

licenceCategoriesRouter.post("/", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.licenceCategory.findUnique({ where: { code: parsed.data.code } });
  if (existing) return res.status(409).json({ error: "Licence category already exists" });

  const category = await prisma.licenceCategory.create({ data: parsed.data });
  res.status(201).json(category);
});

licenceCategoriesRouter.delete("/:id", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  await prisma.licenceCategory.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
