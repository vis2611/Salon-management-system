import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "../api/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, Calendar, TrendingUp, Clock, Star, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE = {
  PENDING:     "badge-pending",
  CONFIRMED:   "badge-confirmed",
  COMPLETED:   "badge-completed",
  CANCELLED:   "badge-cancelled",
  IN_PROGRESS: "badge-confirmed",
  NO_SHOW:     "badge-cancelled",
};

export default function AdminDashboard() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminAPI.dashboard,
    refetchInterval: 60_000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => adminAPI.revenue({ year: new Date().getFullYear(), months: 12 }),
  });

  const { data: perfData } = useQuery({
    queryKey: ["staff-performance"],
    queryFn: adminAPI.staffPerformance,
  });

  const stats = dash?.data?.data?.stats || {};
  const recentAppointments = dash?.data?.data?.recentAppointments || [];
  const topServices = dash?.data?.data?.topServices || [];
  const revenue = revenueData?.data?.data || [];
  const performance = perfData?.data?.data || [];

  const STAT_CARDS = [
    { label: "Total Customers", value: stats.totalCustomers?.toLocaleString() || "—", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", change: "+12% this month" },
    { label: "Today's Bookings", value: stats.todayAppointments?.toString() || "—", icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", change: `${stats.pendingAppointments || 0} pending` },
    { label: "Month Revenue", value: stats.monthRevenue ? `₹${Number(stats.monthRevenue).toLocaleString("en-IN")}` : "—", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", change: "This month" },
    { label: "Active Staff", value: stats.totalStaff?.toString() || "—", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10", change: "Available today" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-obsidian-50 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="font-dash text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-mono text-sm text-amber-400">
            {p.name === "revenue" ? `₹${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Dashboard</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-dash text-xs text-amber-400">Live data</span>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, change }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <ArrowUpRight size={14} className="text-slate-600" />
            </div>
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse mb-2" />
            ) : (
              <div className="font-mono text-2xl font-medium text-slate-100 mb-1">{value}</div>
            )}
            <div className="font-dash text-xs text-slate-500">{label}</div>
            <div className="font-dash text-[10px] text-slate-600 mt-1">{change}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Top Services ─────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Revenue area chart */}
        <div className="lg:col-span-2 dash-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-dash text-sm font-medium text-slate-200">Revenue Overview</h2>
              <p className="font-dash text-xs text-slate-500 mt-0.5">{new Date().getFullYear()} — Monthly</p>
            </div>
            <div className="font-mono text-lg text-amber-400">
              {stats.totalRevenue ? `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}` : "—"}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11, fontFamily: "Sora" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2}
                fill="url(#revenueGrad)" dot={{ fill: "#F59E0B", r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top services */}
        <div className="dash-card">
          <h2 className="font-dash text-sm font-medium text-slate-200 mb-5">Top Services</h2>
          <div className="space-y-4">
            {topServices.map((svc, i) => {
              const max = topServices[0]?._count?.appointments || 1;
              const pct = Math.round((svc._count?.appointments / max) * 100);
              return (
                <div key={svc.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-dash text-xs text-slate-300 truncate max-w-[130px]">{svc.name}</span>
                    <span className="font-mono text-xs text-amber-400 flex-shrink-0">{svc._count?.appointments}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Appointments + Staff Performance ─────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent appointments table */}
        <div className="lg:col-span-2 dash-card overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-dash text-sm font-medium text-slate-200">Recent Appointments</h2>
            <a href="/admin/appointments" className="font-dash text-xs text-amber-400 hover:text-amber-300 transition-colors">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Customer", "Service", "Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="dash-row">
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="py-3 pr-4">
                          <div className="h-3 bg-slate-800 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentAppointments.map((appt) => (
                  <tr key={appt.id} className="dash-row">
                    <td className="py-3 pr-4">
                      <div className="font-dash text-xs text-slate-200">{appt.user?.name}</div>
                      <div className="font-dash text-[10px] text-slate-500">{appt.user?.email}</div>
                    </td>
                    <td className="py-3 pr-4 font-dash text-xs text-slate-300">{appt.service?.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400">
                      {format(new Date(appt.scheduledAt), "dd MMM, h:mm a")}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-amber-400">
                      ₹{Number(appt.priceAtBooking).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <span className={STATUS_BADGE[appt.status] || "badge"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff performance */}
        <div className="dash-card">
          <h2 className="font-dash text-sm font-medium text-slate-200 mb-5">Staff Performance</h2>
          <div className="space-y-4">
            {performance.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs font-medium flex-shrink-0 overflow-hidden">
                  {member.avatarUrl
                    ? <img src={member.avatarUrl} className="w-full h-full object-cover" alt="" />
                    : member.name?.[0]
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-dash text-xs text-slate-200 truncate">{member.name}</span>
                    {member.avgRating && (
                      <span className="font-mono text-[10px] text-amber-400 flex items-center gap-0.5 flex-shrink-0">
                        <Star size={9} fill="#F59E0B" stroke="none" /> {member.avgRating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-dash text-[10px] text-slate-500">{member.completedAppointments} done</span>
                    <span className="font-mono text-[10px] text-slate-400">₹{Number(member.revenue).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Appointments bar chart */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="font-dash text-[10px] text-slate-500 mb-3 tracking-widest uppercase">Bookings / Month</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={revenue.slice(-6)}>
                <Bar dataKey="appointments" fill="#F59E0B" opacity={0.7} radius={[3, 3, 0, 0]} />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}