import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffAPI, adminAPI } from "../api/api";
import { Plus, Star, Clock, Scissors } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminStaff() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [hoursForm, setHoursForm] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ userId: "", specialization: "", bio: "" });

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: staffAPI.list,
  });
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: () => adminAPI.users({ role: "CUSTOMER", limit: 100 }),
  });
  const { data: perfData } = useQuery({
    queryKey: ["staff-performance"],
    queryFn: adminAPI.staffPerformance,
  });

  const staff = staffData?.data?.data || [];
  const users = usersData?.data?.data || [];
  const perf = perfData?.data?.data || [];

  const createStaffMutation = useMutation({
    mutationFn: (d) => staffAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setShowAdd(false); setAddForm({ userId: "", specialization: "", bio: "" }); },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, ...d }) => staffAPI.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-staff"] }),
  });

  const setHoursMutation = useMutation({
    mutationFn: ({ id, hours }) => staffAPI.setHours(id, hours),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setHoursForm(null); },
  });

  const openHours = (member) => {
    const hours = DAYS.map((_, i) => {
      const existing = member.workingHours?.find((wh) => wh.dayOfWeek === i);
      return existing || { dayOfWeek: i, startTime: "09:00", endTime: "18:00", isDayOff: i === 0 };
    });
    setHoursForm({ staffId: member.id, hours });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Staff</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{staff.length} team members</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {/* Staff grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="dash-card h-52 animate-pulse bg-slate-800/30" />
          ))
        ) : staff.map((member) => {
          const memberPerf = perf.find((p) => p.id === member.id);
          return (
            <div key={member.id} className="dash-card hover:border-amber-500/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelected(selected?.id === member.id ? null : member)}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  {member.user?.avatarUrl
                    ? <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                    : <span className="font-dash text-lg text-amber-400">{member.user?.name?.[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-dash text-sm font-medium text-slate-100 truncate">{member.user?.name}</h3>
                  <p className="font-dash text-xs text-amber-400 mt-0.5">{member.specialization || "Stylist"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {memberPerf?.avgRating && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-amber-300">
                        <Star size={9} fill="#F59E0B" stroke="none" /> {memberPerf.avgRating}
                      </span>
                    )}
                    <span className="font-dash text-[10px] text-slate-500">{memberPerf?.totalAppointments || 0} bookings</span>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.isAvailable ? "bg-emerald-400" : "bg-slate-600"}`} />
              </div>

              {memberPerf && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div>
                    <p className="font-dash text-[9px] text-slate-500 uppercase tracking-widest">Revenue</p>
                    <p className="font-mono text-xs text-slate-300 mt-0.5">₹{Number(memberPerf.revenue).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="font-dash text-[9px] text-slate-500 uppercase tracking-widest">Completed</p>
                    <p className="font-mono text-xs text-slate-300 mt-0.5">{memberPerf.completedAppointments}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                <button onClick={(e) => { e.stopPropagation(); openHours(member); }}
                  className="flex items-center gap-1.5 font-dash text-[10px] text-slate-400 hover:text-amber-400 transition-colors">
                  <Clock size={11} /> Hours
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStaffMutation.mutate({ id: member.id, isAvailable: !member.isAvailable }); }}
                  className={`flex items-center gap-1.5 font-dash text-[10px] transition-colors ${member.isAvailable ? "text-slate-400 hover:text-red-400" : "text-slate-400 hover:text-emerald-400"}`}>
                  {member.isAvailable ? "Set Unavailable" : "Set Available"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add staff modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-obsidian-200/90 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl w-full max-w-md p-8 animate-fade-up">
            <h2 className="font-dash text-lg font-medium text-slate-100 mb-6">Add Staff Member</h2>
            <div className="space-y-4">
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Select User</label>
                <select className="field-dark w-full" value={addForm.userId} onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}>
                  <option value="">Choose a user...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Specialization</label>
                <input className="field-dark w-full" placeholder="e.g. Hair Colouring Expert"
                  value={addForm.specialization} onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })} />
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Bio</label>
                <textarea className="field-dark w-full h-20 resize-none" placeholder="Short bio..."
                  value={addForm.bio} onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={() => createStaffMutation.mutate(addForm)} disabled={!addForm.userId || createStaffMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 hover:bg-amber-500/25 transition-all disabled:opacity-40">
                {createStaffMutation.isPending ? "Adding..." : "Add to Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Working hours modal */}
      {hoursForm && (
        <div className="fixed inset-0 z-50 bg-obsidian-200/90 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl w-full max-w-lg p-8 animate-fade-up">
            <h2 className="font-dash text-lg font-medium text-slate-100 mb-6">Working Hours</h2>
            <div className="space-y-3">
              {hoursForm.hours.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="font-dash text-xs text-slate-400 w-8 flex-shrink-0">{DAYS[i]}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={h.isDayOff} onChange={(e) => {
                      const updated = [...hoursForm.hours];
                      updated[i] = { ...updated[i], isDayOff: e.target.checked };
                      setHoursForm({ ...hoursForm, hours: updated });
                    }} className="accent-amber-500" />
                    <span className="font-dash text-[10px] text-slate-500">Off</span>
                  </label>
                  {!h.isDayOff && (
                    <>
                      <input type="time" value={h.startTime} className="field-dark text-xs py-1.5 px-2 flex-1"
                        onChange={(e) => { const u = [...hoursForm.hours]; u[i] = { ...u[i], startTime: e.target.value }; setHoursForm({ ...hoursForm, hours: u }); }} />
                      <span className="text-slate-600 text-xs">to</span>
                      <input type="time" value={h.endTime} className="field-dark text-xs py-1.5 px-2 flex-1"
                        onChange={(e) => { const u = [...hoursForm.hours]; u[i] = { ...u[i], endTime: e.target.value }; setHoursForm({ ...hoursForm, hours: u }); }} />
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setHoursForm(null)} className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
              <button onClick={() => setHoursMutation.mutate({ id: hoursForm.staffId, hours: hoursForm.hours })}
                disabled={setHoursMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 disabled:opacity-40">
                {setHoursMutation.isPending ? "Saving..." : "Save Hours"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}