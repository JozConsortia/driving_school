import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["LEARNER", "INSTRUCTOR", "SCHOOL_ADMIN"]).default("LEARNER"),
  schoolName: z.string().optional(),
  city: z.string().optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, email, password, phone, role, schoolName, city } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  if (role === "SCHOOL_ADMIN" && (!schoolName || !city)) {
    return res.status(400).json({ error: "schoolName and city are required to register a driving school" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, phone, role },
  });

  if (role === "LEARNER") {
    await prisma.learner.create({ data: { userId: user.id } });
  } else if (role === "SCHOOL_ADMIN") {
    await prisma.drivingSchool.create({
      data: {
        ownerId: user.id,
        name: schoolName!,
        city: city!,
        status: "PENDING",
      },
    });
  }
  // INSTRUCTOR accounts are created by a school admin via /instructors, not self-registered.

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.status === "SUSPENDED") {
    return res.status(403).json({ error: "This account has been suspended" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      learner: true,
      instructor: { include: { school: true } },
      ownedSchool: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});
