# DriveSmart — Driving School Search, Booking & Management

A full-stack MVP implementing the DriveSmart concept: learners search and compare driving
schools, book lessons with instructors, and track their schedule; driving schools manage
instructors, vehicles, pricing and bookings; instructors manage availability and lesson
progress; a system administrator approves schools and moderates the platform.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite via Prisma ORM (swap to MySQL/Postgres later by changing the
  `datasource` provider in `server/prisma/schema.prisma` and `DATABASE_URL`)
- **Auth:** JWT + bcrypt

## Project layout

```
driving_school/
├── src/                 # React frontend
│   ├── api/             # axios client + shared types
│   ├── context/         # AuthContext (JWT session)
│   ├── components/      # Navbar, ProtectedRoute
│   └── pages/           # learner/, school/, instructor/, admin/ dashboards
└── server/              # Express + Prisma API
    ├── prisma/          # schema.prisma, migrations, dev.db
    └── src/
        ├── routes/      # one router per resource
        ├── middleware/  # JWT auth + role-based access control
        └── seed.ts      # demo data
```

## Getting started

```bash
npm run install:all   # installs both frontend and server dependencies
npm run db:seed       # (first time only) creates server/prisma/dev.db with demo data
npm run dev           # runs the API (port 4000) and the Vite dev server (port 5173) together
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend, so no
extra CORS setup is needed in development.

To reset the database: delete `server/prisma/dev.db`, then run `npx prisma migrate dev`
and `npm run db:seed` inside `server/`.

### Demo accounts (password: `password123`)

| Role | Email |
|---|---|
| System admin | admin@drivesmart.co.za |
| Driving school admin | owner@safedrive.co.za |
| Instructor | instructor@safedrive.co.za |
| Learner | learner@example.com |

## What's implemented (MVP scope)

- **Learners:** register/login, search schools by location/licence category/price/rating/day
  availability, view school profiles and instructors, book/reschedule/cancel lessons, view
  schedule with upcoming/completed/cancelled totals, leave a review after a completed lesson.
- **Driving schools:** manage profile, instructors, vehicles, licence-category pricing,
  accept/reject/cancel bookings, dashboard overview of today's lessons.
- **Instructors:** set/remove availability slots, view assigned learners and schedule, mark
  lessons completed with notes/progress/attendance.
- **System admin:** approve/reject/suspend schools, manage user accounts, moderate reported
  reviews, platform-wide stats.
- **Booking logic:** a booking is only created if the instructor has a matching open
  availability slot and there's no overlapping booking for that instructor, vehicle, or
  learner — matching the conflict rules in the spec.

## Not yet built (see spec's "Advanced Features for Later")

AI-based school recommendations, interactive map search, online payments, email/SMS/WhatsApp
reminders, instructor performance analytics, document verification, and a mobile app.
