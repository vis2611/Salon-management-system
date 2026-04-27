// ══════════════════════════════ AdminServices.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesAPI } from "../api/api";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function AdminServices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", categoryId: "", price: "", durationMins: "", description: "" });

  const { data: svcs } = useQuery({ queryKey: ["admin-services"], queryFn: () => servicesAPI.list({ limit: 100 }) });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: servicesAPI.categories });

  const services = svcs?.data?.data || [];
  const categories = cats?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d) => { const fd = new FormData(); Object.entries(d).forEach(([k, v]) => v && fd.append(k, v)); return servicesAPI.create(fd); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => { const fd = new FormData(); Object.entries(d).forEach(([k, v]) => v !== undefined && fd.append(k, v)); return servicesAPI.update(id, fd); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  const resetForm = () => { setForm({ name: "", categoryId: "", price: "", durationMins: "", description: "" }); setEditItem(null); };

  const openEdit = (svc) => {
    setForm({ name: svc.name, categoryId: svc.categoryId, price: svc.price, durationMins: svc.durationMins, description: svc.description || "" });
    setEditItem(svc);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editItem) updateMutation.mutate({ id: editItem.id, ...form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div><h1 className="font-dash text-2xl font-semibold text-slate-100">Services</h1><p className="font-dash text-sm text-slate-500 mt-0.5">{services.length} services</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
          <Plus size={14} /> Add Service
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className="dash-card">
            {svc.imageUrl && <div className="h-32 -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl"><img src={svc.imageUrl} className="w-full h-full object-cover" alt="" /></div>}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-dash text-[9px] tracking-widest uppercase text-amber-400">{svc.category?.name}</span>
                <h3 className="font-dash text-sm font-medium text-slate-100 mt-0.5">{svc.name}</h3>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(svc)} className="text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => { if (confirm("Deactivate this service?")) deleteMutation.mutate(svc.id); }}
                  className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="font-dash text-xs text-slate-500 line-clamp-2 mb-4">{svc.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="font-mono text-sm text-amber-400">₹{Number(svc.price).toLocaleString("en-IN")}</span>
              <span className="font-dash text-[10px] text-slate-500">{svc.durationMins} min</span>
              <span className={`font-dash text-[10px] px-2 py-0.5 rounded-full ${svc.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {svc.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-obsidian-200/90 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl w-full max-w-lg p-8 animate-fade-up">
            <h2 className="font-dash text-lg font-medium text-slate-100 mb-6">{editItem ? "Edit Service" : "New Service"}</h2>
            <div className="space-y-4">
              {[["Service Name", "text", "name", "e.g. Deep Conditioning"], ["Price (₹)", "number", "price", "0"], ["Duration (minutes)", "number", "durationMins", "60"]].map(([label, type, field, ph]) => (
                <div key={field}>
                  <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">{label}</label>
                  <input type={type} className="field-dark w-full" placeholder={ph}
                    value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Category</label>
                <select className="field-dark w-full" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Description</label>
                <textarea className="field-dark w-full h-20 resize-none" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 disabled:opacity-40">
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminServices;