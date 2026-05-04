import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, appointmentsAPI } from "../api/api";
import api from "../api/api";
import { format } from "date-fns";
import { Search, ChevronDown, Calendar, X } from "lucide-react";

const STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];
const STATUS_BADGE = {
  PENDING: "badge-pending", CONFIRMED: "badge-confirmed",
  COMPLETED: "badge-completed", CANCELLED: "badge-cancelled",
  IN_PROGRESS: "badge-confirmed", NO_SHOW: "badge-cancelled",
};
const NEXT_STATUS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
};

// Fix 2 — centered modal
function Modal({ children, onClose }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8,8,8,0.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", overflowY: "auto"
      }}>
      <div style={{ width: "100%", maxWidth: "440px", margin: "auto" }}>
        {children}
      </div>
    </div>
  );
}

export default function AdminAppointments() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: "", from: "", to: "", page: 1, limit: 20 });
  const [rescheduleAppt, setRescheduleAppt] = useState(null); // Fix 3
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", filters],
    queryFn: () => adminAPI.appointments(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""))),
    refetchInterval: 30000, // auto refresh every 30s — Fix 7
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => appointmentsAPI.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-appointments"] }),
    onError: e => alert(e.response?.data?.message || "Failed to update status"),
  });

  // Fix 3 — reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }) => api.patch(`/appointments/${id}/reschedule`, { scheduledAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      setRescheduleAppt(null);
      setNewDate(""); setNewTime(""); setRescheduleError("");
    },
    onError: e => setRescheduleError(e.response?.data?.message || "Reschedule failed"),
  });

  const handleReschedule = () => {
    if (!newDate || !newTime) { setRescheduleError("Please select both date and time."); return; }
    const scheduledAt = new Date(`${newDate}T${newTime}:00`).toISOString();
    rescheduleMutation.mutate({ id: rescheduleAppt.id, scheduledAt });
  };

  const openReschedule = (appt) => {
    const d = new Date(appt.scheduledAt);
    setNewDate(format(d, "yyyy-MM-dd"));
    setNewTime(format(d, "HH:mm"));
    setRescheduleError("");
    setRescheduleAppt(appt);
  };

  const appointments = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Appointments</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{meta.total || 0} total · auto-refreshes every 30s</p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["admin-appointments"] })}
          className="font-dash text-xs text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all">
          Refresh Now
        </button>
      </div>

      {/* Filters */}
      <div className="dash-card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Status</label>
          <div className="relative">
            <select className="field-dark w-full appearance-none pr-8"
              value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">From</label>
          <input type="date" className="field-dark w-full" value={filters.from}
            onChange={e => setFilters({ ...filters, from: e.target.value, page: 1 })} />
        </div>
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">To</label>
          <input type="date" className="field-dark w-full" value={filters.to}
            onChange={e => setFilters({ ...filters, to: e.target.value, page: 1 })} />
        </div>
        <button onClick={() => setFilters({ status: "", from: "", to: "", page: 1, limit: 20 })}
          className="font-dash text-xs text-slate-400 border border-slate-700 px-3 py-2 rounded-xl hover:border-slate-500 transition-colors">
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="dash-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-obsidian-100">
              <tr>
                {["Customer", "Service", "Stylist", "Date & Time", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-3 bg-slate-800 rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center font-dash text-sm text-slate-500">No appointments found</td></tr>
              ) : appointments.map(appt => (
                <tr key={appt.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-dash text-xs text-slate-200">{appt.user?.name}</div>
                    <div className="font-dash text-[10px] text-slate-500">{appt.user?.phone || appt.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 font-dash text-xs text-slate-300">{appt.service?.name}</td>
                  <td className="px-5 py-4 font-dash text-xs text-slate-300">{appt.staff?.user?.name}</td>
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-slate-300">{format(new Date(appt.scheduledAt), "dd MMM yy")}</div>
                    <div className="font-mono text-[10px] text-slate-500">{format(new Date(appt.scheduledAt), "h:mm a")}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-amber-400">
                    ₹{Number(appt.priceAtBooking).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <span className={STATUS_BADGE[appt.status] || "badge"}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      {/* Status transitions */}
                      {NEXT_STATUS[appt.status] && (
                        <div className="flex gap-1.5 flex-wrap">
                          {NEXT_STATUS[appt.status].map(s => (
                            <button key={s}
                              onClick={() => updateStatus.mutate({ id: appt.id, status: s })}
                              disabled={updateStatus.isPending}
                              className={`font-dash text-[10px] px-2 py-1 rounded-lg border transition-all disabled:opacity-40 ${s === "CANCELLED" || s === "NO_SHOW"
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                }`}>
                              {s.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Fix 3 — Reschedule button */}
                      {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appt.status) && (
                        <button onClick={() => openReschedule(appt)}
                          className="flex items-center gap-1 font-dash text-[10px] text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-500/30 px-2 py-1 rounded-lg transition-all w-fit">
                          <Calendar size={10} /> Reschedule
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <span className="font-dash text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">← Prev</button>
              <button disabled={filters.page >= meta.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Fix 3 — Reschedule Modal */}
      {rescheduleAppt && (
        <Modal onClose={() => setRescheduleAppt(null)}>
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-dash text-lg font-medium text-slate-100">Reschedule Appointment</h2>
                <p className="font-dash text-xs text-slate-500 mt-0.5">
                  {rescheduleAppt.user?.name} · {rescheduleAppt.service?.name}
                </p>
              </div>
              <button onClick={() => setRescheduleAppt(null)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-3 mb-5 font-dash text-xs text-slate-400">
              Current: <span className="text-slate-200 font-medium">
                {format(new Date(rescheduleAppt.scheduledAt), "EEEE, dd MMM yyyy · h:mm a")}
              </span>
            </div>

            {rescheduleError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 font-dash text-xs text-red-400">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">New Date</label>
                <input type="date" className="field-dark w-full"
                  value={newDate} min={format(new Date(), "yyyy-MM-dd")}
                  onChange={e => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">New Time</label>
                <input type="time" className="field-dark w-full"
                  value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRescheduleAppt(null)}
                className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5">Cancel</button>
              <button onClick={handleReschedule} disabled={rescheduleMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 disabled:opacity-40">
                {rescheduleMutation.isPending ? "Saving..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}