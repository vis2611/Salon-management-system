// ══════════ RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl text-forest-800 mb-2">Join Hairtown</h1>
            <p className="font-body text-sm text-forest-400/60">Create your account and book your first appointment</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            {[["Full Name", "text", "name", "Priya Sharma"], ["Email", "email", "email", "you@example.com"], ["Phone", "tel", "phone", "+91 98765 43210"], ["Password", "password", "password", "Min 8 chars, 1 uppercase, 1 number"]].map(([label, type, field, ph]) => (
              <div key={field}>
                <label className="font-body text-[10px] tracking-widest uppercase text-forest-400/60 block mb-2">{label}</label>
                <input type={type} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="field-light w-full" placeholder={ph} required={field !== "phone"} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-gold w-full text-center disabled:opacity-60">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <p className="font-body text-sm text-center text-forest-400/60 mt-8">
            Already have an account? <Link to="/login" className="text-gold-600 hover:text-gold-800">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;