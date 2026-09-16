import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SearchIcon } from "./icons";

const DASHBOARD_PATH: Record<string, string> = {
  LEARNER: "/learner/schedule",
  INSTRUCTOR: "/instructor",
  SCHOOL_ADMIN: "/school",
  SYSTEM_ADMIN: "/admin",
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  LEARNER: { label: "Learner", className: "badge-blue" },
  INSTRUCTOR: { label: "Instructor", className: "badge-green" },
  SCHOOL_ADMIN: { label: "School Admin", className: "badge-violet" },
  SYSTEM_ADMIN: { label: "Admin", className: "badge-amber" },
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

  const roleBadge = user ? ROLE_BADGE[user.role] : null;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            DriveSmart
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link to="/search" className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-violet-600">
            <SearchIcon className="h-4 w-4 text-violet-500" />
            <span className="hidden sm:inline">Find a school</span>
          </Link>
          {user ? (
            <>
              <Link
                to={DASHBOARD_PATH[user.role]}
                className="hidden font-medium text-slate-600 hover:text-violet-600 sm:inline"
              >
                My dashboard
              </Link>
              <span className="hidden items-center gap-2 md:flex">
                <span className="max-w-[8rem] truncate font-medium text-slate-700">{user.name}</span>
                {roleBadge && <span className={`badge ${roleBadge.className}`}>{roleBadge.label}</span>}
              </span>
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
      <div className="h-[3px] bg-gradient-to-r from-violet-500 via-sky-400 to-pink-400" />
    </header>
  );
}
