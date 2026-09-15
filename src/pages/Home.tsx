import { Link } from "react-router-dom";
import { CarIcon, SearchIcon, SteeringWheelIcon } from "../components/icons";

const FEATURES = [
  {
    title: "Learners",
    body: "Search schools, compare prices and instructors, and manage your lesson schedule.",
    icon: SearchIcon,
  },
  {
    title: "Driving schools",
    body: "Manage instructors, vehicles, availability and bookings from one dashboard.",
    icon: CarIcon,
  },
  {
    title: "Instructors",
    body: "View your schedule, track learner progress, and mark lessons complete.",
    icon: SteeringWheelIcon,
  },
];

export function Home() {
  return (
    <div className="page-shell mx-auto max-w-6xl text-center">
      <span className="badge badge-violet">South Africa's driving-lesson marketplace</span>

      <div className="mt-5 flex items-center justify-center gap-3 text-violet-300">
        <CarIcon className="h-6 w-6 -scale-x-100 opacity-60" />
        <CarIcon className="h-9 w-9 text-violet-500" />
        <CarIcon className="h-6 w-6 opacity-60" />
      </div>

      <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Find. Book. Learn to drive.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
        DriveSmart connects learners with driving schools and instructors. Search by location, price, licence
        category and availability, then book your lesson in a few clicks.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/search" className="btn btn-primary px-6 py-3 text-base">
          Search driving schools
        </Link>
        <Link to="/register" className="btn btn-outline px-6 py-3 text-base">
          Create an account
        </Link>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-5 text-left sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <f.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-slate-900">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
