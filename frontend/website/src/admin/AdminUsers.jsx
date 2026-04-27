import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../api/api";
import api from "../api/api";
import { format } from "date-fns";
import { Search, UserCheck, UserX } from "lucide-react";

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role, page],
    queryFn: () => adminAPI.users({ search: search || undefined, role: role || undefined, page, limit: 20 }),
  });

  const users = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/users/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-dash text-2xl font-semibold text-slate-100">Users</h1>
        <p className="font-dash text-sm text-slate-500 mt-0.5">{meta.total || 0} registered users</p>
      </div>

      {/* Filters */}
      <div className="dash-card flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field-dark w-full pl-9" placeholder="Search by name or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="field-dark" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="dash-card overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-obsidian-100">
            <tr>{["User", "Phone", "Role", "Bookings", "Joined", "Status", "Action"].map((h) => (
              <th key={h} className="text-left font-dash text-[10px] tracking-widest uppercase text-slate-500 px-5 py-4">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-slate-800/60">
                  {[...Array(7)].map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 bg-slate-800 rounded animate-pulse w-20" /></td>
                  ))}
                </tr>
              ))
            ) : users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs flex-shrink-0 overflow-hidden">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : user.name?.[0]}
                    </div>
                    <div>
                      <div className="font-dash text-xs text-slate-200">{user.name}</div>
                      <div className="font-dash text-[10px] text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{user.phone || "—"}</td>
                <td className="px-5 py-4">
                  <span className={`badge text-[10px] ${
                    user.role === "ADMIN" ? "bg-amber-500/10 text-amber-400"
                    : user.role === "STAFF" ? "bg-purple-500/10 text-purple-400"
                    : "bg-slate-700/50 text-slate-400"
                  }`}>{user.role}</span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-400">{user._count?.appointments || 0}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">
                  {user.createdAt ? format(new Date(user.createdAt), "dd MMM yy") : "—"}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge text-[10px] ${user.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                    disabled={toggleStatusMutation.isPending}
                    className={`flex items-center gap-1.5 font-dash text-[10px] transition-colors disabled:opacity-40 ${user.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}`}>
                    {user.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <span className="font-dash text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">← Prev</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}
                className="font-dash text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg disabled:opacity-30 hover:border-amber-500/40 transition-all">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}