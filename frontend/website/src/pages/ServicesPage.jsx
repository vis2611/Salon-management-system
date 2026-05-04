// Fix 5 — Reviews now show on each service card
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { servicesAPI, reviewsAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";
import { Star, Clock, ChevronRight, X } from "lucide-react";

export default function ServicesPage() {
  const ref = useReveal();
  const [activeCategory, setActiveCategory] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // shows reviews for a service

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: servicesAPI.categories });
  const { data: svcs } = useQuery({
    queryKey: ["services", activeCategory],
    queryFn: () => servicesAPI.list({ categoryId: activeCategory || undefined, limit: 50 }),
  });
  // Fix 5 — load all reviews to display on service cards
  const { data: allReviews } = useQuery({
    queryKey: ["reviews-all"],
    queryFn: () => reviewsAPI.list({ limit: 200 }),
  });

  const categories = cats?.data?.data || [];
  const services = svcs?.data?.data || [];
  const reviews = allReviews?.data?.data || [];

  // Group reviews by staffId so we can show per-service averages
  const getServiceReviews = (service) => {
    const staffIds = service.staffServices?.map(ss => ss.staffId) || [];
    return reviews.filter(r => staffIds.includes(r.staffId));
  };

  const avgRating = (revs) => {
    if (!revs.length) return null;
    const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
    return Math.round(avg * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-cream" ref={ref}>
      <Navbar />

      {/* Hero */}
      <div className="bg-forest-900 pt-36 pb-20 text-center noise relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold-600/8 blur-3xl" />
        <div className="relative">
          <span className="font-body text-[10px] tracking-[0.35em] uppercase text-gold-400">What We Offer</span>
          <h1 className="font-display text-6xl font-light text-cream-50 mt-3">Our Services</h1>
          <div className="w-12 h-px bg-gold-600 mx-auto mt-6" />
          <p className="font-body text-sm text-cream-200/50 mt-4 max-w-md mx-auto">
            Premium beauty services crafted by master stylists
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-cream-50/95 backdrop-blur-md border-b border-forest-100/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <button onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 font-body text-xs tracking-widest uppercase px-5 py-2 border transition-all ${!activeCategory ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 font-body text-xs tracking-widests uppercase px-5 py-2 border transition-all ${activeCategory === c.id ? "bg-forest-800 text-cream-50 border-forest-800" : "border-forest-100/40 text-forest-800 hover:border-gold-600"}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-3 text-center py-20">
            <p className="font-display text-2xl text-forest-400/40 italic">No services found</p>
          </div>
        ) : services.map((svc, i) => {
          const svcReviews = getServiceReviews(svc);
          const rating = avgRating(svcReviews);
          return (
            <div key={svc.id} className={`reveal delay-${(i % 6) * 100} group bg-cream-50 border border-forest-100/30 hover:border-gold-600/50 hover:shadow-lg transition-all duration-500`}>
              {svc.imageUrl && (
                <div className="h-44 overflow-hidden">
                  <img src={svc.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={svc.name} />
                </div>
              )}
              <div className="p-7">
                <div className="font-body text-[9px] tracking-[0.3em] uppercase text-gold-600 mb-2">{svc.category?.name}</div>
                <h3 className="font-display text-2xl text-forest-800 mb-2">{svc.name}</h3>

                {/* Fix 5 — Star rating on service card */}
                {rating && (
                  <button
                    onClick={() => setReviewModal({ service: svc, reviews: svcReviews })}
                    className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12}
                          fill={s <= Math.round(rating) ? "#C9A84C" : "none"}
                          stroke="#C9A84C" />
                      ))}
                    </div>
                    <span className="font-body text-xs text-forest-400">
                      {rating} ({svcReviews.length} review{svcReviews.length !== 1 ? "s" : ""})
                    </span>
                  </button>
                )}

                <p className="font-body text-sm text-forest-400/70 leading-relaxed mb-5 line-clamp-3">{svc.description}</p>

                {/* Staff who offer this service */}
                {svc.staffServices?.length > 0 && (
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex -space-x-2">
                      {svc.staffServices.slice(0, 4).map(ss => (
                        <div key={ss.staffId} className="w-7 h-7 rounded-full bg-cream-200 border-2 border-cream-50 overflow-hidden flex items-center justify-center">
                          {ss.staff?.user?.avatarUrl
                            ? <img src={ss.staff.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                            : <span className="font-display text-xs text-forest-400">{ss.staff?.user?.name?.[0]}</span>
                          }
                        </div>
                      ))}
                    </div>
                    <span className="font-body text-xs text-forest-400/60">
                      {svc.staffServices.length} stylist{svc.staffServices.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-forest-100/30">
                  <div>
                    <span className="font-display text-2xl text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                    <span className="font-body text-xs text-forest-400/50 ml-1 flex items-center gap-1 inline-flex">
                      <Clock size={10} /> {svc.durationMins} min
                    </span>
                  </div>
                  <Link to="/book" className="btn-gold py-2.5 px-5 text-[10px]">Book Now</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fix 5 — Reviews Modal for a service */}
      {reviewModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(8,8,8,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bg-cream-50 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-sm">
            <div className="flex items-center justify-between p-6 border-b border-forest-100/30">
              <div>
                <h3 className="font-display text-2xl text-forest-800">{reviewModal.service.name}</h3>
                <p className="font-body text-xs text-forest-400/60 mt-0.5">{reviewModal.reviews.length} reviews</p>
              </div>
              <button onClick={() => setReviewModal(null)} className="text-forest-400 hover:text-forest-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {reviewModal.reviews.length === 0 ? (
                <p className="font-body text-sm text-forest-400/60 text-center py-8 italic">No reviews yet for this service.</p>
              ) : reviewModal.reviews.map(review => (
                <div key={review.id} className="border-b border-forest-100/30 pb-5 last:border-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.user?.avatarUrl
                        ? <img src={review.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                        : <span className="font-display text-sm text-forest-400">{review.user?.name?.[0]}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-medium text-forest-800">{review.user?.name}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={11} fill={s <= review.rating ? "#C9A84C" : "none"} stroke="#C9A84C" />
                          ))}
                        </div>
                      </div>
                      {review.staff?.user?.name && (
                        <p className="font-body text-xs text-gold-600 mt-0.5">with {review.staff.user.name}</p>
                      )}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="font-body text-sm text-forest-400/80 leading-relaxed ml-12">{review.comment}</p>
                  )}
                  <p className="font-body text-[10px] text-forest-400/40 ml-12 mt-1">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}