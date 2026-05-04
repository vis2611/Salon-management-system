import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffAPI, adminAPI } from "../api/api";
import api from "../api/api";
import { Plus, Star, Clock, Search, Pencil, X, Camera, Check } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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


export default function AdminStaff() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [hoursStaff, setHoursStaff] = useState(null);
  const [hoursForm, setHoursForm] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [addForm, setAddForm] = useState({ userId: "", specialization: "", bio: "", experienceYears: "" });
  const [editForm, setEditForm] = useState({ specialization: "", bio: "", experienceYears: 0, isAvailable: true });

  const { data: staffData, isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: staffAPI.list });
  const { data: usersData } = useQuery({ queryKey: ["admin-users-all"], queryFn: () => adminAPI.users({ limit: 200 }) });
  const { data: perfData } = useQuery({ queryKey: ["staff-performance"], queryFn: adminAPI.staffPerformance });

  const staffList = staffData?.data?.data || [];
  const users = usersData?.data?.data || [];
  const perf = perfData?.data?.data || [];

  const filtered = staffList.filter(m =>
    !search ||
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const createStaffMutation = useMutation({
    mutationFn: d => staffAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setShowAdd(false);
      setAddForm({ userId: "", specialization: "", bio: "", experienceYears: "" });
    },
    onError: e => alert(e.response?.data?.message || "Failed to add staff"),
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, ...d }) => staffAPI.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setEditStaff(null); },
    onError: e => alert(e.response?.data?.message || "Update failed"),
  });

  const avatarMutation = useMutation({
    mutationFn: async ({ file }) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return api.post("/users/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setUploadingFor(null); },
    onError: e => { alert(e.response?.data?.message || "Upload failed"); setUploadingFor(null); },
  });

  const setHoursMutation = useMutation({
    mutationFn: ({ id, hours }) => staffAPI.setHours(id, hours),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setHoursStaff(null); setHoursForm(null);
    },
    onError: e => alert(e.response?.data?.message || "Failed to save hours"),
  });

  const toggleAvailMutation = useMutation({
    mutationFn: ({ id, isAvailable }) => staffAPI.update(id, { isAvailable }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-staff"] }),
  });

  const openEdit = member => {
    setEditForm({ specialization: member.specialization || "", bio: member.bio || "", experienceYears: member.experienceYears || 0, isAvailable: member.isAvailable });
    setEditStaff(member);
  };

  const openHours = member => {
    const hours = DAYS.map((_, i) => {
      const ex = member.workingHours?.find(wh => wh.dayOfWeek === i);
      return ex || { dayOfWeek: i, startTime: "09:00", endTime: "18:00", isDayOff: i === 0 };
    });
    setHoursForm({ staffId: member.id, hours });
    setHoursStaff(member);
  };

  const handleAvatarFile = (e, member) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFor(member.id);
    avatarMutation.mutate({ file });
    e.target.value = "";
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Staff</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{staffList.length} team members</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search by name, email..." value={search}
              onChange={e => setSearch(e.target.value)} className="field-dark pl-9 w-56" />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="dash-card h-56 animate-pulse bg-slate-800/30" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-card text-center py-16">
          <p className="font-dash text-slate-500">{search ? `No staff matching "${search}"` : "No staff yet."}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => {
            const mp = perf.find(p => p.id === member.id);
            return (
              <div key={member.id} className="dash-card hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-500/10 flex items-center justify-center border border-slate-700">
                      {member.user?.avatarUrl
                        ? <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt={member.user?.name} />
                        : <span className="font-dash text-xl text-amber-400">{member.user?.name?.[0]}</span>
                      }
                    </div>
                    <label htmlFor={`avatar-${member.id}`} title="Upload photo"
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors">
                      {uploadingFor === member.id
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={10} className="text-black" />
                      }
                    </label>
                    <input id={`avatar-${member.id}`} type="file" accept="image/*" className="hidden"
                      onChange={e => handleAvatarFile(e, member)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-dash text-sm font-medium text-slate-100 truncate">{member.user?.name}</h3>
                    <p className="font-dash text-xs text-amber-400 mt-0.5">{member.specialization || "Stylist"}</p>
                    <p className="font-dash text-[10px] text-slate-600 truncate">{member.user?.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {mp?.avgRating && <span className="flex items-center gap-1 font-mono text-[10px] text-amber-300"><Star size={9} fill="#F59E0B" stroke="none" />{mp.avgRating}</span>}
                      <span className="font-dash text-[10px] text-slate-500">{mp?.totalAppointments || 0} bookings</span>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${member.isAvailable ? "bg-emerald-400" : "bg-slate-600"}`} />
                </div>
                {mp && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 mb-4">
                    <div className="text-center">
                      <p className="font-dash text-[9px] text-slate-500 uppercase tracking-widest">Revenue</p>
                      <p className="font-mono text-xs text-slate-300 mt-0.5">₹{Number(mp.revenue).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-dash text-[9px] text-slate-500 uppercase tracking-widest">Done</p>
                      <p className="font-mono text-xs text-slate-300 mt-0.5">{mp.completedAppointments}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-dash text-[9px] text-slate-500 uppercase tracking-widest">Exp</p>
                      <p className="font-mono text-xs text-slate-300 mt-0.5">{member.experienceYears}y</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-800">
                  <button onClick={() => openEdit(member)}
                    className="flex items-center gap-1.5 font-dash text-[10px] text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => openHours(member)}
                    className="flex items-center gap-1.5 font-dash text-[10px] text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-lg hover:text-amber-400 hover:border-amber-500/30 transition-all">
                    <Clock size={11} /> Hours
                  </button>
                  <button onClick={() => toggleAvailMutation.mutate({ id: member.id, isAvailable: !member.isAvailable })}
                    className={`flex items-center gap-1.5 font-dash text-[10px] border px-2.5 py-1.5 rounded-lg transition-all ${member.isAvailable ? "text-slate-400 border-slate-700 hover:text-red-400" : "text-emerald-400 border-emerald-500/30"}`}>
                    {member.isAvailable ? "Set Off" : "Set Available"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ADD STAFF MODAL ══ */}
      {showAdd && (
        <Modal title="Add Staff Member" subtitle="Select a registered user to promote to staff" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Select User *</label>
              <select className="field-dark w-full" value={addForm.userId} onChange={e => setAddForm({ ...addForm, userId: e.target.value })}>
                <option value="">Choose a registered user...</option>
                {users.filter(u => u.role === "CUSTOMER").map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
              <p className="font-dash text-[10px] text-slate-600 mt-1.5">Only CUSTOMER accounts are shown. The selected user's role will be upgraded to STAFF.</p>
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Specialization</label>
              <input className="field-dark w-full" placeholder="e.g. Hair Colouring Expert"
                value={addForm.specialization} onChange={e => setAddForm({ ...addForm, specialization: e.target.value })} />
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Experience (years)</label>
              <input type="number" min="0" max="50" className="field-dark w-full" placeholder="5"
                value={addForm.experienceYears} onChange={e => setAddForm({ ...addForm, experienceYears: e.target.value })} />
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Bio</label>
              <textarea className="field-dark w-full resize-none" rows={2} placeholder="Short professional bio..."
                value={addForm.bio} onChange={e => setAddForm({ ...addForm, bio: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-2.5 hover:border-slate-500 transition-colors">
                Cancel
              </button>
              <button onClick={() => createStaffMutation.mutate(addForm)}
                disabled={!addForm.userId || createStaffMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-2.5 hover:bg-amber-500/25 transition-all disabled:opacity-40">
                {createStaffMutation.isPending ? "Adding..." : "Add to Team"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ EDIT STAFF MODAL ══ */}
      {editStaff && (
        <Modal
          title={`Edit — ${editStaff.user?.name}`}
          subtitle={editStaff.user?.email}
          onClose={() => setEditStaff(null)}>
          <div className="space-y-3">
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Specialization</label>
              <input className="field-dark w-full" value={editForm.specialization}
                onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} />
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Experience (years)</label>
              <input type="number" min="0" className="field-dark w-full" value={editForm.experienceYears}
                onChange={e => setEditForm({ ...editForm, experienceYears: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="font-dash text-[10px] tracking-widests uppercase text-slate-500 block mb-2">Bio</label>
              <textarea className="field-dark w-full resize-none" rows={2} value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl">
              <div>
                <p className="font-dash text-sm text-slate-200">Available for bookings</p>
                <p className="font-dash text-[10px] text-slate-500 mt-0.5">Customers can book this stylist when enabled</p>
              </div>
              <button onClick={() => setEditForm({ ...editForm, isAvailable: !editForm.isAvailable })}
                className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${editForm.isAvailable ? "bg-emerald-500" : "bg-slate-700"}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${editForm.isAvailable ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditStaff(null)}
                className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
              <button onClick={() => updateStaffMutation.mutate({ id: editStaff.id, ...editForm })}
                disabled={updateStaffMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-2.5 disabled:opacity-40">
                {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ WORKING HOURS MODAL ══ */}
      {hoursStaff && hoursForm && (
        <Modal
          title="Working Hours"
          subtitle={hoursStaff.user?.name}
          onClose={() => { setHoursStaff(null); setHoursForm(null); }}>
          <div className="space-y-2 mb-6">
            {hoursForm.hours.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                <span className="font-dash text-xs text-slate-300 w-9 flex-shrink-0 font-medium">{DAYS[i]}</span>
                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={h.isDayOff} className="accent-amber-500 w-3.5 h-3.5"
                    onChange={e => { const u = [...hoursForm.hours]; u[i] = { ...u[i], isDayOff: e.target.checked }; setHoursForm({ ...hoursForm, hours: u }); }} />
                  <span className="font-dash text-[10px] text-slate-500">Off</span>
                </label>
                {!h.isDayOff ? (
                  <>
                    <input type="time" value={h.startTime} className="field-dark text-xs py-1.5 px-2 flex-1"
                      onChange={e => { const u = [...hoursForm.hours]; u[i] = { ...u[i], startTime: e.target.value }; setHoursForm({ ...hoursForm, hours: u }); }} />
                    <span className="text-slate-600 text-xs flex-shrink-0">to</span>
                    <input type="time" value={h.endTime} className="field-dark text-xs py-1.5 px-2 flex-1"
                      onChange={e => { const u = [...hoursForm.hours]; u[i] = { ...u[i], endTime: e.target.value }; setHoursForm({ ...hoursForm, hours: u }); }} />
                  </>
                ) : (
                  <span className="flex-1 font-dash text-[10px] text-slate-600 italic">Day off — no bookings</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setHoursStaff(null); setHoursForm(null); }}
              className="flex-1 font-dash text-sm text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
            <button onClick={() => setHoursMutation.mutate({ id: hoursForm.staffId, hours: hoursForm.hours })}
              disabled={setHoursMutation.isPending}
              className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-sm rounded-xl py-2.5 disabled:opacity-40">
              {setHoursMutation.isPending ? "Saving..." : "Save Hours"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}