import { useEffect, useState, type FormEvent } from "react";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { UserIcon } from "../components/icons";
import type { UserProfile } from "../api/types";

const ROLE_LABEL: Record<string, string> = {
  LEARNER: "Learner",
  INSTRUCTOR: "Instructor",
  SCHOOL_ADMIN: "School Admin",
  SYSTEM_ADMIN: "System Admin",
};

export function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserProfile>("/auth/me").then((res) => {
      setProfile(res.data);
      setName(res.data.name);
      setPhone(res.data.phone ?? "");
    });
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      const res = await api.put<UserProfile>("/auth/me", { name, phone });
      setProfile(res.data);
      await refreshUser();
      setProfileMessage("Profile updated!");
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await api.put("/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password changed!");
    } catch (err) {
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  if (!profile) return <div className="px-4 py-16 text-center text-slate-500">Loading...</div>;

  return (
    <div className="page-shell mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <UserIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My profile</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABEL[profile.role] ?? profile.role} · Member since{" "}
            {new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="card mt-6 space-y-4 p-6">
        <h2 className="section-title">Account details</h2>
        <div>
          <label className="field-label">Email</label>
          <input value={profile.email} disabled className="input bg-slate-50 text-slate-500" />
        </div>
        <div>
          <label className="field-label">Full name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>
        {profileError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p>}
        {profileMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{profileMessage}</p>}
        <button type="submit" disabled={savingProfile} className="btn btn-primary">
          {savingProfile ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form onSubmit={savePassword} className="card mt-5 space-y-4 p-6">
        <h2 className="section-title">Change password</h2>
        <div>
          <label className="field-label">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
          />
        </div>
        {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
        {passwordMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</p>}
        <button type="submit" disabled={savingPassword} className="btn btn-secondary">
          {savingPassword ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
