// ══════════ GalleryPage.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { photosAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";
import { X } from "lucide-react";

export function GalleryPage() {
  const ref = useReveal();
  const [activeCategory, setActiveCategory] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["photos", activeCategory],
    queryFn: () => photosAPI.list({ category: activeCategory || undefined, limit: 50 }),
  });

  const photos = data?.data?.data || [];
  const categories = ["Hair", "Nails", "Makeup", "Facial", "Bridal", "Spa"];

  return (
    <div className="min-h-screen bg-cream" ref={ref}>
      <Navbar />

      {/* Hero */}
      <div className="bg-forest-900 pt-36 pb-20 text-center noise relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#d97706]/8 blur-3xl" />
        <div className="relative">
          <span className="font-body text-[10px] tracking-[0.35em] uppercase text-gold-400">Our Work</span>
          <h1 className="font-display text-6xl font-light text-cream-50 mt-3">The Gallery</h1>
          <div className="w-12 h-px bg-[#d97706] mx-auto mt-6" />
          <p className="font-body text-sm text-cream-200/50 mt-6 max-w-md mx-auto">
            A visual journey through our most celebrated transformations.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-20 z-30 bg-cream-50/95 backdrop-blur-md border-b border-forest-100/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <button onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 font-body text-xs tracking-widest uppercase px-5 py-2 border transition-all ${!activeCategory ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`flex-shrink-0 font-body text-xs tracking-widest uppercase px-5 py-2 border transition-all ${activeCategory === c ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`bg-cream-200 animate-pulse rounded-sm mb-4 ${i % 3 === 0 ? "h-72" : i % 3 === 1 ? "h-48" : "h-60"}`} />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo, i) => (
              <div key={photo.id} className={`reveal delay-${(i % 5) * 100} break-inside-avoid mb-4 group cursor-pointer overflow-hidden`}
                onClick={() => setLightbox(photo)}>
                <div className="relative overflow-hidden">
                  <img src={photo.thumbnailUrl || photo.url} alt={photo.title || "Salon work"}
                    className="w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/40 transition-all duration-500 flex items-end p-4">
                    {photo.title && (
                      <span className="font-body text-xs text-cream-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 tracking-widest uppercase">
                        {photo.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-display text-3xl text-forest-400/40 italic">Gallery coming soon</p>
            <p className="font-body text-sm text-forest-400/40 mt-3">Beautiful work being uploaded</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-forest-900/95 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-cream-200/60 hover:text-cream-50 transition-colors">
            <X size={24} />
          </button>
          <img src={lightbox.url} alt={lightbox.title || ""}
            className="max-w-4xl max-h-[85vh] object-contain animate-fade-up"
            onClick={(e) => e.stopPropagation()} />
          {lightbox.title && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="font-display text-lg italic text-cream-50">{lightbox.title}</p>
              {lightbox.category && <p className="font-body text-xs tracking-widest uppercase text-gold-400 mt-1">{lightbox.category}</p>}
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}

export default GalleryPage;