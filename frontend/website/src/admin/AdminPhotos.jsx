import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photosAPI } from "../api/api";
import { Upload, Trash2, Star } from "lucide-react";

const CATEGORIES = ["Hair", "Nails", "Makeup", "Facial", "Bridal", "Spa"];

export default function AdminPhotos() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [filter, setFilter] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({ title: "", category: "" });

  const { data } = useQuery({
    queryKey: ["admin-photos", filter],
    queryFn: () => photosAPI.list({ category: filter || undefined, limit: 100 }),
  });
  const photos = data?.data?.data || [];

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("photo", file);
      if (uploadMeta.title) fd.append("title", uploadMeta.title);
      if (uploadMeta.category) fd.append("category", uploadMeta.category);
      return photosAPI.upload(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-photos"] }); setUploading(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => photosAPI.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-photos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => photosAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-photos"] }),
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setUploading(true); uploadMutation.mutate(file); }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div><h1 className="font-dash text-2xl font-semibold text-slate-100">Gallery</h1>
          <p className="font-dash text-sm text-slate-500 mt-0.5">{photos.length} photos</p>
        </div>
        <button onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-dash text-xs px-4 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all">
          <Upload size={14} /> Upload Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Upload metadata */}
      {uploading && (
        <div className="dash-card flex gap-4 items-center">
          <div className="flex-1">
            <input className="field-dark w-full" placeholder="Photo title (optional)"
              value={uploadMeta.title} onChange={(e) => setUploadMeta({ ...uploadMeta, title: e.target.value })} />
          </div>
          <select className="field-dark" value={uploadMeta.category} onChange={(e) => setUploadMeta({ ...uploadMeta, category: e.target.value })}>
            <option value="">Category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="font-dash text-xs text-amber-400">{uploadMutation.isPending ? "Uploading..." : "Ready"}</div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter(null)} className={`font-dash text-xs px-4 py-1.5 rounded-full border transition-all ${!filter ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "border-slate-700 text-slate-400 hover:border-amber-500/30"}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`font-dash text-xs px-4 py-1.5 rounded-full border transition-all ${filter === c ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "border-slate-700 text-slate-400 hover:border-amber-500/30"}`}>{c}</button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-xl aspect-square bg-slate-800">
            <img src={photo.thumbnailUrl || photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={photo.title || ""} />
            <div className="absolute inset-0 bg-obsidian-200/0 group-hover:bg-obsidian-200/70 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button onClick={() => updateMutation.mutate({ id: photo.id, isFeatured: !photo.isFeatured })}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${photo.isFeatured ? "bg-amber-500 text-obsidian-200" : "bg-slate-700 text-amber-400 hover:bg-amber-500/20"}`}>
                <Star size={13} fill={photo.isFeatured ? "currentColor" : "none"} />
              </button>
              <button onClick={() => { if (confirm("Delete this photo?")) deleteMutation.mutate(photo.id); }}
                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
            {photo.isFeatured && (
              <div className="absolute top-2 left-2 bg-amber-500 rounded-full p-1"><Star size={8} fill="white" stroke="none" /></div>
            )}
            {photo.category && (
              <div className="absolute bottom-2 left-2 font-dash text-[9px] tracking-widest uppercase bg-obsidian-100/80 text-amber-400 px-2 py-0.5 rounded-full">
                {photo.category}
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-24">
          <Upload size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="font-dash text-slate-500">No photos yet. Upload your first one!</p>
        </div>
      )}
    </div>
  );
}