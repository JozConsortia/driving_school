# DriveSmart — Driving School Search, Booking & Management

A full-stack marketplace connecting learners with driving schools and instructors across
South Africa: learners search and compare schools, book lessons, and track their progress;
driving schools manage instructors, vehicles, and pricing; instructors manage availability
and lesson records; a system administrator approves schools and moderates the platform.
A Gemini-powered chat assistant helps learners find a school just by talking to it.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router — at the repo root (`src/`)
- **Backend:** Java 21 + Spring Boot 4 (Web MVC, Security, Data JPA) — in `backend/`
- **Database:** MySQL, via Hibernate (`spring.jpa.hibernate.ddl-auto=update` — schema is
  created/updated automatically, no manual migrations needed)
- **Auth:** JWT + BCrypt, role-based access control (`LEARNER`, `INSTRUCTOR`, `SCHOOL_ADMIN`, `SYSTEM_ADMIN`)
- **AI chat assistant:** Google Gemini (`gemini-3.8-flash`) with function-calling — the
  assistant can only recommend schools it actually finds via a real database search tool,
  and is scoped to only discuss driving-school topics

> **Note:** `server/` contains an alternate Node/Express/Prisma implementation of the same
> API. It is **not used** — the Spring Boot backend in `backend/` is the one the frontend
> talks to. It's kept around as a reference/alternate implementation only.

## Project layout

```
driving_school/
├── src/                          # React frontend
│   ├── api/                      # axios client + shared TypeScript types
│   ├── context/                  # AuthContext (JWT session, current user)
│   ├── components/                # Navbar, NotificationBell, StarRating, ChatWidget, ...
│   └── pages/
│       ├── learner/               # search, school profile/booking, schedule
│       ├── school/                # school admin dashboard (bookings, instructors, vehicles...)
│       ├── instructor/            # instructor dashboard (schedule, availability, bio)
│       ├── admin/                 # system admin dashboard
│       └── Profile.tsx            # self-service profile/password editing (any role)
├── public/images/                 # stock photography used across the UI
└── backend/                       # Spring Boot API (the active backend)
    └── src/main/java/com/drivesmart/api/
        ├── controller/            # one REST controller per resource
        ├── service/                # business logic, incl. ChatService (Gemini integration)
        ├── entity/                 # JPA entities
        ├── repository/             # Spring Data repositories
        ├── dto/                    # request/response records
        ├── security/                # JWT filter, current-user helper
        └── DataSeeder.java         # demo data (schools, bookings, reviews) seeded on first run
```

## Getting started

### Prerequisites

- JDK 21+ (the included Maven wrapper handles Maven itself)
- Node.js 18+
- A running MySQL server

### 1. Database

Create a database and user matching `backend/src/main/resources/application.properties.example`
(or edit that file to match your own MySQL setup):

```sql
CREATE DATABASE drivesmart;
CREATE USER 'drivesmart_app'@'localhost' IDENTIFIED BY 'your-password-here';
GRANT ALL PRIVILEGES ON drivesmart.* TO 'drivesmart_app'@'localhost';
```

### 2. Backend

```bash
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# edit application.properties: set your MySQL password and a random JWT secret

# optional — enables the AI chat assistant; the app works fine without it,
# the chat widget just shows "not configured" until this is set
export GEMINI_API_KEY=your-gemini-api-key

./mvnw spring-boot:run
```

The API starts on **http://localhost:4000**. On first run it seeds demo accounts, several
driving schools with varied ratings, and sample bookings/reviews — see below.

### 3. Frontend

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the backend, so no
CORS setup is needed in development.

### Demo accounts (password: `password123`)

| Role | Email | Notes |
|---|---|---|
| System admin | admin@drivesmart.co.za | Full platform moderation |
| School admin | owner@safedrive.co.za | SafeDrive Driving School, Pretoria |
| School admin | aisha@capewheels.co.za | Cape Wheels Driving Academy — top-rated (★4.75) |
| School admin | priya@drivetime.co.za | Durban Drive Time — mixed reviews, one reported |
| School admin | johan@bloemlearners.co.za | Bloem Learner Drivers — still pending approval |
| Instructor | instructor@safedrive.co.za | |
| Instructor | michael@capewheels.co.za | Full availability calendar + booking history |
| Learner | learner@example.com | |
| Learner | bongani.learner@example.com | Bookings across multiple schools, all statuses |

## What's implemented

- **Learners:** register/login, search schools by location/licence category/price/rating/day
  availability with sortable results, view school profiles and instructors, book/reschedule/
  cancel lessons (with an optional reason), view schedule with upcoming/completed/cancelled
  totals, leave/edit/delete a review after a completed lesson, chat with the AI assistant to
  find a school conversationally.
- **Driving schools:** manage profile, instructors, vehicles, licence-category pricing,
  accept/reject/cancel bookings (with a reason), dashboard overview of today's lessons and
  their own rating.
- **Instructors:** set/remove availability slots, view assigned learners and schedule, mark
  lessons completed with notes/progress/attendance, edit their own bio.
- **System admin:** approve/reject/suspend schools, manage user accounts, moderate reported
  reviews, platform-wide stats.
- **Everyone:** self-service profile editing (name/phone) and password change, in-app
  notifications (bell icon with unread count) for booking updates and status changes.
- **Booking logic:** a booking is only created if the instructor has a matching open
  availability slot and there's no overlapping booking for that instructor, vehicle, or
  learner.
- **AI chat assistant:** grounded in real search results (never invents school names or
  prices), keeps conversation on-topic, and surfaces matched schools as clickable cards
  inline in the chat.

## Not yet built

Password reset via email, email/SMS/WhatsApp booking reminders, photo uploads for schools/
vehicles, pagination on long lists, admin analytics charts, interactive map search, online
payments, document verification, and a mobile app.
