import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../../api/client";
import { StatTile } from "../../components/StatTile";
import { StarRating } from "../../components/StarRating";
import {
  BuildingIcon,
  CarIcon,
  CheckCircleIcon,
  ClipboardIcon,
  ClockIcon,
  SteeringWheelIcon,
  UserIcon,
  UsersIcon,
} from "../../components/icons";

type Tab = "overview" | "schools" | "users" | "reviews";

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalInstructors: number;
  totalSchools: number;
  approvedSchools: number;
  pendingSchools: number;
  totalBookings: number;
  completedBookings: number;
}

interface AdminSchool {
  id: string;
  name: string;
  city: string;
  status: string;
  owner: { name: string; email: string; phone: string | null };
  _count: { instructors: number; vehicles: number; bookings: number };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface ReportedReview {
  id: string;
  rating: number;
  comment: string | null;
  user: { name: string; email: string };
  school: { name: string };
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Stats>("/admin/stats").then((res) => setStats(res.data));
  }, []);

  return (
    <div className="page-shell mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold text-slate-900">System administration</h1>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {(["overview", "schools", "users", "reviews"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn capitalize ${tab === t ? "tab-btn-active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === "overview" && stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total users", value: stats.totalUsers, icon: UsersIcon },
            { label: "Learners", value: stats.totalLearners, icon: UserIcon },
            { label: "Instructors", value: stats.totalInstructors, icon: SteeringWheelIcon },
            { label: "Driving schools", value: stats.totalSchools, icon: BuildingIcon },
            { label: "Approved schools", value: stats.approvedSchools, icon: CheckCircleIcon },
            { label: "Pending schools", value: stats.pendingSchools, icon: ClockIcon },
            { label: "Total bookings", value: stats.totalBookings, icon: ClipboardIcon },
            { label: "Completed lessons", value: stats.completedBookings, icon: CarIcon },
          ].map((s) => (
            <StatTile key={s.label} icon={<s.icon className="h-5 w-5" />} value={s.value} label={s.label} />
          ))}
        </div>
      )}

      {tab === "schools" && <SchoolsTab setError={setError} />}
      {tab === "users" && <UsersTab setError={setError} />}
      {tab === "reviews" && <ReviewsTab setError={setError} />}
    </div>
  );
}

function SchoolsTab({ setError }: { setError: (e: string | null) => void }) {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [filter, setFilter] = useState("");

  function load() {
    api.get<AdminSchool[]>("/admin/schools", { params: filter ? { status: filter } : {} }).then((res) => setSchools(res.data));
  }

  useEffect(load, [filter]);

  async function setStatus(id: string, status: string) {
    try {
      await api.put(`/admin/schools/${id}/status`, { status });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6">
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
        <option value="">All schools</option>
        <option value="PENDING">Pending approval</option>
        <option value="APPROVED">Approved</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <div className="mt-4 space-y-3">
        {schools.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {s.name} — {s.city}
                </p>
                <p className="text-sm text-slate-500">
                  Owner: {s.owner.name} ({s.owner.email})
                </p>
                <p className="text-sm text-slate-500">
                  {s._count.instructors} instructors · {s._count.vehicles} vehicles · {s._count.bookings} bookings
                </p>
              </div>
              <span className="badge badge-slate">{s.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {s.status !== "APPROVED" && (
                <button onClick={() => setStatus(s.id, "APPROVED")} className="btn btn-primary btn-sm">
                  Approve
                </button>
              )}
              {s.status !== "SUSPENDED" && (
                <button onClick={() => setStatus(s.id, "SUSPENDED")} className="btn btn-danger btn-sm">
                  Suspend
                </button>
              )}
              {s.status === "PENDING" && (
                <button onClick={() => setStatus(s.id, "REJECTED")} className="btn btn-outline btn-sm">
                  Reject
                </button>
              )}
            </div>
          </div>
        ))}
        {schools.length === 0 && <div className="card mt-4 p-8 text-center text-slate-500">No schools found.</div>}
      </div>
    </div>
  );
}

function UsersTab({ setError }: { setError: (e: string | null) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState("");

  function load() {
    api.get<AdminUser[]>("/admin/users", { params: filter ? { role: filter } : {} }).then((res) => setUsers(res.data));
  }

  useEffect(load, [filter]);

  async function toggleStatus(id: string, status: string) {
    try {
      await api.put(`/admin/users/${id}/status`, { status: status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6">
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
        <option value="">All roles</option>
        <option value="LEARNER">Learners</option>
        <option value="INSTRUCTOR">Instructors</option>
        <option value="SCHOOL_ADMIN">School admins</option>
        <option value="SYSTEM_ADMIN">System admins</option>
      </select>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.status === "ACTIVE" ? "badge-green" : "badge-red"}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== "SYSTEM_ADMIN" && (
                    <button onClick={() => toggleStatus(u.id, u.status)} className="btn btn-outline btn-sm">
                      {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-8 text-center text-slate-500">No users found.</p>}
      </div>
    </div>
  );
}

function ReviewsTab({ setError }: { setError: (e: string | null) => void }) {
  const [reviews, setReviews] = useState<ReportedReview[]>([]);

  function load() {
    api.get<ReportedReview[]>("/admin/reviews/reported").then((res) => setReviews(res.data));
  }
  useEffect(load, []);

  async function resolve(id: string, status: "VISIBLE" | "REMOVED") {
    try {
      await api.put(`/admin/reviews/${id}/status`, { status });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{r.school.name}</p>
            <StarRating rating={r.rating} showValue={false} size="sm" />
          </div>
          <p className="text-sm text-slate-500">
            By {r.user.name} ({r.user.email})
          </p>
          {r.comment && <p className="mt-1 text-sm text-slate-700">"{r.comment}"</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => resolve(r.id, "VISIBLE")} className="btn btn-outline btn-sm">
              Keep visible
            </button>
            <button onClick={() => resolve(r.id, "REMOVED")} className="btn btn-danger btn-sm">
              Remove
            </button>
          </div>
        </div>
      ))}
      {reviews.length === 0 && <div className="card p-8 text-center text-slate-500">No reported reviews.</div>}
    </div>
  );
}
