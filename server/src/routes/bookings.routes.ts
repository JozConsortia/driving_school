import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

export const bookingsRouter = Router();

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

async function notify(userId: string, message: string) {
  await prisma.notification.create({ data: { userId, message } });
}

/**
 * Booking logic (spec section 10):
 * 1. instructor availability slot must exist and be open for the requested time
 * 2. instructor must not already have an overlapping booking
 * 3. vehicle (if requested) must not already have an overlapping booking
 * 4. learner must not already have an overlapping booking
 */
async function findConflicts(opts: {
  date: Date;
  startTime: string;
  endTime: string;
  instructorId: string;
  vehicleId?: string;
  learnerId: string;
  excludeBookingId?: string;
}) {
  const dayBookings = await prisma.booking.findMany({
    where: {
      date: opts.date,
      status: { in: ACTIVE_STATUSES },
      id: opts.excludeBookingId ? { not: opts.excludeBookingId } : undefined,
      OR: [
        { instructorId: opts.instructorId },
        { learnerId: opts.learnerId },
        ...(opts.vehicleId ? [{ vehicleId: opts.vehicleId }] : []),
      ],
    },
  });

  const conflicts: string[] = [];
  for (const b of dayBookings) {
    if (!overlaps(opts.startTime, opts.endTime, b.startTime, b.endTime)) continue;
    if (b.instructorId === opts.instructorId) conflicts.push("Instructor already has a booking at this time");
    if (b.learnerId === opts.learnerId) conflicts.push("You already have a booking at this time");
    if (opts.vehicleId && b.vehicleId === opts.vehicleId) conflicts.push("Vehicle already booked at this time");
  }
  return conflicts;
}

const createBookingSchema = z.object({
  instructorId: z.string(),
  schoolId: z.string(),
  vehicleId: z.string().optional(),
  licenceCategoryCode: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

bookingsRouter.post("/", requireAuth, requireRole("LEARNER"), async (req: AuthRequest, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { instructorId, schoolId, vehicleId, licenceCategoryCode, date, startTime, endTime } = parsed.data;

  const learner = await prisma.learner.findUnique({ where: { userId: req.user!.userId } });
  if (!learner) return res.status(404).json({ error: "Learner profile not found" });

  const licenceCategory = await prisma.licenceCategory.findUnique({ where: { code: licenceCategoryCode } });
  if (!licenceCategory) return res.status(404).json({ error: "Unknown licence category" });

  const bookingDate = new Date(date);

  // 1. Instructor must have an open availability slot covering this time
  const slot = await prisma.availability.findFirst({
    where: {
      instructorId,
      date: bookingDate,
      isBooked: false,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  });
  if (!slot) {
    const alternatives = await prisma.availability.findMany({
      where: { instructorId, isBooked: false, date: { gte: new Date(new Date().toDateString()) } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    });
    return res.status(409).json({ error: "Instructor is not available at that time", alternatives });
  }

  // 2-4. No overlapping bookings for instructor, vehicle, or learner
  const conflicts = await findConflicts({
    date: bookingDate,
    startTime,
    endTime,
    instructorId,
    vehicleId,
    learnerId: learner.id,
  });
  if (conflicts.length > 0) {
    return res.status(409).json({ error: "Booking conflict", details: conflicts });
  }

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        learnerId: learner.id,
        instructorId,
        schoolId,
        vehicleId,
        licenceCategoryId: licenceCategory.id,
        date: bookingDate,
        startTime,
        endTime,
        status: "PENDING",
      },
    }),
    prisma.availability.update({ where: { id: slot.id }, data: { isBooked: true } }),
  ]);

  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
  if (instructor) await notify(instructor.userId, `New lesson booking request for ${date} ${startTime}`);

  res.status(201).json(booking);
});

bookingsRouter.get("/mine", requireAuth, requireRole("LEARNER"), async (req: AuthRequest, res) => {
  const learner = await prisma.learner.findUnique({ where: { userId: req.user!.userId } });
  if (!learner) return res.status(404).json({ error: "Learner profile not found" });

  const bookings = await prisma.booking.findMany({
    where: { learnerId: learner.id },
    include: {
      school: true,
      instructor: { include: { user: { select: { name: true } } } },
      vehicle: true,
      licenceCategory: true,
      lessonRecord: true,
    },
    orderBy: { date: "desc" },
  });
  res.json(bookings);
});

bookingsRouter.get("/instructor/mine", requireAuth, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
  if (!instructor) return res.status(404).json({ error: "Instructor profile not found" });

  const bookings = await prisma.booking.findMany({
    where: { instructorId: instructor.id },
    include: {
      learner: { include: { user: { select: { name: true, phone: true } } } },
      vehicle: true,
      licenceCategory: true,
      lessonRecord: true,
    },
    orderBy: { date: "desc" },
  });
  res.json(bookings);
});

bookingsRouter.get("/school/mine", requireAuth, requireRole("SCHOOL_ADMIN"), async (req: AuthRequest, res) => {
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
  if (!school) return res.status(404).json({ error: "No school found for this account" });

  const bookings = await prisma.booking.findMany({
    where: { schoolId: school.id },
    include: {
      learner: { include: { user: { select: { name: true, phone: true } } } },
      instructor: { include: { user: { select: { name: true } } } },
      vehicle: true,
      licenceCategory: true,
      lessonRecord: true,
    },
    orderBy: { date: "desc" },
  });
  res.json(bookings);
});

