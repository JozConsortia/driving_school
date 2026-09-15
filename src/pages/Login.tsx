import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/client";

const DASHBOARD_PATH: Record<string, string> = {
  LEARNER: "/learner/schedule",
  INSTRUCTOR: "/instructor",
  SCHOOL_ADMIN: "/school",
  SYSTEM_ADMIN: "/admin",
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(DASHBOARD_PATH[user.role] ?? "/");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-extrabold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Log in to manage your bookings</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="field-label">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        No account?{" "}
        <Link to="/register" className="font-medium text-violet-600 hover:text-violet-700">
          Sign up
        </Link>
      </p>

      <div className="mt-6 rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Demo accounts (password: password123)</p>
        <p className="mt-1.5">Learner: learner@example.com</p>
        <p>School admin: owner@safedrive.co.za</p>
        <p>Instructor: instructor@safedrive.co.za</p>
        <p>System admin: admin@drivesmart.co.za</p>
      </div>
    </div>
  );
}
