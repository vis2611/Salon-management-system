import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photosAPI } from "../api/api";
import { Upload, Trash2, Star, X, AlertCircle, AlertTriangle } from "lucide-react";

const CATEGORIES = ["Hair", "Nails", "Makeup", "Facial", "Bridal", "Spa"];

// ── Centered Modal wrapper ─────────────────────────────────
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

// ── Issue 1: Beautiful delete confirmation modal ────────────
function DeleteConfirmModal({ photo, onConfirm, onCancel, isDeleting }) {
  return (
    <Modal onClose={onCancel}>
      <div className="bg-obsidian-50 border border-slate-700 rounded-2xl overflow-hidden">
        {/* Red accent top bar */}
        <div style={{ height: "4px", background: "linear-gradient(to right, #ef4444, #dc2626)" }} />

        <div className="p-8">
          {/* Icon + heading */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-dash text-lg font-semibold text-slate-100 mb-1">Delete Photo?</h2>
              <p className="font-dash text-sm text-slate-400 leading-relaxed">
                {photo?.title
                  ? <>You are about to delete <span className="text-slate-200 font-medium">"{photo.title}"</span>.</>
                  : "You are about to delete this photo."
                }
                {" "}This will permanently remove it from your gallery and Cloudinary storage.
              </p>
            </div>
          </div>

          {/* Photo preview */}
          {photo?.thumbnailUrl || photo?.url ? (
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-700/60" style={{ height: "120px" }}>
              <img
                src={photo.thumbnailUrl || photo.url}
                className="w-full h-full object-cover opacity-60"
                alt=""
              />
            </div>
          ) : null}

          {/* Warning note */}
          <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-7">
            <span className="font-dash text-xs text-red-400">⚠ This action cannot be undone.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 font-dash text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3 transition-all">
              Keep Photo
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 font-dash text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isDeleting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                : <><Trash2 size={15} /> Yes, Delete</>
              }
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPhotos() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [filter, setFilter] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({ title: "", category: "", isFeatured: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // Issue 1 — photo to delete

  const { data, isLoading } = useQuery({
    queryKey: ["admin-photos", filter],
    queryFn: () => photosAPI.list({ category: filter || undefined, limit: 100 }),
  });
  const photos = data?.data?.data || [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const fd = new FormData();
      fd.append("photo", selectedFile);
      if (uploadMeta.title) fd.append("title", uploadMeta.title);
      if (uploadMeta.category) fd.append("category", uploadMeta.category);
      fd.append("isFeatured", uploadMeta.isFeatured ? "true" : "false");
      return photosAPI.upload(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-photos"] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadMeta({ title: "", category: "", isFeatured: false });
      setUploadError("");
    },
    onError: e => setUploadError(e.response?.data?.message || "Upload failed. Check Cloudinary in .env"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => photosAPI.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-photos"] }),
  });

  // Issue 1 — delete uses custom modal, not window.confirm
  const deleteMutation = useMutation({
    mutationFn: id => photosAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-photos"] });
      setDeleteTarget(null);
    },
    onError: e => {
      alert(e.response?.data?.message || "Delete failed");
      setDeleteTarget(null);
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setUploadError("Only JPG, PNG or WEBP images allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("File too large. Max 5MB."); return; }
    setUploadError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const openUploadModal = () => {
    setSelectedFile(null); setPreviewUrl(null);
    setUploadMeta({ title: "", category: "", isFeatured: false });
    setUploadError(""); setShowUploadModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-dash text-2xl font-semibold text-slate-100">Gallery</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{photos.length} photos</p>
        </div>
        <button onClick={openUploadModal}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
          <Upload size={14} /> Upload Photo
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter(null)}
          className={`font-dash text-xs px-4 py-1.5 rounded-full border transition-all ${!filter ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "border-slate-700 text-slate-400 hover:border-amber-500/30"}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`font-dash text-xs px-4 py-1.5 rounded-full border transition-all ${filter === c ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "border-slate-700 text-slate-400 hover:border-amber-500/30"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24 dash-card">
          <Upload size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="font-dash text-slate-500 mb-2">No photos yet</p>
          <p className="font-dash text-xs text-slate-600">Click "Upload Photo" to add gallery images</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl aspect-square bg-slate-800">
              <img
                src={photo.thumbnailUrl || photo.url}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={photo.title || ""}
                onError={e => { e.target.src = "https://placehold.co/400x400/1a1a1a/666?text=Error"; }}
              />
              <div className="absolute inset-0 bg-obsidian-200/0 group-hover:bg-obsidian-200/70 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => updateMutation.mutate({ id: photo.id, isFeatured: !photo.isFeatured })}
                  title={photo.isFeatured ? "Remove from featured" : "Set as featured"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${photo.isFeatured ? "bg-amber-500 text-obsidian-200" : "bg-slate-700/80 text-amber-400 hover:bg-amber-500/30"}`}>
                  <Star size={14} fill={photo.isFeatured ? "currentColor" : "none"} />
                </button>
                {/* Issue 1 — Opens beautiful custom modal instead of window.confirm */}
                <button
                  onClick={() => setDeleteTarget(photo)}
                  title="Delete photo"
                  className="w-9 h-9 rounded-full bg-red-500/25 text-red-400 hover:bg-red-500/50 flex items-center justify-center transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {photo.isFeatured && (
                <div className="absolute top-2 left-2 bg-amber-500 rounded-full p-1.5">
                  <Star size={9} fill="white" stroke="none" />
                </div>
              )}
              {photo.category && (
                <div className="absolute bottom-2 left-2 font-dash text-[9px] tracking-widest uppercase bg-obsidian-100/80 text-amber-400 px-2 py-0.5 rounded-full">
                  {photo.category}
                </div>
              )}
              {photo.title && (
                <div className="absolute bottom-2 right-2 max-w-[100px] font-dash text-[9px] text-slate-300 bg-obsidian-100/80 px-2 py-0.5 rounded-full truncate">
                  {photo.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Issue 1 — Beautiful Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          photo={deleteTarget}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal onClose={() => setShowUploadModal(false)}>
          <div className="bg-obsidian-50 border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-dash text-lg font-medium text-slate-100">Upload Photo</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-5 ${selectedFile ? "border-amber-500/50 bg-amber-500/5" : "border-slate-700 hover:border-amber-500/30"}`}>
              {previewUrl ? (
                <div>
                  <img src={previewUrl} className="max-h-40 mx-auto object-contain rounded-lg mb-3" alt="preview" />
                  <p className="font-dash text-xs text-slate-400">{selectedFile?.name}</p>
                  <p className="font-dash text-[10px] text-slate-600 mt-1">{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="text-slate-600 mx-auto mb-3" />
                  <p className="font-dash text-sm text-slate-400">Click to select an image</p>
                  <p className="font-dash text-xs text-slate-600 mt-1">JPG, PNG or WEBP · Max 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
            {uploadError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-dash text-xs text-red-400">{uploadError}</p>
              </div>
            )}
            <div className="space-y-4 mb-6">
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Title (optional)</label>
                <input type="text" className="field-dark w-full" placeholder="e.g. Summer Balayage"
                  value={uploadMeta.title} onChange={e => setUploadMeta({ ...uploadMeta, title: e.target.value })} />
              </div>
              <div>
                <label className="font-dash text-[10px] tracking-widest uppercase text-slate-500 block mb-2">Category</label>
                <select className="field-dark w-full" value={uploadMeta.category}
                  onChange={e => setUploadMeta({ ...uploadMeta, category: e.target.value })}>
                  <option value="">No category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setUploadMeta({ ...uploadMeta, isFeatured: !uploadMeta.isFeatured })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${uploadMeta.isFeatured ? "bg-amber-500" : "bg-slate-700"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${uploadMeta.isFeatured ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="font-dash text-xs text-slate-400">Feature on homepage gallery</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUploadModal(false)}
                className="flex-1 font-dash text-xs text-slate-400 border border-slate-700 rounded-xl py-2.5 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={() => uploadMutation.mutate()} disabled={!selectedFile || uploadMutation.isPending}
                className="flex-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs rounded-xl py-2.5 hover:bg-amber-500/25 transition-all disabled:opacity-40">
                {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}