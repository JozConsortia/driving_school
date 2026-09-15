import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { schoolsRouter } from "./routes/schools.routes.js";
import { instructorsRouter } from "./routes/instructors.routes.js";
import { vehiclesRouter } from "./routes/vehicles.routes.js";
import { availabilityRouter } from "./routes/availability.routes.js";
import { bookingsRouter } from "./routes/bookings.routes.js";
import { reviewsRouter } from "./routes/reviews.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { licenceCategoriesRouter } from "./routes/licenceCategories.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/schools", schoolsRouter);
app.use("/api/instructors", instructorsRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/licence-categories", licenceCategoriesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`DriveSmart API listening on http://localhost:${port}`);
});
