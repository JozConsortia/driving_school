import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../../api/client";
import { StatTile } from "../../components/StatTile";
import { CalendarIcon, CheckCircleIcon, XCircleIcon } from "../../components/icons";
import type { AvailabilitySlot, Booking } from "../../api/types";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-amber",
  CONFIRMED: "badge-blue",
  COMPLETED: "badge-green",
  CANCELLED: "badge-slate",
  REJECTED: "badge-red",
};

export function LearnerSchedule() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<Booking[]>("/bookings/mine").then((res) => setBookings(res.data));
  }

  useEffect(load, []);

  const upcoming = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status));

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this lesson?")) return;
    const reason = prompt("Reason for cancelling (optional):") ?? undefined;
    try {
      await api.put(`/bookings/${id}/status`, { status: "CANCELLED", reason });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function startReschedule(booking: Booking) {
    setRescheduling(booking);
    setError(null);
    const instructorId = booking.instructor?.id;
    if (instructorId) {
      const res = await api.get<AvailabilitySlot[]>(`/availability/instructor/${instructorId}`);
      setSlots(res.data);
    }
  }

  async function confirmReschedule(slot: AvailabilitySlot) {
    if (!rescheduling) return;
    try {
      await api.put(`/bookings/${rescheduling.id}/reschedule`, {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      setRescheduling(null);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="page-shell mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold text-slate-900">My schedule</h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile icon={<CalendarIcon className="h-5 w-5" />} value={upcoming.length} label="Upcoming" color="blue" />
        <StatTile icon={<CheckCircleIcon className="h-5 w-5" />} value={completed.length} label="Completed" color="emerald" />
        <StatTile icon={<XCircleIcon className="h-5 w-5" />} value={cancelled.length} label="Cancelled" color="rose" />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-8 space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {new Date(b.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
                  {b.startTime}-{b.endTime}
                </p>
                <p className="text-sm text-slate-500">
                  {b.school?.name} · Instructor: {b.instructor?.user.name} · {b.licenceCategory?.code}
                </p>
                {b.vehicle && (
                  <p className="text-sm text-slate-500">
                    Vehicle: {b.vehicle.make} {b.vehicle.model}
                  </p>
                )}
                {b.lessonRecord && (
                  <p className="mt-1 text-sm text-slate-600">
                    Progress notes: {b.lessonRecord.notes || "—"} ({b.lessonRecord.attendance})
                  </p>
                )}
                {b.cancellationReason && (
                  <p className="mt-1 text-sm text-slate-500">Reason: {b.cancellationReason}</p>
                )}
              </div>
              <span className={`badge ${STATUS_BADGE[b.status]} shrink-0`}>{b.status}</span>
            </div>
            {["PENDING", "CONFIRMED"].includes(b.status) && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => startReschedule(b)} className="btn btn-outline btn-sm">
                  Reschedule
                </button>
                <button onClick={() => cancelBooking(b.id)} className="btn btn-danger btn-sm">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="card p-8 text-center text-slate-500">No bookings yet. Go find a driving school!</div>
        )}
      </div>

      {rescheduling && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-5">
            <h2 className="section-title">Reschedule lesson</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => confirmReschedule(slot)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-violet-400 hover:bg-violet-50"
                >
                  {new Date(slot.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {slot.startTime}
                </button>
              ))}
              {slots.length === 0 && <p className="text-sm text-slate-400">No open slots available.</p>}
            </div>
            <button onClick={() => setRescheduling(null)} className="btn btn-outline btn-sm mt-4">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
