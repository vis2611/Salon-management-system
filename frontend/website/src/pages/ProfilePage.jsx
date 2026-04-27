import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsAPI, notificationsAPI } from "../api/api";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { User, Calendar, Bell, Camera, Star } from "lucide-react";

const STATUS_BADGE = {
  PENDING:     "badge-pending",
  CONFIRMED:   "badge-confirmed",
  COMPLETED:   "badge-completed",
  CANCELLED:   "badge-cancelled",
  IN_PROGRESS: "badge-confirmed",
  NO_SHOW:     "badge-cancelled",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("appointments");
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const fileRef = useRef();

  const { data: appts } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => appointmentsAPI.list({ limit: 50 }),
  });

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsAPI.list,
  });

  const appointments = appts?.data?.data || [];
  const notifications = notifs?.data?.data || [];
  const unread = notifs?.data?.meta?.unreadCount || 0;

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentsAPI.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (d) => api.put("/users/profile", d),
    onSuccess: () => { setEditMode(false); qc.invalidateQueries({ queryKey: ["auth-me"] }); },
  });

  const avatarMutation = useMutation({
    mutationFn: (formData) => api.post("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });

  const reviewMutation = useMutation({
    mutationFn: (d) => api.post("/reviews", d),
    onSuccess: () => { setReviewModal(null); qc.invalidateQueries({ queryKey: ["my-appointments"] }); },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    avatarMutation.mutate(fd);
  };

  const TABS = [
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "notifications", label: `Notifications${unread > 0 ? ` (${unread})` : ""}`, icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Profile hero */}
      <div className="bg-forest-900 noise relative overflow-hidden pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6 flex items-end gap-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-cream-200 overflow-hidden border-2 border-gold-600">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} />
                : <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-4xl text-forest-400">{user?.name?.[0]}</span>
                  </div>
              }
            </div>
            <button onClick={() => fileRef.current.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#d97706] rounded-full flex items-center justify-center hover:bg-gold-400 transition-colors">
              <Camera size={13} className="text-cream-50" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="pb-1">
            <h1 className="font-display text-3xl text-cream-50">{user?.name}</h1>
            <p className="font-body text-xs tracking-widest uppercase text-gold-400 mt-1">{user?.email}</p>
            <span className={`mt-3 inline-block font-body text-[10px] tracking-widest uppercase px-3 py-1 ${user?.role === "ADMIN" ? "bg-[#d97706] text-cream-50" : "bg-forest-700 text-cream-200/60"}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-forest-100/30 bg-cream-50/95 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-6 flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-6 py-4 font-body text-xs tracking-widest uppercase border-b-2 transition-all ${tab === id ? "border-gold-600 text-gold-600" : "border-transparent text-forest-400/60 hover:text-forest-800"}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">

        {/* ── Appointments Tab ── */}
        {tab === "appointments" && (
          <div className="animate-fade-up space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-20">
                <Calendar size={40} className="text-forest-400/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-forest-400/40 italic">No appointments yet</p>
                <a href="/book" className="btn-gold inline-block mt-6">Book Your First Visit</a>
              </div>
            ) : appointments.map((appt) => (
              <div key={appt.id} className="bg-cream-50 border border-forest-100/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gold-400/30 transition-colors">
                <div className="flex gap-5 items-start">
                  <div className="text-center bg-cream-200 px-4 py-3 flex-shrink-0">
                    <div className="font-body text-[10px] tracking-widest uppercase text-forest-400/60">
                      {format(new Date(appt.scheduledAt), "MMM")}
                    </div>
                    <div className="font-display text-3xl text-forest-800">
                      {format(new Date(appt.scheduledAt), "d")}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-forest-800">{appt.service?.name}</h3>
                    <p className="font-body text-xs text-forest-400/60 mt-0.5">
                      with {appt.staff?.user?.name} · {format(new Date(appt.scheduledAt), "h:mm a")}
                    </p>
                    <p className="font-display text-sm text-gold-600 mt-1">₹{Number(appt.priceAtBooking).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={STATUS_BADGE[appt.status] || "badge"}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> {appt.status}
                  </span>
                  {appt.status === "COMPLETED" && !appt.review && (
                    <button onClick={() => setReviewModal(appt)}
                      className="font-body text-xs tracking-widest uppercase text-gold-600 border border-gold-600/40 px-3 py-1.5 hover:bg-[#d97706] hover:text-cream-50 transition-all">
                      Review
                    </button>
                  )}
                  {["PENDING", "CONFIRMED"].includes(appt.status) && (
                    <button onClick={() => cancelMutation.mutate(appt.id)}
                      disabled={cancelMutation.isPending}
                      className="font-body text-xs tracking-widest uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-all disabled:opacity-40">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {tab === "notifications" && (
          <div className="animate-fade-up space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-20">
                <Bell size={40} className="text-forest-400/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-forest-400/40 italic">All caught up</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`p-5 border transition-colors cursor-pointer ${n.isRead ? "bg-cream-50 border-forest-100/30" : "bg-gold-100/20 border-gold-400/30"}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-body text-sm font-medium text-forest-800">{n.title}</p>
                    <p className="font-body text-xs text-forest-400/70 mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />}
                    <span className="font-body text-[10px] text-forest-400/40">{format(new Date(n.createdAt), "dd MMM")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <div className="animate-fade-up max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-3xl text-forest-800">My Details</h2>
              <button onClick={() => setEditMode(!editMode)}
                className={editMode ? "btn-gold py-2 px-5 text-xs" : "btn-ghost py-2 px-5 text-xs"}>
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>
            {editMode ? (
              <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-5">
                <div>
                  <label className="font-body text-[10px] tracking-widest uppercase text-forest-400/60 block mb-2">Full Name</label>
                  <input className="field-light w-full" value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="font-body text-[10px] tracking-widest uppercase text-forest-400/60 block mb-2">Phone</label>
                  <input className="field-light w-full" value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <button type="submit" className="btn-gold w-full" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {[["Name", user?.name], ["Email", user?.email], ["Phone", user?.phone || "Not set"], ["Member since", user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : ""]].map(([label, val]) => (
                  <div key={label} className="border-b border-forest-100/30 pb-5">
                    <span className="font-body text-[10px] tracking-widest uppercase text-forest-400/40">{label}</span>
                    <p className="font-body text-sm text-forest-800 mt-1">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-forest-900/80 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-cream-50 w-full max-w-md p-8 animate-fade-up">
            <h3 className="font-display text-2xl text-forest-800 mb-2">Leave a Review</h3>
            <p className="font-body text-sm text-forest-400/60 mb-6">{reviewModal.service?.name} with {reviewModal.staff?.user?.name}</p>
            <div className="flex gap-2 mb-5">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                  <Star size={24} fill={s <= reviewForm.rating ? "#C9A84C" : "none"} stroke="#C9A84C" />
                </button>
              ))}
            </div>
            <textarea className="field-light w-full h-28 resize-none mb-5"
              placeholder="Share your experience..."
              value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => reviewMutation.mutate({ appointmentId: reviewModal.id, ...reviewForm })}
                disabled={reviewMutation.isPending} className="btn-gold flex-1">
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}