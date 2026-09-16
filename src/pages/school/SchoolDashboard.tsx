import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../../api/client";
import { StatTile } from "../../components/StatTile";
import { StarRating } from "../../components/StarRating";
import { CalendarIcon, CarIcon, ClipboardIcon, StarIcon, UserIcon, UsersIcon } from "../../components/icons";
import type { Booking, LicenceCategory, SchoolProfile } from "../../api/types";

type Tab = "overview" | "bookings" | "instructors" | "vehicles" | "services" | "profile";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-blue",
  COMPLETED: "badge-green",
  CANCELLED: "badge-slate",
  REJECTED: "badge-red",
};

const TABS: Tab[] = ["overview", "bookings", "instructors", "vehicles", "services", "profile"];

export function SchoolDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  function loadSchool() {
    api.get<SchoolProfile>("/schools/mine/profile").then((res) => setSchool(res.data));
  }
  function loadBookings() {
    api.get<Booking[]>("/bookings/school/mine").then((res) => setBookings(res.data));
  }

  useEffect(() => {
    loadSchool();
    loadBookings();
  }, []);

  if (!school) return <div className="px-4 py-16 text-center text-slate-500">Loading...</div>;

  const today = new Date().toDateString();
  const todaysLessons = bookings.filter((b) => new Date(b.date).toDateString() === today && b.status === "CONFIRMED");

  return (
    <div className="page-shell mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{school.name}</h1>
          <span className={`badge mt-1 ${school.status === "APPROVED" ? "badge-green" : "badge-amber"}`}>{school.status}</span>
        </div>
      </div>

      {school.status === "PENDING" && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Your school is awaiting approval from a system administrator before it appears in learner search results.
        </p>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn capitalize ${tab === t ? "tab-btn-active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === "overview" && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={<CalendarIcon className="h-5 w-5" />} value={todaysLessons.length} label="Today's lessons" color="blue" />
            <StatTile
              icon={<UsersIcon className="h-5 w-5" />}
              value={school.instructors.filter((i) => i.status === "ACTIVE").length}
              label="Active instructors"
              color="violet"
            />
            <StatTile icon={<CarIcon className="h-5 w-5" />} value={school.vehicles.length} label="Vehicles" color="amber" />
            <StatTile icon={<ClipboardIcon className="h-5 w-5" />} value={bookings.length} label="Total bookings" color="emerald" />
          </div>

          <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Your rating</p>
                <p className="text-xs text-slate-500">Based on {school.reviews.length} learner review{school.reviews.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <StarRating rating={school.avgRating} size="lg" />
          </div>

          <h2 className="section-title mt-8">Today's schedule</h2>
          <div className="mt-2 space-y-2">
            {todaysLessons.map((b) => (
              <div key={b.id} className="card p-3 text-sm">
                {b.startTime}-{b.endTime} · {b.learner?.user.name} with {b.instructor?.user.name}
              </div>
            ))}
            {todaysLessons.length === 0 && <p className="text-sm text-slate-400">No confirmed lessons today.</p>}
          </div>
        </div>
      )}

      {tab === "bookings" && <BookingsTab bookings={bookings} reload={loadBookings} setError={setError} />}
      {tab === "instructors" && <InstructorsTab instructors={school.instructors} reload={loadSchool} setError={setError} />}
      {tab === "vehicles" && <VehiclesTab vehicles={school.vehicles} reload={loadSchool} setError={setError} />}
      {tab === "services" && <ServicesTab services={school.services} reload={loadSchool} setError={setError} />}
      {tab === "profile" && <ProfileTab school={school} reload={loadSchool} setError={setError} />}
    </div>
  );
}

