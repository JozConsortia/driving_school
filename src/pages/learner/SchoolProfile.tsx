import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { CarIcon, LocationIcon, MailIcon, PhoneIcon, UserIcon } from "../../components/icons";
import { StarRating } from "../../components/StarRating";
import type { AvailabilitySlot, SchoolProfile as SchoolProfileType } from "../../api/types";

export function SchoolProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [school, setSchool] = useState<SchoolProfileType | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [licenceCategoryCode, setLicenceCategoryCode] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SchoolProfileType>(`/schools/${id}`).then((res) => {
      setSchool(res.data);
      if (res.data.services[0]) setLicenceCategoryCode(res.data.services[0].licenceCategory.code);
    });
  }, [id]);

  useEffect(() => {
    if (!selectedInstructor) {
      setSlots([]);
      return;
    }
    api.get<AvailabilitySlot[]>(`/availability/instructor/${selectedInstructor}`).then((res) => setSlots(res.data));
  }, [selectedInstructor]);

  async function submitBooking() {
    if (!school || !selectedSlot || !licenceCategoryCode) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    setBookingError(null);
    try {
      await api.post("/bookings", {
        instructorId: selectedSlot.instructorId,
        schoolId: school.id,
        vehicleId: vehicleId || undefined,
        licenceCategoryCode,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setBookingSuccess(true);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setSelectedSlot(null);
    } catch (err) {
      setBookingError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!school) return;
    setReviewMessage(null);
    try {
      await api.post("/reviews", { schoolId: school.id, rating: reviewRating, comment: reviewComment });
      setReviewMessage("Thanks for your review!");
      setReviewComment("");
      const res = await api.get<SchoolProfileType>(`/schools/${id}`);
      setSchool(res.data);
    } catch (err) {
      setReviewMessage(getApiErrorMessage(err));
    }
  }

  function startEditReview(r: SchoolProfileType["reviews"][number]) {
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment ?? "");
    setReviewActionError(null);
  }

  async function saveEditReview(reviewId: string) {
    setReviewActionError(null);
    try {
      await api.put(`/reviews/${reviewId}`, { rating: editRating, comment: editComment });
      setEditingReviewId(null);
      const res = await api.get<SchoolProfileType>(`/schools/${id}`);
      setSchool(res.data);
    } catch (err) {
      setReviewActionError(getApiErrorMessage(err));
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Delete this review?")) return;
    setReviewActionError(null);
    try {
      await api.delete(`/reviews/${reviewId}`);
      const res = await api.get<SchoolProfileType>(`/schools/${id}`);
      setSchool(res.data);
    } catch (err) {
      setReviewActionError(getApiErrorMessage(err));
    }
  }

  if (!school) return <div className="px-4 py-16 text-center text-slate-500">Loading...</div>;

  return (
    <div className="page-shell mx-auto max-w-5xl">
      <Link to="/search" className="text-sm font-medium text-violet-600 hover:text-violet-700">
        ← Back to search
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl">
        <img src="/images/profile-banner.jpg" alt="" className="aspect-[21/9] w-full object-cover sm:aspect-[3/1]" />
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{school.name}</h1>
          <p className="flex items-center gap-1.5 text-slate-500">
            <LocationIcon className="h-4 w-4 shrink-0" />
            {school.city}
            {school.address ? ` · ${school.address}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {school.phone && (
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="h-3.5 w-3.5 text-violet-500" />
                {school.phone}
              </span>
            )}
            {school.email && (
              <span className="flex items-center gap-1.5">
                <MailIcon className="h-3.5 w-3.5 text-violet-500" />
                {school.email}
              </span>
            )}
          </div>
        </div>
        <StarRating rating={school.avgRating} count={school.reviews.length} size="md" />
      </div>

      {school.description && <p className="mt-4 text-slate-700">{school.description}</p>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="section-title">Prices &amp; licence categories</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
            {school.services.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>
                  {s.licenceCategory.code} ({s.licenceCategory.name})
                </span>
                <span className="font-semibold text-slate-900">R{s.pricePerHour}/hour</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="section-title">Vehicles</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {school.vehicles.map((v) => (
              <li key={v.id} className="flex items-center gap-2">
                <CarIcon className="h-4 w-4 shrink-0 text-violet-500" />
                {v.make} {v.model} {v.year ?? ""} — {v.transmission}
              </li>
            ))}
            {school.vehicles.length === 0 && <li className="text-slate-400">No vehicles listed</li>}
          </ul>
        </div>
      </div>

      <div className="card mt-5 p-5">
        <h2 className="section-title">Instructors</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {school.instructors.map((instr) => (
            <button
              key={instr.id}
              onClick={() => {
                setSelectedInstructor(instr.id);
                setSelectedSlot(null);
                setBookingSuccess(false);
                setBookingError(null);
              }}
              className={`rounded-xl border p-3.5 text-left text-sm transition ${
                selectedInstructor === instr.id
                  ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                  : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <UserIcon className="h-4 w-4" />
                </span>
                <p className="font-semibold text-slate-900">{instr.user.name}</p>
              </div>
              {instr.bio && <p className="mt-1.5 text-slate-500">{instr.bio}</p>}
            </button>
          ))}
          {school.instructors.length === 0 && <p className="text-slate-400">No instructors listed yet</p>}
        </div>
      </div>

      {selectedInstructor && (
        <div className="card mt-5 p-5">
          <h2 className="section-title">Book a lesson</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Licence category</label>
              <select value={licenceCategoryCode} onChange={(e) => setLicenceCategoryCode(e.target.value)} className="input">
                {school.services.map((s) => (
                  <option key={s.id} value={s.licenceCategory.code}>
                    {s.licenceCategory.code} — R{s.pricePerHour}/hr
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Vehicle (optional)</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="input">
                <option value="">No preference</option>
                {school.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.transmission})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-700">Available times</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  selectedSlot?.id === slot.id
                    ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                    : "border-slate-300 text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                {new Date(slot.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
                {slot.startTime}-{slot.endTime}
              </button>
            ))}
            {slots.length === 0 && <p className="text-sm text-slate-400">No open slots for this instructor right now.</p>}
          </div>

          {bookingError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{bookingError}</p>}
          {bookingSuccess && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Booking requested! Check your schedule for status updates.
            </p>
          )}

          <button onClick={submitBooking} disabled={!selectedSlot || submitting} className="btn btn-primary mt-4">
            {submitting ? "Booking..." : user ? "Book this lesson" : "Log in to book"}
          </button>
        </div>
      )}

      <div className="card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Reviews</h2>
          <StarRating rating={school.avgRating} count={school.reviews.length} size="sm" />
        </div>
        {reviewActionError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{reviewActionError}</p>}
        <div className="mt-3 space-y-3">
          {school.reviews.map((r) =>
            editingReviewId === r.id ? (
              <div key={r.id} className="border-b border-slate-100 pb-3 last:border-0">
                <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="input w-auto">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="input mt-2" rows={2} />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => saveEditReview(r.id)} className="btn btn-primary btn-sm">
                    Save
                  </button>
                  <button onClick={() => setEditingReviewId(null)} className="btn btn-outline btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={r.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{r.user.name}</p>
                    <StarRating rating={r.rating} showValue={false} size="sm" />
                  </div>
                  {user?.id === r.userId && (
                    <div className="flex shrink-0 gap-2 text-xs font-medium">
                      <button onClick={() => startEditReview(r)} className="text-violet-600 hover:text-violet-700">
                        Edit
                      </button>
                      <button onClick={() => deleteReview(r.id)} className="text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {r.comment && <p className="mt-0.5 text-sm text-slate-600">{r.comment}</p>}
              </div>
            )
          )}
          {school.reviews.length === 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
              No reviews yet — be the first to share your experience!
            </p>
          )}
        </div>

        {user?.role === "LEARNER" && (
          <form onSubmit={submitReview} className="mt-4 border-t border-slate-100 pt-4">
            <label className="field-label">Your rating</label>
            <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="input w-auto">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              className="input mt-2"
              rows={2}
            />
            {reviewMessage && <p className="mt-1.5 text-sm text-slate-600">{reviewMessage}</p>}
            <button type="submit" className="btn btn-secondary btn-sm mt-2">
              Submit review
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
