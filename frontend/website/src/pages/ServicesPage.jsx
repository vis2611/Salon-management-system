// ══════════ ServicesPage.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { servicesAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";

export function ServicesPage() {
  const ref = useReveal();
  const [activeCategory, setActiveCategory] = useState(null);
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: servicesAPI.categories });
  const { data: svcs } = useQuery({
    queryKey: ["services", activeCategory],
    queryFn: () => servicesAPI.list({ categoryId: activeCategory || undefined, limit: 50 }),
  });

  const categories = cats?.data?.data || [];
  const services = svcs?.data?.data || [];

  return (
    <div className="min-h-screen bg-cream" ref={ref}>
      <Navbar />
      {/* Hero */}
      <div className="bg-forest-900 pt-36 pb-20 text-center noise relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#d97706]/8 blur-3xl" />
        <div className="relative">
          <span className="font-body text-[10px] tracking-[0.35em] uppercase text-gold-400">What We Offer</span>
          <h1 className="font-display text-6xl font-light text-cream-50 mt-3">Our Services</h1>
          <div className="w-12 h-px bg-[#d97706] mx-auto mt-6" />
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-cream-50/95 backdrop-blur-md border-b border-forest-100/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <button onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 font-body text-xs tracking-widest uppercase px-5 py-2 border transition-all ${!activeCategory ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 font-body text-xs tracking-widest uppercase px-5 py-2 border transition-all ${activeCategory === c.id ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc, i) => (
          <div key={svc.id} className={`reveal delay-${(i % 6) * 100} group bg-cream-50 border border-forest-100/30 hover:border-gold-600/50 hover:shadow-lg transition-all duration-500`}>
            {svc.imageUrl && (
              <div className="h-44 overflow-hidden">
                <img src={svc.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={svc.name} />
              </div>
            )}
            <div className="p-7">
              <div className="font-body text-[9px] tracking-[0.3em] uppercase text-gold-600 mb-2">{svc.category?.name}</div>
              <h3 className="font-display text-2xl text-forest-800 mb-3">{svc.name}</h3>
              <p className="font-body text-sm text-forest-400/70 leading-relaxed mb-6 line-clamp-3">{svc.description}</p>
              <div className="flex items-center justify-between pt-5 border-t border-forest-100/30">
                <div>
                  <span className="font-display text-2xl text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                  <span className="font-body text-xs text-forest-400/50 ml-1">· {svc.durationMins} min</span>
                </div>
                <Link to="/book" className="btn-gold py-2.5 px-5 text-[10px]">Book Now</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default ServicesPage;