function BookingsTab({ bookings, reload, setError }: { bookings: Booking[]; reload: () => void; setError: (e: string | null) => void }) {
  async function act(id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED") {
    let reason: string | undefined;
    if (status === "REJECTED" || status === "CANCELLED") {
      reason = prompt(`Reason for ${status === "REJECTED" ? "rejecting" : "cancelling"} (optional):`) ?? undefined;
    }
    try {
      await api.put(`/bookings/${id}/status`, { status, reason });
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {new Date(b.date).toLocaleDateString()} · {b.startTime}-{b.endTime}
              </p>
              <p className="text-sm text-slate-500">
                Learner: {b.learner?.user.name} · Instructor: {b.instructor?.user.name} · {b.licenceCategory?.code}
              </p>
              {b.cancellationReason && <p className="text-sm text-slate-500">Reason: {b.cancellationReason}</p>}
            </div>
            <span className={`badge ${STATUS_BADGE[b.status]} shrink-0`}>{b.status}</span>
          </div>
          {b.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => act(b.id, "CONFIRMED")} className="btn btn-primary btn-sm">
                Accept
              </button>
              <button onClick={() => act(b.id, "REJECTED")} className="btn btn-danger btn-sm">
                Reject
              </button>
            </div>
          )}
          {b.status === "CONFIRMED" && (
            <div className="mt-3">
              <button onClick={() => act(b.id, "CANCELLED")} className="btn btn-danger btn-sm">
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
      {bookings.length === 0 && <div className="card p-8 text-center text-slate-500">No bookings yet.</div>}
    </div>
  );
}

function InstructorsTab({ instructors, reload, setError }: { instructors: SchoolProfile["instructors"]; reload: () => void; setError: (e: string | null) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", bio: "" });
  const [submitting, setSubmitting] = useState(false);

  async function addInstructor(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/instructors", form);
      setForm({ name: "", email: "", password: "", phone: "", bio: "" });
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(id: string, status: string) {
    try {
      await api.put(`/instructors/${id}/status`, { status: status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {instructors.map((i) => (
          <div key={i.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{i.user.name}</p>
                <p className="text-sm text-slate-500">
                  {i.user.email} {i.user.phone ? `· ${i.user.phone}` : ""}
                </p>
                {i.bio && <p className="text-sm text-slate-500">{i.bio}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${i.status === "ACTIVE" ? "badge-green" : "badge-slate"}`}>{i.status}</span>
              <button onClick={() => toggleStatus(i.id, i.status)} className="btn btn-outline btn-sm">
                {i.status === "ACTIVE" ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
        {instructors.length === 0 && <div className="card p-8 text-center text-slate-500">No instructors yet.</div>}
      </div>

      <form onSubmit={addInstructor} className="card space-y-3 p-5">
        <h3 className="section-title">Add instructor</h3>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
        <input required type="password" minLength={6} placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
        <textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" rows={2} />
        <button disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Adding..." : "Add instructor"}
        </button>
      </form>
    </div>
  );
}

function VehiclesTab({ vehicles, reload, setError }: { vehicles: SchoolProfile["vehicles"]; reload: () => void; setError: (e: string | null) => void }) {
  const [form, setForm] = useState({ make: "", model: "", year: "", licencePlate: "", transmission: "MANUAL" as "MANUAL" | "AUTOMATIC" });
  const [submitting, setSubmitting] = useState(false);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/vehicles", { ...form, year: form.year ? Number(form.year) : undefined });
      setForm({ make: "", model: "", year: "", licencePlate: "", transmission: "MANUAL" });
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {vehicles.map((v) => (
          <div key={v.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <CarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  {v.make} {v.model} {v.year}
                </p>
                <p className="text-sm text-slate-500">
                  {v.licencePlate} · {v.transmission} · {v.status}
                </p>
              </div>
            </div>
            <button onClick={() => remove(v.id)} className="btn btn-danger btn-sm">
              Remove
            </button>
          </div>
        ))}
        {vehicles.length === 0 && <div className="card p-8 text-center text-slate-500">No vehicles yet.</div>}
      </div>

      <form onSubmit={addVehicle} className="card space-y-3 p-5">
        <h3 className="section-title">Add vehicle</h3>
        <input required placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="input" />
        <input required placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input" />
        <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input" />
        <input required placeholder="Licence plate" value={form.licencePlate} onChange={(e) => setForm({ ...form, licencePlate: e.target.value })} className="input" />
        <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value as "MANUAL" | "AUTOMATIC" })} className="input">
          <option value="MANUAL">Manual</option>
          <option value="AUTOMATIC">Automatic</option>
        </select>
        <button disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Adding..." : "Add vehicle"}
        </button>
      </form>
    </div>
  );
}

function ServicesTab({ services, reload, setError }: { services: SchoolProfile["services"]; reload: () => void; setError: (e: string | null) => void }) {
  const [categories, setCategories] = useState<LicenceCategory[]>([]);
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<LicenceCategory[]>("/licence-categories").then((res) => {
      setCategories(res.data);
      if (res.data[0]) setCode(res.data[0].code);
    });
  }, []);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/schools/mine/services", { licenceCategoryCode: code, pricePerHour: Number(price) });
      setPrice("");
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/schools/mine/services/${id}`);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {services.map((s) => (
          <div key={s.id} className="card flex items-center justify-between p-4">
            <p className="text-slate-900">
              {s.licenceCategory.code} — <span className="font-semibold">R{s.pricePerHour}/hour</span>
            </p>
            <button onClick={() => remove(s.id)} className="btn btn-danger btn-sm">
              Remove
            </button>
          </div>
        ))}
        {services.length === 0 && <div className="card p-8 text-center text-slate-500">No services/prices set yet.</div>}
      </div>

      <form onSubmit={addService} className="card space-y-3 p-5">
        <h3 className="section-title">Set a price</h3>
        <select value={code} onChange={(e) => setCode(e.target.value)} className="input">
          {categories.map((c) => (
            <option key={c.id} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        <input required type="number" placeholder="Price per hour (R)" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
        <button disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Saving..." : "Save price"}
        </button>
      </form>
    </div>
  );
}

function ProfileTab({ school, reload, setError }: { school: SchoolProfile; reload: () => void; setError: (e: string | null) => void }) {
  const [form, setForm] = useState({
    name: school.name,
    description: school.description ?? "",
    city: school.city,
    address: school.address ?? "",
    phone: school.phone ?? "",
    email: school.email ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await api.put("/schools/mine/profile", form);
      setSaved(true);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={save} className="card mt-6 max-w-lg space-y-4 p-6">
      <div>
        <label className="field-label">School name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
      </div>
      <div>
        <label className="field-label">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">City</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
        </div>
      </div>
      <div>
        <label className="field-label">Address</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
      </div>
      <div>
        <label className="field-label">Contact email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
      </div>
      {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved!</p>}
      <button disabled={submitting} className="btn btn-primary">
        {submitting ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
