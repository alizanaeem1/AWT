import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

const inputClass =
  "w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-400";

export default function SettingsPage() {
  const { user, refreshProfile, pushToast } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImagePath, setProfileImagePath] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileImageDataUrl, setProfileImageDataUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setProfileImagePath(user.profileImagePath || "");
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfileImage() {
      if (!profileImagePath) {
        setProfileImageDataUrl("");
        return;
      }
      const res = await desktopAPI.files.asDataUrl(profileImagePath);
      if (!cancelled) {
        setProfileImageDataUrl(res.ok ? res.data : "");
      }
    }
    loadProfileImage();
    return () => {
      cancelled = true;
    };
  }, [profileImagePath]);

  async function pickProfileImage() {
    const pickRes = await desktopAPI.files.pick();
    if (!pickRes.ok || !pickRes.data?.length) return;
    const pickedPath = pickRes.data[0];
    setProfileImagePath(pickedPath);

    // Persist profile image immediately so it remains after navigation/reload.
    const saveRes = await desktopAPI.auth.updateProfile({
      id: user.id,
      fullName: fullName.trim() || user.fullName,
      email: email.trim() || user.email,
      phone: phone.trim() || user.phone || null,
      profileImagePath: pickedPath
    });
    if (!saveRes.ok) {
      setError(saveRes.error || "Failed to save profile picture.");
      return;
    }
    await refreshProfile();
    pushToast({ title: "Profile picture saved", message: "Image updated successfully.", variant: "success" });
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    const res = await desktopAPI.auth.updateProfile({
      id: user.id,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      profileImagePath
    });
    if (!res.ok) {
      setError(res.error || "Failed to update profile.");
      return;
    }
    await refreshProfile();
    pushToast({ title: "Profile updated", message: "Your profile has been saved.", variant: "success" });
    setSuccessMessage("Saved successfully.");
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    const res = await desktopAPI.auth.changePassword({
      id: user.id,
      currentPassword,
      newPassword
    });
    if (!res.ok) {
      setError(res.error || "Failed to change password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    pushToast({ title: "Password changed", message: "Password updated successfully.", variant: "success" });
    setSuccessMessage("Password saved successfully.");
  }

  const initials = (fullName || user?.fullName || "U").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-3xl font-semibold text-white">My Profile</h2>
        <p className="mt-1 text-sm text-gray-400">Manage account overview and security settings.</p>
        {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
        {successMessage ? <p className="mt-2 text-sm text-emerald-400">{successMessage}</p> : null}
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#102c4a]/70 via-[#1a2e54]/70 to-[#2a2260]/70 p-4">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          {profileImageDataUrl ? (
            <img
              src={profileImageDataUrl}
              alt="Profile"
              className="h-28 w-28 rounded-full border-4 border-white/15 object-cover shadow-lg shadow-indigo-900/40"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/15 bg-gradient-to-br from-cyan-500 to-indigo-600 text-5xl font-bold text-white shadow-lg shadow-indigo-900/40">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Student Management Account</p>
            <h3 className="mt-1 text-4xl font-bold text-white">{fullName || user?.fullName}</h3>
            <p className="mt-1 text-2xl text-slate-300">{email || user?.email}</p>
            <p className="mt-2 text-sm text-slate-400">Account overview and security controls for your desktop workspace.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Profile</h3>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Name</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Email</label>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Phone Number</label>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92..." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Profile Picture</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pickProfileImage}
                className="rounded-lg bg-gray-700 px-3 py-2 text-xs text-gray-100 hover:bg-gray-600"
              >
                Add Pic
              </button>
              <p className="truncate text-xs text-gray-400">{profileImagePath || "No image selected"}</p>
            </div>
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500">Save Profile</button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Change Password</h3>
        <form onSubmit={savePassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Current Password</label>
            <input
              className={inputClass}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">New Password</label>
            <input className={inputClass} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Confirm Password</label>
            <input
              className={inputClass}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500">Change Password</button>
        </form>
      </section>
    </div>
  );
}
