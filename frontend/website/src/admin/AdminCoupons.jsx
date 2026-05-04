import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponsAPI } from "../api/api";
import { Plus, Tag, X } from "lucide-react";
import { format } from "date-fns";

// ── Compact Modal — no scroll, all content visible, light backdrop ──
function Modal({ children, onClose, title, subtitle, maxWidth = "480px" }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0px",
      }}>
      <div style={{
        width: "100%", maxWidth,
        margin: "auto",
        background: "#1A1D26",
        border: "1px solid rgba(245,163,24,0.18)",
        borderRadius: "16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
      }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "22px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div>
            {title && <h2 className="font-dash font-semibold text-slate-100" style={{ fontSize: "16px", margin: 0 }}>{title}</h2>}
            {subtitle && <p className="font-dash text-slate-500" style={{ fontSize: "12px", marginTop: "3px" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px", flexShrink: 0, marginLeft: "12px" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}


export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", discountType: "PERCENTAGE", discountValue: "",
    minOrderAmount: "", maxUses: "", expiresAt: ""
  });

  const { data } = useQuery({ queryKey: ["admin-coupons"], queryFn: couponsAPI.list });
  const coupons = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: d => couponsAPI.create(Object.fromEntries(Object.entries(d).filter(([, v]) => v !== ""))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowForm(false);
      setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
    },
    onError: e => alert(e.response?.data?.message || "Failed to create coupon"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => couponsAPI.create({ id, isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Coupons</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{coupons.length} coupons</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
          <Plus size={14} /> New Coupon
        </button>
      </div>

      <div className="dash-card overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-obsidian-100">
            <tr>{["Code", "Discount", "Min Order", "Uses", "Expires", "Status"].map(h => (
              <th key={h} className="text-left font-dash text-[10px] tracking-widests uppercase text-slate-500 px-5 py-4">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center font-dash text-sm text-slate-500">No coupons yet. Create your first one!</td></tr>
            ) : coupons.map(c => (
              <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-amber-400" />
                    <span className="font-mono text-sm text-amber-300 font-medium">{c.code}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-slate-200">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{c.minOrderAmount ? `₹${c.minOrderAmount}` : "—"}</td>
                <td className="px-5 py-4">
                  <span className="font-mono text-xs text-slate-400">{c.usedCount}</span>
                  <span className="font-mono text-xs text-slate-600"> / {c.maxUses || "∞"}</span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">
                  {c.expiresAt ? format(new Date(c.expiresAt), "dd MMM yy") : "Never"}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge ${c.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/50 text-slate-500"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal — full screen, no cutoff */}
      {showForm && (
        <Modal
          title="Create Coupon"
          subtitle="Set up a discount code for your customers"
          onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div>
              <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Coupon Code *</label>
              <input className="field-dark w-full font-mono uppercase tracking-widest" placeholder="e.g. SUMMER20"
                value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              <p className="font-dash text-[10px] text-slate-600 mt-1.5">Must be unique. Customers will type this at checkout.</p>
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Discount Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {["PERCENTAGE", "FLAT"].map(type => (
                  <button key={type} onClick={() => setForm({ ...form, discountType: type })}
                    className={`p-3 rounded-xl border font-dash text-xs transition-all ${form.discountType === type ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                    {type === "PERCENTAGE" ? "% Percentage" : "₹ Flat Amount"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">
                  Value {form.discountType === "PERCENTAGE" ? "(%)" : "(₹)"} *
                </label>
                <input type="number" className="field-dark w-full" placeholder={form.discountType === "PERCENTAGE" ? "20" : "200"}
                  value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} />
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Min Order (₹)</label>
                <input type="number" className="field-dark w-full" placeholder="500"
                  value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Max Uses</label>
                <input type="number" className="field-dark w-full" placeholder="100 (leave blank for unlimited)"
                  value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Expires On</label>
                <input type="date" className="field-dark w-full" value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowForm(false)} className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-3">Cancel</button>
            <button onClick={() => createMutation.mutate(form)}
              disabled={!form.code || !form.discountValue || createMutation.isPending}
              className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-3 disabled:opacity-40">
              {createMutation.isPending ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}