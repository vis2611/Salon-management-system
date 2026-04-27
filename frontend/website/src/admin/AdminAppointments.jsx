import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, appointmentsAPI } from "../api/api";
import { format } from "date-fns";
import { Search, Filter, ChevronDown } from "lucide-react";

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

export default function AdminAppointments() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: "", from: "", to: "", page: 1, limit: 20 });
  const [actionAppt, setActionAppt] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", filters],
    queryFn: () => adminAPI.appointments(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""))),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => appointmentsAPI.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-appointments"] }); setActionAppt(null); },
  });

  const appointments = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Appointments</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{meta.total || 0} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Status</label>
          <div className="relative">
            <select className="field-dark w-full appearance-none pr-8"
              value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">From Date</label>
          <input type="date" className="field-dark w-full" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })} />
        </div>
        <div className="flex-1 min-w-40">
          <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">To Date</label>
          <input type="date" className="field-dark w-full" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })} />
        </div>
        <button onClick={() => setFilters({ status: "", from: "", to: "", page: 1, limit: 20 })}
          className="font-dash text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 border border-slate-700 rounded-xl">
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="dash-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-obsidian-100">
              <tr>
                {["Customer", "Service", "Stylist", "Date & Time", "Amount", "Payment", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : appointments.map((appt) => (
                <tr key={appt.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-dash text-xs text-slate-200">{appt.user?.name}</div>
                    <div className="font-dash text-[10px] text-slate-500">{appt.user?.phone}</div>
                  </td>
                  <td className="px-5 py-4 font-dash text-xs text-slate-300">{appt.service?.name}</td>
                  <td className="px-5 py-4 font-dash text-xs text-slate-300">{appt.staff?.user?.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(appt.scheduledAt), "dd MMM yy")}<br />
                    <span className="text-slate-500">{format(new Date(appt.scheduledAt), "h:mm a")}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-amber-400">
                    ₹{Number(appt.priceAtBooking).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-[10px] ${appt.payment?.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/50 text-slate-400"}`}>
                      {appt.payment?.status || "UNPAID"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={STATUS_BADGE[appt.status] || "badge"}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {NEXT_STATUS[appt.status] && (
                      <div className="flex gap-1.5">
                        {NEXT_STATUS[appt.status].map((s) => (
                          <button key={s}
                            onClick={() => updateStatus.mutate({ id: appt.id, status: s })}
                            disabled={updateStatus.isPending}
                            className={`font-dash text-[10px] tracking-wide px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 ${
                              s === "CANCELLED" || s === "NO_SHOW"
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            }`}>
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <span className="font-dash text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} records
            </span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">
                ← Prev
              </button>
              <button disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}