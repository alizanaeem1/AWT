import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Request failed. Please make sure backend server is running.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth">
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={submit}>
        {isRegister && (
          <input
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
        </button>
      </form>
      <div className="auth-switch-wrap">
        <button type="button" className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>
      </div>
    </section>
  );
}

export default AuthPage;
