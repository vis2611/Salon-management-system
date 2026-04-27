import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponsAPI } from "../api/api";
import { Plus, Tag } from "lucide-react";
import { format } from "date-fns";

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "" });

  const { data } = useQuery({ queryKey: ["admin-coupons"], queryFn: couponsAPI.list });
  const coupons = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d) => couponsAPI.create(Object.fromEntries(Object.entries(d).filter(([, v]) => v !== ""))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); setShowForm(false); setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => couponsAPI.create({ id, isActive }), // using patch endpoint
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div><h1 className="font-dash text-2xl font-semibold text-slate-100">Coupons</h1>
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
            <tr>{["Code", "Discount", "Min Order", "Uses", "Expires", "Status"].map((h) => (
              <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 px-5 py-4">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-amber-400" />
                    <span className="font-mono text-sm text-amber-300">{c.code}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-slate-200">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{c.minOrderAmount ? `₹${c.minOrderAmount}` : "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">
                  {c.usedCount} / {c.maxUses || "∞"}
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
        {coupons.length === 0 && (
          <div className="py-16 text-center"><p className="font-dash text-slate-500">No coupons yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-obsidian-200/90 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl w-full max-w-md p-8 animate-fade-up">
            <h2 className="font-dash text-lg font-medium text-slate-100 mb-6">Create Coupon</h2>
            <div className="space-y-4">
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Code</label>
                <input className="field-dark w-full uppercase" placeholder="SUMMER20"
                  value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Type</label>
                  <select className="field-dark w-full" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">
                    Value {form.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                  </label>
                  <input type="number" className="field-dark w-full" placeholder="20"
                    value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Min Order (₹)</label>
                  <input type="number" className="field-dark w-full" placeholder="500"
                    value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
                </div>
                <div>
                  <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Max Uses</label>
                  <input type="number" className="field-dark w-full" placeholder="100"
                    value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Expires On</label>
                <input type="date" className="field-dark w-full"
                  value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.code || !form.discountValue || createMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 disabled:opacity-40">
                {createMutation.isPending ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}