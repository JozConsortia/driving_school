import { Link } from "react-router-dom";
import { CarIcon, SearchIcon, SteeringWheelIcon } from "../components/icons";

const FEATURES = [
  {
    title: "Learners",
    body: "Search schools, compare prices and instructors, and manage your lesson schedule.",
    icon: SearchIcon,
    image: "/images/feature-learners.jpg",
    color: "bg-blue-500 text-white",
  },
  {
    title: "Driving schools",
    body: "Manage instructors, vehicles, availability and bookings from one dashboard.",
    icon: CarIcon,
    image: "/images/feature-schools.jpg",
    color: "bg-violet-600 text-white",
  },
  {
    title: "Instructors",
    body: "View your schedule, track learner progress, and mark lessons complete.",
    icon: SteeringWheelIcon,
    image: "/images/feature-instructors.jpg",
    color: "bg-emerald-500 text-white",
  },
];

export function Home() {
  return (
    <div className="page-shell mx-auto max-w-6xl">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <span className="badge badge-violet">South Africa's driving-lesson marketplace</span>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Find. Book. <span className="text-violet-600">Learn to drive.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg lg:mx-0">
            DriveSmart connects learners with driving schools and instructors. Search by location, price, licence
            category and availability, then book your lesson in a few clicks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link to="/search" className="btn btn-primary px-6 py-3 text-base">
              Search driving schools
            </Link>
            <Link to="/register" className="btn btn-outline px-6 py-3 text-base">
              Create an account
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-violet-200 via-sky-200 to-pink-200 opacity-70 blur-2xl" />
          <div className="overflow-hidden rounded-[1.75rem] border border-white shadow-xl shadow-violet-900/10">
            <img
              src="/images/hero-driving.jpg"
              alt="A smiling learner driver behind the wheel"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card overflow-hidden text-left">
            <div className="relative">
              <img src={f.image} alt="" className="aspect-video w-full object-cover" />
              <div className={`absolute -bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-md ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="p-5 pt-6">
              <h2 className="font-display text-base font-bold text-slate-900">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
