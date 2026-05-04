// ══════════════════════════════ LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-forest-900 noise relative items-center justify-center overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-[#d97706]/10 blur-3xl animate-float" />
          <div className="relative text-center px-16">
            <div className="font-display text-6xl font-light text-cream-50 tracking-wider mb-2">Hairtown</div>
            <div className="font-body text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-10">Salon & Spa</div>
            <div className="w-12 h-px bg-[#d97706] mx-auto mb-8" />
            <p className="font-display text-xl italic text-cream-200/50 leading-relaxed">
              "Where elegance<br />meets artistry."
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-10">
              <h1 className="font-display text-4xl text-forest-800 mb-2">Welcome back</h1>
              <p className="font-body text-sm text-forest-400/60">Sign in to manage your appointments</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-forest-400/60 block mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field-light w-full" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-forest-400/60 block mb-2">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field-light w-full" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full text-center disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="font-body text-sm text-center text-forest-400/60 mt-8">
              New to Hairtown?{" "}
              <Link to="/register" className="text-gold-600 hover:text-gold-800 transition-colors">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;