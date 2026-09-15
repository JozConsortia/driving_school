import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

notificationsRouter.put("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Notification not found" });
  }
  const updated = await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
  res.json(updated);
});

notificationsRouter.put("/read-all", requireAuth, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
  res.status(204).send();
});
