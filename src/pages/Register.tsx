import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/client";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"LEARNER" | "SCHOOL_ADMIN">("LEARNER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({ name, email, password, phone, role, schoolName, city });
      navigate(user.role === "SCHOOL_ADMIN" ? "/school" : "/learner/schedule");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center text-2xl font-extrabold text-slate-900">Create an account</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Join DriveSmart in a minute</p>

      <div className="mt-6 flex rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
        <button
          type="button"
          onClick={() => setRole("LEARNER")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
            role === "LEARNER" ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          I'm a learner
        </button>
        <button
          type="button"
          onClick={() => setRole("SCHOOL_ADMIN")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
            role === "SCHOOL_ADMIN" ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          I run a driving school
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card mt-4 space-y-4 p-6">
        <div>
          <label className="field-label">Full name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {role === "SCHOOL_ADMIN" && (
          <>
            <div>
              <label className="field-label">School name</label>
              <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="field-label">City</label>
              <input required value={city} onChange={(e) => setCity(e.target.value)} className="input" />
            </div>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Your school will be reviewed by a system administrator before it appears in search results.
            </p>
          </>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
