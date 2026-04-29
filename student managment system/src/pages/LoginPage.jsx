import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const { login, signup } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError("Password and confirm password must match.");
          return;
        }
        if (!acceptTerms) {
          setError("Please accept terms to create an account.");
          return;
        }
      }
      setSubmitting(true);
      if (isSignup) await signup(fullName, email, password);
      else await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060816] p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0b1022]/90 p-3 shadow-2xl shadow-indigo-900/20 lg:grid-cols-2">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0a1232] to-[#090f24] p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2 text-xl">🎓</div>
            <div>
              <p className="text-xl font-bold text-white">Student Admin</p>
              <p className="text-xs text-slate-400">Academic Control Center</p>
            </div>
          </div>
          <div className="mx-auto mb-8 flex h-44 w-full max-w-sm items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/5 text-7xl">
            {isSignup ? "📖" : "🎓"}
          </div>
          <h2 className="text-3xl font-bold text-white">
            {isSignup ? "Your Journey " : "Organize. Learn. "}
            <span className="text-indigo-400">{isSignup ? "Starts Here" : "Achieve."}</span>
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            {isSignup
              ? "Create an account and take control of your assignments, courses, files, and reminders."
              : "Manage your academic life in one beautiful dashboard with reminders and course tracking."}
          </p>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <p className="font-medium">✨ Your data is private and stored locally.</p>
            <p className="mt-1 text-slate-400">No third-party sharing. Full control on your desktop.</p>
          </div>
        </section>

        <section className="flex items-center">
          <form
            onSubmit={submit}
            className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0b132d]/80 p-5 shadow-xl shadow-indigo-900/20 sm:p-6"
          >
            <h1 className="text-3xl font-bold text-white">{isSignup ? "Create Account ✨" : "Welcome Back 👋"}</h1>
            <p className="mt-1 text-sm text-slate-400">{isSignup ? "Join us and start your journey" : "Login to continue your journey"}</p>

            <div className="mt-5 space-y-3">
              {isSignup ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-300">Full Name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-300">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-300">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "Create a password" : "Enter your password"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-11 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                    required
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              {isSignup ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-300">Confirm Password</span>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-11 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </label>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isSignup ? acceptTerms : rememberMe}
                  onChange={(e) => (isSignup ? setAcceptTerms(e.target.checked) : setRememberMe(e.target.checked))}
                  className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                />
                {isSignup ? (
                  <span>
                    I agree to <span className="text-indigo-300">Terms</span> and <span className="text-indigo-300">Privacy</span>
                  </span>
                ) : (
                  "Remember me"
                )}
              </label>
            </div>

            {error ? <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Please wait..." : isSignup ? "Sign Up →" : "Login →"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-400">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignup((v) => !v);
                  setError("");
                  setConfirmPassword("");
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                {isSignup ? "Login" : "Sign up"}
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.182 4.182L12 12" />
    </svg>
  );
}
