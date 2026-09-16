import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { CarIcon, LocationIcon, UsersIcon } from "../../components/icons";
import { StarRating } from "../../components/StarRating";
import type { LicenceCategory, SchoolSearchResult } from "../../api/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CARD_IMAGES = ["/images/card-1.jpg", "/images/card-2.jpg", "/images/card-3.jpg", "/images/card-4.jpg"];

export function SearchSchools() {
  const [categories, setCategories] = useState<LicenceCategory[]>([]);
  const [city, setCity] = useState("");
  const [licenceCategory, setLicenceCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [day, setDay] = useState("");
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<LicenceCategory[]>("/licence-categories").then((res) => setCategories(res.data));
  }, []);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (city) params.city = city;
      if (licenceCategory) params.licenceCategory = licenceCategory;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.minRating = minRating;
      if (day) params.day = day;
      const res = await api.get<SchoolSearchResult[]>("/schools", { params });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-shell mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Find a driving school</h1>
      <p className="mt-1 text-sm text-slate-500">Search by location, price, licence category and availability.</p>

      <form onSubmit={runSearch} className="card mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="field-label">Location</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pretoria" className="input" />
        </div>
        <div>
          <label className="field-label">Licence category</label>
          <select value={licenceCategory} onChange={(e) => setLicenceCategory(e.target.value)} className="input">
            <option value="">Any</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Max price / hour</label>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="e.g. 300" className="input" />
        </div>
        <div>
          <label className="field-label">Min rating</label>
          <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input">
            <option value="">Any</option>
            {[4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}+ stars
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Available on</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="input">
            <option value="">Any day</option>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>
      </form>

      <div className="mt-8">
        {loading && <p className="text-slate-500">Searching...</p>}
        {!loading && results.length === 0 && (
          <div className="card p-8 text-center text-slate-500">No driving schools match your search.</div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((school, i) => (
            <Link
              key={school.id}
              to={`/schools/${school.id}`}
              className="card block overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <img src={CARD_IMAGES[i % CARD_IMAGES.length]} alt="" className="aspect-video w-full object-cover" />
              <div className="p-5">
                <h2 className="font-display font-bold text-slate-900">{school.name}</h2>
                <StarRating rating={school.avgRating} count={school.reviewCount} size="sm" className="mt-1" />
                <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                  <LocationIcon className="h-3.5 w-3.5" />
                  {school.city}
                </p>
                {school.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{school.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {school.services.map((s) => (
                    <span key={s.licenceCategory} className="badge badge-violet">
                      {s.licenceCategory}: R{s.pricePerHour}/hr
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {school.instructorCount} instructor(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <CarIcon className="h-3.5 w-3.5" />
                    {school.vehicleTypes.join(", ") || "No vehicles listed"}
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
