import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesAPI, categoriesAPI, staffAPI } from "../api/api";
import { Plus, Pencil, Trash2, Tag, X, Check } from "lucide-react";

const toSlug = str => str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const TABS = ["Services", "Categories", "Staff ↔ Services"];

// ── Compact Modal — no scroll, all content visible, light backdrop ──
function Modal({ children, onClose, title, subtitle, maxWidth = "480px" }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}>
      <div style={{
        width: "100%", maxWidth,
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


export default function AdminServices() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("Services");

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: "", categoryId: "", price: "", durationMins: "", description: "" });

  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", sortOrder: "0" });

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);

  const { data: svcsData, isLoading: svcsLoading } = useQuery({ queryKey: ["admin-services"], queryFn: () => servicesAPI.list({ limit: 100 }) });
  const { data: catsData, isLoading: catsLoading } = useQuery({ queryKey: ["categories"], queryFn: categoriesAPI.list });
  const { data: staffData } = useQuery({ queryKey: ["admin-staff-all"], queryFn: staffAPI.list });

  const services = svcsData?.data?.data || [];
  const categories = catsData?.data?.data || [];
  const staffList = staffData?.data?.data || [];

  const createSvcMutation = useMutation({
    mutationFn: d => { const fd = new FormData(); Object.entries(d).forEach(([k, v]) => { if (v !== "" && v != null) fd.append(k, v); }); return servicesAPI.create(fd); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setShowServiceForm(false); resetSvcForm(); },
    onError: e => alert(e.response?.data?.message || "Failed to create service"),
  });
  const updateSvcMutation = useMutation({
    mutationFn: ({ id, ...d }) => { const fd = new FormData(); Object.entries(d).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); }); return servicesAPI.update(id, fd); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setShowServiceForm(false); resetSvcForm(); },
    onError: e => alert(e.response?.data?.message || "Failed to update"),
  });
  const deleteSvcMutation = useMutation({
    mutationFn: servicesAPI.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  const resetSvcForm = () => { setServiceForm({ name: "", categoryId: "", price: "", durationMins: "", description: "" }); setEditService(null); };
  const openEditSvc = svc => { setServiceForm({ name: svc.name, categoryId: svc.categoryId, price: String(svc.price), durationMins: String(svc.durationMins), description: svc.description || "" }); setEditService(svc); setShowServiceForm(true); };
  const handleSvcSubmit = () => {
    if (!serviceForm.name || !serviceForm.categoryId || !serviceForm.price || !serviceForm.durationMins) { alert("All fields marked * are required."); return; }
    if (editService) updateSvcMutation.mutate({ id: editService.id, ...serviceForm });
    else createSvcMutation.mutate(serviceForm);
  };

  const createCatMutation = useMutation({
    mutationFn: categoriesAPI.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); qc.invalidateQueries({ queryKey: ["admin-services"] }); setShowCatForm(false); resetCatForm(); },
    onError: e => alert(e.response?.data?.message || "Failed to create category"),
  });
  const updateCatMutation = useMutation({
    mutationFn: ({ id, ...d }) => categoriesAPI.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setShowCatForm(false); resetCatForm(); },
    onError: e => alert(e.response?.data?.message || "Failed to update"),
  });
  const deleteCatMutation = useMutation({
    mutationFn: categoriesAPI.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); qc.invalidateQueries({ queryKey: ["admin-services"] }); },
  });

  const resetCatForm = () => { setCatForm({ name: "", slug: "", description: "", sortOrder: "0" }); setEditCat(null); };
  const openEditCat = cat => { setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: String(cat.sortOrder || 0) }); setEditCat(cat); setShowCatForm(true); };
  const handleCatSubmit = () => {
    if (!catForm.name || !catForm.slug) { alert("Name and slug are required."); return; }
    if (editCat) updateCatMutation.mutate({ id: editCat.id, ...catForm });
    else createCatMutation.mutate({ ...catForm, sortOrder: parseInt(catForm.sortOrder) || 0 });
  };

  const assignMutation = useMutation({
    mutationFn: ({ staffId, serviceIds }) => staffAPI.assignServices(staffId, serviceIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff-all"] }); alert("Services assigned!"); },
    onError: e => alert(e.response?.data?.message || "Assignment failed"),
  });

  const handleSelectStaff = member => { setSelectedStaff(member); setAssignedIds(member.services?.map(ss => ss.serviceId) || []); };
  const toggleSvc = id => setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Services</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{services.length} services · {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          {tab === "Services" && <button onClick={() => { resetSvcForm(); setShowServiceForm(true); }} className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all"><Plus size={14} />Add Service</button>}
          {tab === "Categories" && <button onClick={() => { resetCatForm(); setShowCatForm(true); }} className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all"><Plus size={14} />Add Category</button>}
        </div>
      </div>

      <div className="flex gap-0 border-b border-slate-800">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`font-dash text-xs tracking-widest uppercase px-5 py-3 border-b-2 transition-all ${tab === t ? "border-amber-500 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>{t}</button>)}
      </div>

      {tab === "Services" && (
        svcsLoading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="dash-card h-48 animate-pulse bg-slate-800/30" />)}</div>
          : services.length === 0 ? (
            <div className="dash-card text-center py-20">
              <p className="font-dash text-slate-500 mb-2">No services yet.</p>
              {categories.length === 0 ? <div><p className="font-dash text-xs text-amber-400/80 mb-4">⚠️ Create a category first.</p><button onClick={() => setTab("Categories")} className="font-dash text-xs text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl hover:bg-amber-500/10 transition-all">Go to Categories →</button></div>
                : <p className="font-dash text-xs text-slate-600">Click "Add Service" to get started.</p>}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <div key={svc.id} className="dash-card group">
                  {svc.imageUrl && <div className="h-32 -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl"><img src={svc.imageUrl} className="w-full h-full object-cover" alt="" /></div>}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0"><span className="font-dash text-[9px] tracking-widest uppercase text-amber-400 block">{svc.category?.name || "No category"}</span><h3 className="font-dash text-sm font-medium text-slate-100 mt-0.5 truncate">{svc.name}</h3></div>
                    <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditSvc(svc)} className="text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => { if (window.confirm("Deactivate this service?")) deleteSvcMutation.mutate(svc.id); }} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <p className="font-dash text-xs text-slate-500 line-clamp-2 mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="font-mono text-sm text-amber-400">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                    <span className="font-dash text-[10px] text-slate-500">{svc.durationMins} min</span>
                    <span className={`font-dash text-[10px] px-2 py-0.5 rounded-full ${svc.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{svc.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {tab === "Categories" && (
        catsLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="dash-card h-14 animate-pulse bg-slate-800/30" />)}</div>
          : <div className="dash-card overflow-hidden p-0">
            {categories.length === 0 ? (
              <div className="py-16 text-center"><Tag size={32} className="text-slate-700 mx-auto mb-3" /><p className="font-dash text-slate-500 mb-1">No categories yet</p><button onClick={() => { resetCatForm(); setShowCatForm(true); }} className="mt-4 font-dash text-xs text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl hover:bg-amber-500/10 transition-all inline-flex items-center gap-2"><Plus size={12} />Create First Category</button></div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-800 bg-obsidian-100"><tr>{["Name", "Slug", "Services", "Sort", "Status", "Actions"].map(h => <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 px-5 py-4">{h}</th>)}</tr></thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4 font-dash text-sm text-slate-200 font-medium">{cat.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{cat.slug}</td>
                      <td className="px-5 py-4 font-mono text-xs text-amber-400">{services.filter(s => s.categoryId === cat.id).length}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{cat.sortOrder || 0}</td>
                      <td className="px-5 py-4"><span className={`font-dash text-[10px] px-2 py-0.5 rounded-full ${cat.isActive !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{cat.isActive !== false ? "Active" : "Inactive"}</span></td>
                      <td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => openEditCat(cat)} className="text-slate-500 hover:text-amber-400 transition-colors"><Pencil size={13} /></button><button onClick={() => { if (window.confirm(`Deactivate "${cat.name}"?`)) deleteCatMutation.mutate(cat.id); }} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      )}

      {tab === "Staff ↔ Services" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="dash-card">
            <h3 className="font-dash text-sm font-medium text-slate-200 mb-4">Select Staff Member</h3>
            {staffList.length === 0 ? <p className="font-dash text-xs text-slate-500">No staff yet.</p> : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {staffList.map(member => (
                  <button key={member.id} onClick={() => handleSelectStaff(member)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedStaff?.id === member.id ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 hover:border-slate-700"}`}>
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm flex-shrink-0 overflow-hidden">
                      {member.user?.avatarUrl ? <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : member.user?.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0"><div className="font-dash text-xs text-slate-200 truncate">{member.user?.name}</div><div className="font-dash text-[10px] text-amber-400">{member.specialization || "Stylist"}</div></div>
                    <span className="font-dash text-[10px] text-slate-500 flex-shrink-0">{member.services?.length || 0} assigned</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dash-card">
            <h3 className="font-dash text-sm font-medium text-slate-200 mb-1">{selectedStaff ? `Assign to ${selectedStaff.user?.name}` : "Select a staff member first"}</h3>
            {selectedStaff && <p className="font-dash text-xs text-slate-500 mb-4">Check services this stylist can perform</p>}
            {!selectedStaff ? <div className="flex items-center justify-center h-48 text-slate-600"><p className="font-dash text-sm">← Pick a staff member</p></div>
              : services.length === 0 ? <p className="font-dash text-sm text-slate-500">No services yet.</p>
                : <>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1 mb-5">
                    {categories.map(cat => {
                      const catSvcs = services.filter(s => s.categoryId === cat.id);
                      if (!catSvcs.length) return null;
                      return <div key={cat.id}><div className="font-dash text-[9px] tracking-widest uppercase text-amber-400/60 px-1 py-2">{cat.name}</div>{catSvcs.map(svc => (
                        <label key={svc.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all mb-1 ${assignedIds.includes(svc.id) ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 hover:border-slate-700"}`}>
                          <div onClick={() => toggleSvc(svc.id)} className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${assignedIds.includes(svc.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>{assignedIds.includes(svc.id) && <Check size={11} className="text-white" />}</div>
                          <div className="flex-1 min-w-0"><div className="font-dash text-xs text-slate-200 truncate">{svc.name}</div><div className="font-dash text-[10px] text-slate-500">{svc.durationMins}min · ₹{Number(svc.price).toLocaleString("en-IN")}</div></div>
                        </label>
                      ))}</div>;
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <span className="font-dash text-xs text-slate-500">{assignedIds.length} selected</span>
                    <button onClick={() => assignMutation.mutate({ staffId: selectedStaff.id, serviceIds: assignedIds })} disabled={assignMutation.isPending} className="bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-5 py-2 rounded-xl hover:bg-amber-500/25 transition-all disabled:opacity-40">{assignMutation.isPending ? "Saving..." : "Save Assignment"}</button>
                  </div>
                </>
            }
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceForm && (
        <Modal title={editService ? "Edit Service" : "New Service"} subtitle={editService ? "Update service details" : "Fill in the details below"} onClose={() => { setShowServiceForm(false); resetSvcForm(); }}>
          {categories.length === 0 && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5 font-dash text-xs text-amber-400">⚠️ No categories yet. Go to the "Categories" tab first.</div>}
          <div className="space-y-3">
            <div><label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Service Name *</label><input type="text" className="field-dark w-full" placeholder="e.g. Deep Conditioning" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} /></div>
            <div><label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Category *</label><select className="field-dark w-full" value={serviceForm.categoryId} onChange={e => setServiceForm({ ...serviceForm, categoryId: e.target.value })}><option value="">Select a category...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Price (₹) *</label><input type="number" min="0" className="field-dark w-full" placeholder="1200" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
              <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Duration (min) *</label><input type="number" min="5" className="field-dark w-full" placeholder="60" value={serviceForm.durationMins} onChange={e => setServiceForm({ ...serviceForm, durationMins: e.target.value })} /></div>
            </div>
            <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Description</label><textarea className="field-dark w-full resize-none" rows={2} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowServiceForm(false); resetSvcForm(); }} className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-3">Cancel</button>
            <button onClick={handleSvcSubmit} disabled={createSvcMutation.isPending || updateSvcMutation.isPending || categories.length === 0} className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-3 disabled:opacity-40">{createSvcMutation.isPending || updateSvcMutation.isPending ? "Saving..." : editService ? "Update" : "Create"}</button>
          </div>
        </Modal>
      )}

      {/* CATEGORY MODAL */}
      {showCatForm && (
        <Modal title={editCat ? "Edit Category" : "New Category"} subtitle="Categories group your services together" onClose={() => { setShowCatForm(false); resetCatForm(); }}>
          <div className="space-y-3">
            <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Category Name *</label><input type="text" className="field-dark w-full" placeholder="e.g. Hair" value={catForm.name} onChange={e => { const name = e.target.value; setCatForm(f => ({ ...f, name, slug: editCat ? f.slug : toSlug(name) })); }} /></div>
            <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-1">Slug * <span className="text-slate-600 normal-case font-normal">(auto-generated)</span></label><input type="text" className="field-dark w-full font-mono" placeholder="hair" value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: toSlug(e.target.value) }))} /></div>
            <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Description</label><textarea className="field-dark w-full resize-none" rows={2} placeholder="Optional..." value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} /></div>
            <div><label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Sort Order</label><input type="number" min="0" className="field-dark w-full" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowCatForm(false); resetCatForm(); }} className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-3">Cancel</button>
            <button onClick={handleCatSubmit} disabled={createCatMutation.isPending || updateCatMutation.isPending} className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-3 disabled:opacity-40">{createCatMutation.isPending || updateCatMutation.isPending ? "Saving..." : editCat ? "Update" : "Create Category"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}