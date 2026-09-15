import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../../api/client";
import { StatTile } from "../../components/StatTile";
import { CalendarIcon, CheckCircleIcon, UsersIcon } from "../../components/icons";
import type { AvailabilitySlot, Booking } from "../../api/types";

type Tab = "schedule" | "availability";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-blue",
  COMPLETED: "badge-green",
  CANCELLED: "badge-slate",
  REJECTED: "badge-red",
};

export function InstructorDashboard() {
  const [tab, setTab] = useState<Tab>("schedule");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Booking | null>(null);

  function loadBookings() {
    api.get<Booking[]>("/bookings/instructor/mine").then((res) => setBookings(res.data));
  }
  function loadSlots() {
    api.get<AvailabilitySlot[]>("/availability/mine").then((res) => setSlots(res.data));
  }

  useEffect(() => {
    loadBookings();
    loadSlots();
  }, []);

  const learners = [...new Map(bookings.map((b) => [b.learner?.user.name, b.learner])).values()];

  return (
    <div className="page-shell mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Instructor dashboard</h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile
          icon={<CalendarIcon className="h-5 w-5" />}
          value={bookings.filter((b) => b.status === "CONFIRMED").length}
          label="Upcoming lessons"
        />
        <StatTile icon={<UsersIcon className="h-5 w-5" />} value={learners.length} label="Assigned learners" />
        <StatTile
          icon={<CheckCircleIcon className="h-5 w-5" />}
          value={bookings.filter((b) => b.status === "COMPLETED").length}
          label="Completed"
        />
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {(["schedule", "availability"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn capitalize ${tab === t ? "tab-btn-active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === "schedule" && (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {new Date(b.date).toLocaleDateString()} · {b.startTime}-{b.endTime}
                  </p>
                  <p className="text-sm text-slate-500">
                    Learner: {b.learner?.user.name} {b.learner?.user.phone ? `· ${b.learner.user.phone}` : ""} · {b.licenceCategory?.code}
                  </p>
                  {b.lessonRecord && (
                    <p className="mt-1 text-sm text-slate-600">Notes: {b.lessonRecord.notes || "—"} ({b.lessonRecord.attendance})</p>
                  )}
                </div>
                <span className={`badge ${STATUS_BADGE[b.status]} shrink-0`}>{b.status}</span>
              </div>
              {b.status === "CONFIRMED" && (
                <button onClick={() => setCompleting(b)} className="btn btn-primary btn-sm mt-3">
                  Mark completed
                </button>
              )}
            </div>
          ))}
          {bookings.length === 0 && <div className="card p-8 text-center text-slate-500">No lessons scheduled yet.</div>}
        </div>
      )}

      {tab === "availability" && <AvailabilityTab slots={slots} reload={loadSlots} setError={setError} />}

      {completing && (
        <CompleteLessonModal
          booking={completing}
          onClose={() => setCompleting(null)}
          onDone={() => {
            setCompleting(null);
            loadBookings();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

function AvailabilityTab({ slots, reload, setError }: { slots: AvailabilitySlot[]; reload: () => void; setError: (e: string | null) => void }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/availability", { date, startTime, endTime });
      setDate("");
      setStartTime("");
      setEndTime("");
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/availability/${id}`);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  const upcoming = slots.filter((s) => new Date(s.date) >= new Date(new Date().toDateString()));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-2">
        {upcoming.map((s) => (
          <div key={s.id} className="card flex items-center justify-between p-3">
            <p className="text-sm text-slate-900">
              {new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {s.startTime}-{s.endTime}
            </p>
            <div className="flex items-center gap-2">
              <span className={`badge ${s.isBooked ? "badge-blue" : "badge-green"}`}>{s.isBooked ? "Booked" : "Open"}</span>
              {!s.isBooked && (
                <button onClick={() => remove(s.id)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {upcoming.length === 0 && <div className="card p-8 text-center text-slate-500">No availability set yet.</div>}
      </div>

      <form onSubmit={addSlot} className="card space-y-3 p-5">
        <h3 className="section-title">Add availability</h3>
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        <div className="flex gap-2">
          <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
          <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
        </div>
        <button disabled={submitting} className="btn btn-primary w-full">
          {submitting ? "Adding..." : "Add slot"}
        </button>
      </form>
    </div>
  );
}

function CompleteLessonModal({
  booking,
  onClose,
  onDone,
  setError,
}: {
  booking: Booking;
  onClose: () => void;
  onDone: () => void;
  setError: (e: string | null) => void;
}) {
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState("");
  const [attendance, setAttendance] = useState<"PRESENT" | "ABSENT">("PRESENT");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/bookings/${booking.id}/complete`, { notes, progress, attendance });
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h2 className="section-title">Complete lesson — {booking.learner?.user.name}</h2>
        <div>
          <label className="field-label">Attendance</label>
          <select value={attendance} onChange={(e) => setAttendance(e.target.value as "PRESENT" | "ABSENT")} className="input">
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
        <div>
          <label className="field-label">Lesson notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
        </div>
        <div>
          <label className="field-label">Progress</label>
          <textarea
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder="e.g. Confident with parallel parking, needs more work on hill starts"
            className="input"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline flex-1">
            Cancel
          </button>
          <button disabled={submitting} className="btn btn-primary flex-1">
            {submitting ? "Saving..." : "Mark completed"}
          </button>
        </div>
      </form>
    </div>
  );
}
