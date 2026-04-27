import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notificationsAPI } from "../api/api";
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Image, Tag, UserCog, Bell, LogOut, Menu, X, ChevronRight
} from "lucide-react";

const NAV = [
  { to: "/admin",             label: "Dashboard",    icon: LayoutDashboard, end: true },
  { to: "/admin/appointments",label: "Appointments", icon: Calendar },
  { to: "/admin/staff",       label: "Staff",        icon: UserCog },
  { to: "/admin/services",    label: "Services",     icon: Scissors },
  { to: "/admin/photos",      label: "Gallery",      icon: Image },
  { to: "/admin/coupons",     label: "Coupons",      icon: Tag },
  { to: "/admin/users",       label: "Users",        icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set dashboard body class
  useEffect(() => {
    document.body.classList.add("dashboard");
    return () => document.body.classList.remove("dashboard");
  }, []);

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsAPI.list,
    refetchInterval: 30_000,
  });
  const unread = notifs?.data?.meta?.unreadCount || 0;

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-obsidian-200 font-dash flex">

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-obsidian-100 border-r border-slate-800 flex flex-col transition-all duration-300 relative z-20`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen && (
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-light text-cream-50 tracking-wider">Lumière</span>
              <span className="font-body text-[8px] tracking-[0.3em] uppercase text-amber-500">Admin Panel</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-200 transition-colors ml-auto">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={16} className={`flex-shrink-0 ${isActive ? "text-amber-400" : ""}`} />
                  {sidebarOpen && (
                    <span className="font-dash text-xs font-medium tracking-wide">{label}</span>
                  )}
                  {isActive && sidebarOpen && (
                    <ChevronRight size={12} className="ml-auto text-amber-400/60" />
                  )}
                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-700 text-slate-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="border-t border-slate-800 p-3 space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-medium flex-shrink-0">
                {user?.name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="font-dash text-xs text-slate-200 truncate">{user?.name}</p>
                <p className="font-dash text-[10px] text-slate-500 truncate">Administrator</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs">
            <LogOut size={14} className="flex-shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 bg-obsidian-100 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="font-dash text-sm text-slate-400">
            <span className="text-slate-600">Panel</span>
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-slate-300">Overview</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button onClick={() => navigate("/admin")} className="relative text-slate-400 hover:text-slate-200 transition-colors">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-dash text-obsidian-200 flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <div className="w-px h-5 bg-slate-800" />
            <div className="font-dash text-xs text-slate-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}