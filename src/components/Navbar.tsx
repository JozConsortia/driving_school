import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DASHBOARD_PATH: Record<string, string> = {
  LEARNER: "/learner/schedule",
  INSTRUCTOR: "/instructor",
  SCHOOL_ADMIN: "/school",
  SYSTEM_ADMIN: "/admin",
};

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="url(#navGradient)" />
      <circle cx="24" cy="24" r="13" stroke="white" strokeWidth="2.6" fill="none" />
      <circle cx="24" cy="24" r="3.2" fill="white" />
      <path
        d="M24 13v7.2M24 27.8V35M14.2 18.5l6.1 3.6M27.7 25.9l6.1 3.6M14.2 29.5l6.1-3.6M27.7 22.1l6.1-3.6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="navGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">DriveSmart</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link to="/search" className="font-medium text-slate-600 hover:text-violet-600">
            Find a school
          </Link>
          {user ? (
            <>
              <Link
                to={DASHBOARD_PATH[user.role]}
                className="hidden font-medium text-slate-600 hover:text-violet-600 sm:inline"
              >
                My dashboard
              </Link>
              <span className="hidden max-w-[8rem] truncate font-medium text-slate-700 md:inline">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn btn-outline btn-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-slate-600 hover:text-violet-600">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