type BookingRecord = NonNullable<Awaited<ReturnType<typeof prisma.booking.findUnique>>>;
type BookingCheckResult =
  | { ok: false; error: string; status: number }
  | { ok: true; booking: BookingRecord };

async function assertCanManageBooking(req: AuthRequest, bookingId: string): Promise<BookingCheckResult> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "Booking not found", status: 404 };

  if (req.user!.role === "SCHOOL_ADMIN") {
    const school = await prisma.drivingSchool.findUnique({ where: { ownerId: req.user!.userId } });
    if (!school || booking.schoolId !== school.id) return { ok: false, error: "Forbidden", status: 403 };
  } else if (req.user!.role === "INSTRUCTOR") {
    const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
    if (!instructor || booking.instructorId !== instructor.id) return { ok: false, error: "Forbidden", status: 403 };
  } else if (req.user!.role === "LEARNER") {
    const learner = await prisma.learner.findUnique({ where: { userId: req.user!.userId } });
    if (!learner || booking.learnerId !== learner.id) return { ok: false, error: "Forbidden", status: 403 };
  }
  return { ok: true, booking };
}

const statusSchema = z.object({ status: z.enum(["CONFIRMED", "REJECTED", "CANCELLED"]) });

bookingsRouter.put(
  "/:id/status",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "INSTRUCTOR", "LEARNER"),
  async (req: AuthRequest, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const check = await assertCanManageBooking(req, req.params.id);
    if (!check.ok) return res.status(check.status).json({ error: check.error });
    const { booking } = check;

    // Learners may only cancel their own booking, not confirm/reject it.
    if (req.user!.role === "LEARNER" && parsed.data.status !== "CANCELLED") {
      return res.status(403).json({ error: "Learners may only cancel bookings" });
    }
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      return res.status(409).json({ error: `Booking already ${booking.status.toLowerCase()}` });
    }

    const freeingSlot = parsed.data.status === "REJECTED" || parsed.data.status === "CANCELLED";

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status } });
      if (freeingSlot) {
        await tx.availability.updateMany({
          where: { instructorId: booking.instructorId, date: booking.date, startTime: booking.startTime, endTime: booking.endTime },
          data: { isBooked: false },
        });
      }
      return b;
    });

    const instructor = await prisma.instructor.findUnique({ where: { id: booking.instructorId } });
    const learner = await prisma.learner.findUnique({ where: { id: booking.learnerId } });
    const message = `Your lesson on ${booking.date.toDateString()} at ${booking.startTime} was ${parsed.data.status.toLowerCase()}`;
    if (instructor) await notify(instructor.userId, message);
    if (learner) await notify(learner.userId, message);

    res.json(updated);
  }
);

const rescheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

bookingsRouter.put(
  "/:id/reschedule",
  requireAuth,
  requireRole("LEARNER", "SCHOOL_ADMIN"),
  async (req: AuthRequest, res) => {
    const parsed = rescheduleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const check = await assertCanManageBooking(req, req.params.id);
    if (!check.ok) return res.status(check.status).json({ error: check.error });
    const { booking } = check;

    if (!ACTIVE_STATUSES.includes(booking.status)) {
      return res.status(409).json({ error: `Cannot reschedule a ${booking.status.toLowerCase()} booking` });
    }

    const newDate = new Date(parsed.data.date);
    const newSlot = await prisma.availability.findFirst({
      where: {
        instructorId: booking.instructorId,
        date: newDate,
        isBooked: false,
        startTime: { lte: parsed.data.startTime },
        endTime: { gte: parsed.data.endTime },
      },
    });
    if (!newSlot) return res.status(409).json({ error: "Instructor is not available at that time" });

    const conflicts = await findConflicts({
      date: newDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      instructorId: booking.instructorId,
      vehicleId: booking.vehicleId ?? undefined,
      learnerId: booking.learnerId,
      excludeBookingId: booking.id,
    });
    if (conflicts.length > 0) return res.status(409).json({ error: "Booking conflict", details: conflicts });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.availability.updateMany({
        where: { instructorId: booking.instructorId, date: booking.date, startTime: booking.startTime, endTime: booking.endTime },
        data: { isBooked: false },
      });
      await tx.availability.update({ where: { id: newSlot.id }, data: { isBooked: true } });
      return tx.booking.update({
        where: { id: booking.id },
        data: { date: newDate, startTime: parsed.data.startTime, endTime: parsed.data.endTime, status: "PENDING" },
      });
    });

    res.json(updated);
  }
);

const completeSchema = z.object({
  notes: z.string().optional(),
  progress: z.string().optional(),
  attendance: z.enum(["PRESENT", "ABSENT"]).default("PRESENT"),
});

bookingsRouter.post("/:id/complete", requireAuth, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const instructor = await prisma.instructor.findUnique({ where: { userId: req.user!.userId } });
  if (!instructor) return res.status(404).json({ error: "Instructor profile not found" });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.instructorId !== instructor.id) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "CONFIRMED") return res.status(409).json({ error: "Only confirmed bookings can be completed" });

  const [, record] = await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } }),
    prisma.lessonRecord.create({
      data: {
        bookingId: booking.id,
        instructorId: instructor.id,
        notes: parsed.data.notes,
        progress: parsed.data.progress,
        attendance: parsed.data.attendance,
      },
    }),
  ]);

  const learner = await prisma.learner.findUnique({ where: { id: booking.learnerId } });
  if (learner) await notify(learner.userId, `Your lesson on ${booking.date.toDateString()} was marked completed`);

  res.status(201).json(record);
});
