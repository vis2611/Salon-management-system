import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsAPI, notificationsAPI, reviewsAPI } from "../api/api";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { User, Calendar, Bell, Star, MessageSquare, Camera, Trash2, Upload, X } from "lucide-react";

const STATUS_BADGE = {
  PENDING: "badge-pending", CONFIRMED: "badge-confirmed",
  COMPLETED: "badge-completed", CANCELLED: "badge-cancelled",
  IN_PROGRESS: "badge-confirmed", NO_SHOW: "badge-cancelled",
};

// ── Photo options menu — fixed position so it never goes off screen ──
function AvatarMenu({ onUpload, onRemove, onClose, hasPhoto, anchorRef }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <div style={{
        background: "#1C2433",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "14px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        minWidth: "220px", overflow: "hidden",
        animation: "fadeIn 0.15s ease",
      }}>
        <div style={{ padding: "12px 16px 8px" }}>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(201,168,76,0.7)", marginBottom: "4px" }}>
            Profile Photo
          </p>
        </div>
        <button onClick={onUpload}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            width: "100%", padding: "12px 16px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "DM Sans,sans-serif", fontSize: "14px",
            color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <Upload size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
          {hasPhoto ? "Change Photo" : "Upload Photo"}
        </button>
        {hasPhoto && (
          <button onClick={onRemove}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              width: "100%", padding: "12px 16px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "DM Sans,sans-serif", fontSize: "14px",
              color: "#f87171", borderBottom: "1px solid rgba(255,255,255,0.06)",
              textAlign: "left",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <Trash2 size={15} style={{ flexShrink: 0 }} />
            Remove Photo
          </button>
        )}
        <button onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            width: "100%", padding: "11px 16px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "DM Sans,sans-serif", fontSize: "13px",
            color: "rgba(148,163,184,0.5)",
            textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <X size={13} style={{ flexShrink: 0 }} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("appointments");
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileRef = useRef();

  const { data: appts } = useQuery({ queryKey: ["my-appointments"], queryFn: () => appointmentsAPI.list({ limit: 50 }) });
  const { data: notifs } = useQuery({ queryKey: ["notifications"], queryFn: notificationsAPI.list });
  const { data: myReviews } = useQuery({ queryKey: ["my-reviews"], queryFn: () => reviewsAPI.list({ limit: 50 }) });

  const appointments = appts?.data?.data || [];
  const notifications = notifs?.data?.data || [];
  const unread = notifs?.data?.meta?.unreadCount || 0;
  const reviews = myReviews?.data?.data || [];
  const myWrittenReviews = reviews.filter(r => r.userId === user?.id);

  const cancelMutation = useMutation({
    mutationFn: id => appointmentsAPI.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: d => api.put("/users/profile", d),
    onSuccess: () => { setEditMode(false); },
    onError: e => alert(e.response?.data?.message || "Update failed"),
  });

  // Upload avatar
  const avatarMutation = useMutation({
    mutationFn: fd => api.post("/users/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      setShowAvatarMenu(false);
      window.location.reload(); // reload so Navbar also picks up new avatar
    },
    onError: e => alert(e.response?.data?.message || "Upload failed"),
  });

  // Issue 3 — Remove avatar (set to null)
  const removeAvatarMutation = useMutation({
    mutationFn: () => api.put("/users/profile", { avatarUrl: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      setShowAvatarMenu(false);
      window.location.reload();
    },
    onError: e => alert(e.response?.data?.message || "Could not remove photo"),
  });

  const reviewMutation = useMutation({
    mutationFn: d => api.post("/reviews", d),
    onSuccess: () => {
      setReviewModal(null);
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: e => alert(e.response?.data?.message || "Review failed"),
  });

  const markReadMutation = useMutation({
    mutationFn: id => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    avatarMutation.mutate(fd);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (window.confirm("Remove your profile photo? You can always upload a new one later.")) {
      removeAvatarMutation.mutate();
    }
  };

  const TABS = [
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "reviews", label: `My Reviews (${myWrittenReviews.length})`, icon: Star },
    { id: "notifications", label: `Notifications${unread > 0 ? ` (${unread})` : ""}`, icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Profile hero */}
      <div className="bg-forest-900 noise relative overflow-hidden pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6 flex items-end gap-8">

          {/* Avatar with menu — Issue 3 fix */}
          <div className="relative flex-shrink-0" style={{ zIndex: 40 }}>
            <div className="w-24 h-24 rounded-full bg-cream-200 overflow-hidden border-2 border-gold-600">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} />
                : <div className="w-full h-full flex items-center justify-center bg-forest-800">
                  <span className="font-display text-4xl text-gold-400">{user?.name?.[0]}</span>
                </div>
              }
              {/* Uploading spinner overlay */}
              {(avatarMutation.isPending || removeAvatarMutation.isPending) && (
                <div className="absolute inset-0 bg-forest-900/70 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Camera button — opens menu */}
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              title="Change or remove photo"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center hover:bg-gold-400 transition-colors border-2 border-forest-900">
              <Camera size={13} className="text-forest-900" />
            </button>

            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

            {/* Issue 3 — Avatar options menu (change / remove) */}
            {showAvatarMenu && (
              <AvatarMenu
                hasPhoto={!!user?.avatarUrl}
                onUpload={() => { setShowAvatarMenu(false); fileRef.current?.click(); }}
                onRemove={() => { setShowAvatarMenu(false); handleRemovePhoto(); }}
                onClose={() => setShowAvatarMenu(false)}
              />
            )}
          </div>

          {/* User info */}
          <div className="pb-1">
            <h1 className="font-display text-3xl text-cream-50">{user?.name}</h1>
            <p className="font-body text-xs tracking-widest uppercase text-gold-400 mt-1">{user?.email}</p>
            <span className={`mt-3 inline-block font-body text-[10px] tracking-widests uppercase px-3 py-1 ${user?.role === "ADMIN" ? "bg-gold-600 text-cream-50" : "bg-forest-700 text-cream-200/60"}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Avatar menu handles its own click-outside via overlay */}

      {/* Tabs */}
      <div className="border-b border-forest-100/30 bg-cream-50/95 backdrop-blur-md sticky top-20 z-20">
        <div className="max-w-5xl mx-auto px-6 flex gap-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-4 font-body text-xs tracking-widests uppercase border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${tab === id ? "border-gold-600 text-gold-600" : "border-transparent text-forest-400/60 hover:text-forest-800"}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">

        {/* ── Appointments ── */}
        {tab === "appointments" && (
          <div className="animate-fade-up space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-20">
                <Calendar size={40} className="text-forest-400/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-forest-400/40 italic">No appointments yet</p>
                <a href="/book" className="btn-gold inline-block mt-6">Book Your First Visit</a>
              </div>
            ) : appointments.map(appt => (
              <div key={appt.id} className="bg-cream-50 border border-forest-100/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gold-400/30 transition-colors">
                <div className="flex gap-5 items-start">
                  <div className="text-center bg-cream-200 px-4 py-3 flex-shrink-0 min-w-[60px]">
                    <div className="font-body text-[10px] tracking-widests uppercase text-forest-400/60">{format(new Date(appt.scheduledAt), "MMM")}</div>
                    <div className="font-display text-3xl text-forest-800">{format(new Date(appt.scheduledAt), "d")}</div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-forest-800">{appt.service?.name}</h3>
                    <p className="font-body text-xs text-forest-400/60 mt-0.5">with {appt.staff?.user?.name} · {format(new Date(appt.scheduledAt), "h:mm a")}</p>
                    <p className="font-display text-sm text-gold-600 mt-1">₹{Number(appt.priceAtBooking).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                  {/* Status badge — non-clickable */}
                  <div className={`${STATUS_BADGE[appt.status] || "badge"} select-none pointer-events-none`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {appt.status === "CONFIRMED" ? "Confirmed ✓"
                      : appt.status === "PENDING" ? "Pending..."
                        : appt.status === "COMPLETED" ? "Completed"
                          : appt.status === "CANCELLED" ? "Cancelled"
                            : appt.status === "IN_PROGRESS" ? "In Progress"
                              : appt.status}
                  </div>
                  {appt.status === "CONFIRMED" && (
                    <span className="font-body text-[10px] text-forest-400/40">Pay at salon</span>
                  )}
                  {appt.status === "COMPLETED" && !appt.review && (
                    <button onClick={() => setReviewModal(appt)}
                      className="font-body text-xs tracking-widests uppercase text-gold-600 border border-gold-600/40 px-3 py-1.5 hover:bg-gold-600 hover:text-cream-50 transition-all">
                      Leave Review
                    </button>
                  )}
                  {appt.status === "COMPLETED" && appt.review && (
                    <span className="font-body text-xs text-forest-400/50 flex items-center gap-1"><Star size={11} fill="#C9A84C" stroke="none" /> Reviewed</span>
                  )}
                  {["PENDING", "CONFIRMED"].includes(appt.status) && (
                    <button
                      onClick={() => { if (window.confirm(`Cancel your ${appt.service?.name} on ${format(new Date(appt.scheduledAt), "dd MMM 'at' h:mm a")}?\n\nThis cannot be undone.`)) cancelMutation.mutate(appt.id); }}
                      disabled={cancelMutation.isPending}
                      className="font-body text-[10px] tracking-widests uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-all disabled:opacity-40">
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── My Reviews ── */}
        {tab === "reviews" && (
          <div className="animate-fade-up space-y-4">
            {myWrittenReviews.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare size={40} className="text-forest-400/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-forest-400/40 italic">No reviews yet</p>
                <p className="font-body text-sm text-forest-400/40 mt-2">Complete an appointment to leave your first review</p>
              </div>
            ) : myWrittenReviews.map(review => (
              <div key={review.id} className="bg-cream-50 border border-forest-100/30 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-display text-lg text-forest-800">{review.appointment?.service?.name || "Service"}</h3>
                    <p className="font-body text-xs text-gold-600 mt-0.5">with {review.staff?.user?.name}</p>
                    <p className="font-body text-xs text-forest-400/50 mt-0.5">{format(new Date(review.createdAt), "dd MMM yyyy")}</p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= review.rating ? "#C9A84C" : "none"} stroke="#C9A84C" />)}
                  </div>
                </div>
                {review.comment && <p className="font-body text-sm text-forest-400/80 leading-relaxed border-l-2 border-gold-600/30 pl-4 italic">"{review.comment}"</p>}
                <div className="mt-3">
                  <span className={`font-body text-[10px] tracking-widests uppercase px-2 py-0.5 rounded-full ${review.isPublished ? "bg-forest-100 text-forest-600" : "bg-cream-200 text-forest-400/50"}`}>
                    {review.isPublished ? "Published" : "Pending approval"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <div className="animate-fade-up space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-20">
                <Bell size={40} className="text-forest-400/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-forest-400/40 italic">All caught up</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`p-5 border transition-colors cursor-pointer ${n.isRead ? "bg-cream-50 border-forest-100/30" : "bg-gold-100/20 border-gold-400/30"}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-body text-sm font-medium text-forest-800">{n.title}</p>
                    <p className="font-body text-xs text-forest-400/70 mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />}
                    <span className="font-body text-[10px] text-forest-400/40">{format(new Date(n.createdAt), "dd MMM")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Profile ── */}
        {tab === "profile" && (
          <div className="animate-fade-up max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-3xl text-forest-800">My Details</h2>
              <button onClick={() => setEditMode(!editMode)} className={editMode ? "btn-gold py-2 px-5 text-xs" : "btn-ghost py-2 px-5 text-xs"}>
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>
            {editMode ? (
              <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-5">
                <div>
                  <label className="font-body text-[10px] tracking-widests uppercase text-forest-400/60 block mb-2">Full Name</label>
                  <input className="field-light w-full" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="font-body text-[10px] tracking-widests uppercase text-forest-400/60 block mb-2">Phone</label>
                  <input className="field-light w-full" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <button type="submit" className="btn-gold w-full" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {[["Name", user?.name], ["Email", user?.email], ["Phone", user?.phone || "Not set"],
                ["Member since", user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : ""]
                ].map(([label, val]) => (
                  <div key={label} className="border-b border-forest-100/30 pb-5">
                    <span className="font-body text-[10px] tracking-widests uppercase text-forest-400/40">{label}</span>
                    <p className="font-body text-sm text-forest-800 mt-1">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(8,8,8,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bg-cream-50 w-full max-w-md rounded-sm p-8 animate-fade-up">
            <h3 className="font-display text-2xl text-forest-800 mb-1">Leave a Review</h3>
            <p className="font-body text-sm text-forest-400/60 mb-5">{reviewModal.service?.name} with {reviewModal.staff?.user?.name}</p>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="transition-transform hover:scale-110">
                  <Star size={28} fill={s <= reviewForm.rating ? "#C9A84C" : "none"} stroke="#C9A84C" />
                </button>
              ))}
            </div>
            <textarea className="field-light w-full h-28 resize-none mb-5" placeholder="Share your experience..."
              value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
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