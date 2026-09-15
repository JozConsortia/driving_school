import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const reviewsRouter = Router();

reviewsRouter.get("/school/:schoolId", async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { schoolId: req.params.schoolId, status: "VISIBLE" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
});

const createReviewSchema = z.object({
  schoolId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.post("/", requireAuth, requireRole("LEARNER"), async (req: AuthRequest, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const learner = await prisma.learner.findUnique({ where: { userId: req.user!.userId } });
  if (!learner) return res.status(404).json({ error: "Learner profile not found" });

  const hasCompletedLesson = await prisma.booking.findFirst({
    where: { learnerId: learner.id, schoolId: parsed.data.schoolId, status: "COMPLETED" },
  });
  if (!hasCompletedLesson) {
    return res.status(403).json({ error: "You can only review a school after completing a lesson there" });
  }

  const review = await prisma.review.create({
    data: {
      learnerId: learner.id,
      userId: req.user!.userId,
      schoolId: parsed.data.schoolId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });
  res.status(201).json(review);
});

reviewsRouter.put("/:id/report", requireAuth, async (req: AuthRequest, res) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { status: "REPORTED" } });
  res.status(204).send();
});
