import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesAPI, staffAPI, appointmentsAPI, couponsAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle, ChevronRight, Calendar, User,
  Scissors, Tag, Home, Check, QrCode, Clock
} from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";

const STEPS = ["Service", "Staff & Time", "Review & Confirm"];

// Fix 8 — Payment removed. Booking confirmed immediately, customer pays at shop via QR/cash

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({
    services: [],
    staff: null,
    slot: null,
    date: startOfToday(),
    couponCode: "",
    couponData: null,
    notes: "",
    paymentMethod: "AT_SHOP", // Fix 8 — default pay at shop
  });
  const [booked, setBooked] = useState(null);
  const [error, setError] = useState("");

  const { data: services } = useQuery({
    queryKey: ["services-all"],
    queryFn: () => servicesAPI.list({ limit: 100 }),
  });
  const { data: staffData } = useQuery({
    queryKey: ["staff-all"],
    queryFn: staffAPI.list,
  });

  const primaryService = selected.services[0] || null;
  const { data: availability, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", selected.staff?.id, selected.date?.toISOString(), primaryService?.id],
    queryFn: () => appointmentsAPI.availability({
      staffId: selected.staff.id,
      serviceId: primaryService.id,
      date: format(selected.date, "yyyy-MM-dd"),
    }),
    enabled: !!selected.staff && !!selected.date && !!primaryService,
  });
  const slots = availability?.data?.data?.slots || [];

  // Fix 5 — multiple services toggle
  const toggleService = (svc) => {
    setSelected(s => {
      const exists = s.services.find(sv => sv.id === svc.id);
      return {
        ...s,
        services: exists ? s.services.filter(sv => sv.id !== svc.id) : [...s.services, svc],
        staff: null, slot: null,
      };
    });
  };

  const totalPrice = selected.services.reduce((sum, svc) => sum + Number(svc.price), 0);
  const totalDuration = selected.services.reduce((sum, svc) => sum + svc.durationMins, 0);
  const finalPrice = selected.couponData ? selected.couponData.finalAmount : totalPrice;

  const couponMutation = useMutation({
    mutationFn: d => couponsAPI.validate(d),
    onSuccess: ({ data }) => setSelected(s => ({ ...s, couponData: data.data })),
    onError: e => setError(e.response?.data?.message || "Invalid coupon"),
  });

  // Fix 8 — Book directly, no payment gateway
  const bookMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const svc of selected.services) {
        const res = await appointmentsAPI.create({
          serviceId: svc.id,
          staffId: selected.staff.id,
          scheduledAt: selected.slot,
          notes: selected.notes + (results.length === 0 && selected.couponData ? ` [Coupon: ${selected.couponCode}]` : ""),
          couponCode: selected.couponData && results.length === 0 ? selected.couponCode : undefined,
        });
        results.push(res.data.data);
      }
      return results;
    },
    onSuccess: (appts) => {
      // Invalidate dashboard so it updates — Fix 7
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      setBooked(appts);
    },
    onError: e => setError(e.response?.data?.message || "Booking failed. Please try again."),
  });

  // Fix 6 — Filter staff who offer ALL selected services
  const eligibleStaff = (staffData?.data?.data || []).filter(member =>
    selected.services.length === 0 ||
    selected.services.every(svc => member.services?.some(ss => ss.serviceId === svc.id))
  );

  if (booked) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-lg animate-fade-up w-full">
            <CheckCircle size={56} className="text-forest-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl text-forest-800 mb-3">Booking Confirmed!</h2>
            <p className="font-body text-sm text-forest-400/70 leading-relaxed mb-8">
              Your appointment is confirmed. Please arrive 5 minutes early.
            </p>

            <div className="bg-cream-200 border border-forest-100/30 p-6 text-left mb-6 space-y-3">
              {selected.services.map(svc => (
                <div key={svc.id} className="flex justify-between">
                  <span className="font-body text-sm text-forest-800">✓ {svc.name}</span>
                  <span className="font-display text-sm text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="border-t border-forest-100/30 pt-3 space-y-1">
                <p className="font-body text-sm text-forest-800"><strong>Stylist:</strong> {selected.staff?.user?.name}</p>
                {selected.slot && (
                  <p className="font-body text-sm text-forest-800">
                    <strong>When:</strong> {format(new Date(selected.slot), "EEEE, dd MMM yyyy · h:mm a")}
                  </p>
                )}
              </div>
            </div>

            {/* Fix 8 — Pay at shop info */}
            <div className="bg-cream-50 border border-gold-600/30 p-5 mb-8 flex items-start gap-4">
              <QrCode size={28} className="text-gold-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-body text-sm font-medium text-forest-800 mb-1">Pay at the salon</p>
                <p className="font-body text-xs text-forest-400/70 leading-relaxed">
                  Total amount: <strong className="text-forest-800">₹{finalPrice.toLocaleString("en-IN")}</strong>.
                  Pay via cash or scan our QR code when you arrive. No advance payment needed.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link to="/" className="btn-ghost inline-flex items-center gap-2 text-xs">
                <Home size={13} /> Home
              </Link>
              <Link to="/profile" className="btn-gold inline-block text-xs">My Appointments</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-20 max-w-5xl mx-auto px-6 w-full">

        {/* Breadcrumb — Fix 9 */}
        <div className="flex items-center gap-2 mb-6 mt-4">
          <Link to="/" className="flex items-center gap-1.5 font-body text-xs text-forest-400/60 hover:text-gold-600 transition-colors">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={10} className="text-forest-400/40" />
          <span className="font-body text-xs text-forest-800">Book Appointment</span>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-xs font-body tracking-widest uppercase transition-all ${i === step ? "text-gold-600" : i < step ? "text-forest-400" : "text-forest-400/30"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all ${i === step ? "bg-gold-600 border-gold-600 text-cream-50" : i < step ? "bg-forest-400 border-forest-400 text-cream-50" : "border-forest-200"}`}>
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-forest-200" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-5 py-3 mb-6 rounded-sm">{error}</div>
        )}

        {/* ── Step 0: Multi-select services — Fix 5 ── */}
        {step === 0 && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-3xl text-forest-800">Choose Services</h2>
              {selected.services.length > 0 && (
                <div className="font-body text-sm text-forest-800 bg-gold-100/30 border border-gold-400/30 px-4 py-2 rounded-sm">
                  {selected.services.length} selected · ₹{totalPrice.toLocaleString("en-IN")} · {totalDuration} min
                </div>
              )}
            </div>
            <p className="font-body text-xs text-forest-400/60 mb-6">Select one or more services — they will be booked together.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(services?.data?.data || []).map(svc => {
                const isSel = selected.services.some(sv => sv.id === svc.id);
                return (
                  <button key={svc.id} onClick={() => toggleService(svc)}
                    className={`text-left p-6 border transition-all duration-300 relative ${isSel ? "border-gold-600 bg-gold-100/30 shadow-md" : "border-forest-100/30 bg-cream-50 hover:border-gold-400"}`}>
                    {isSel && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-gold-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-cream-50" />
                      </div>
                    )}
                    <div className="font-body text-[9px] tracking-widest uppercase text-gold-600 mb-1">{svc.category?.name}</div>
                    <div className="font-display text-lg text-forest-800 mb-1 pr-6">{svc.name}</div>
                    <div className="font-body text-xs text-forest-400/60 mb-4 line-clamp-2">{svc.description}</div>
                    <div className="flex justify-between items-center">
                      <span className="font-display text-xl text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                      <span className="font-body text-xs text-gold-600 flex items-center gap-1"><Clock size={10} />{svc.durationMins} min</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => { setError(""); setStep(1); }} disabled={selected.services.length === 0}
                className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                Continue → ({selected.services.length} service{selected.services.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Staff & Time — Fix 6 (multiple staff per service) ── */}
        {step === 1 && (
          <div className="animate-fade-up grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-3xl text-forest-800 mb-2">Choose Your Stylist</h2>
              <p className="font-body text-xs text-forest-400/60 mb-5">
                {eligibleStaff.length === 0
                  ? "No stylist currently offers all selected services together."
                  : `${eligibleStaff.length} stylist${eligibleStaff.length !== 1 ? "s" : ""} available for your selection.`
                }
              </p>
              <div className="space-y-3">
                {eligibleStaff.length === 0 ? (
                  <div className="bg-cream-200 border border-gold-400/30 p-4 text-sm font-body text-forest-400 rounded-sm">
                    Try selecting fewer services, or choose services offered by the same stylist.
                  </div>
                ) : eligibleStaff.map(member => (
                  <button key={member.id}
                    onClick={() => setSelected(s => ({ ...s, staff: member, slot: null }))}
                    className={`w-full flex items-center gap-4 p-4 border transition-all ${selected.staff?.id === member.id ? "border-gold-600 bg-gold-100/20" : "border-forest-100/30 bg-cream-50 hover:border-gold-400"}`}>
                    <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-forest-100/30">
                      {member.user?.avatarUrl
                        ? <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                        : <span className="font-display text-xl text-forest-400">{member.user?.name?.[0]}</span>
                      }
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-body text-sm font-medium text-forest-800">{member.user?.name}</div>
                      <div className="font-body text-xs text-gold-600">{member.specialization}</div>
                      {member.avgRating && (
                        <div className="font-body text-xs text-forest-400/60 mt-0.5">★ {member.avgRating} · {member.experienceYears}y exp</div>
                      )}
                    </div>
                    {selected.staff?.id === member.id && (
                      <div className="w-5 h-5 bg-gold-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-cream-50" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl text-forest-800 mb-2">Pick a Date</h2>
              {/* 60-day strip */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-5" style={{ scrollbarWidth: "thin" }}>
                {[...Array(60)].map((_, i) => {
                  const d = addDays(startOfToday(), i);
                  const isSel = format(selected.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
                  return (
                    <button key={i}
                      onClick={() => setSelected(s => ({ ...s, date: d, slot: null }))}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 border text-xs font-body transition-all ${isSel ? "border-gold-600 bg-gold-600 text-cream-50" : "border-forest-100/30 bg-cream-50 text-forest-800 hover:border-gold-400"}`}>
                      <span className="uppercase text-[9px] tracking-widest">{format(d, "EEE")}</span>
                      <span className="text-lg font-display">{format(d, "d")}</span>
                      <span className="text-[8px] opacity-60">{format(d, "MMM")}</span>
                    </button>
                  );
                })}
              </div>

              <h3 className="font-body text-sm font-medium text-forest-800 mb-3">Available Times</h3>
              {selected.staff && primaryService ? (
                loadingSlots ? (
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(8)].map((_, i) => <div key={i} className="w-20 h-9 bg-cream-200 animate-pulse rounded-sm" />)}
                  </div>
                ) : slots.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {slots.map(slot => (
                      <button key={slot}
                        onClick={() => setSelected(s => ({ ...s, slot }))}
                        className={`px-3 py-2 border text-xs font-body transition-all ${selected.slot === slot ? "border-gold-600 bg-gold-600 text-cream-50" : "border-forest-100/30 bg-cream-50 text-forest-800 hover:border-gold-400"}`}>
                        {format(new Date(slot), "h:mm a")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-forest-400/60">No available slots on this date. Try another day.</p>
                )
              ) : (
                <p className="font-body text-sm text-forest-400/60 italic">Select a stylist first.</p>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1">← Back</button>
                <button onClick={() => { setError(""); setStep(2); }} disabled={!selected.staff || !selected.slot}
                  className="btn-gold flex-1 disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Review & Confirm (no payment) — Fix 8 ── */}
        {step === 2 && (
          <div className="animate-fade-up max-w-xl mx-auto">
            <h2 className="font-display text-3xl text-forest-800 mb-8">Confirm Booking</h2>

            <div className="bg-cream-50 border border-forest-100/30 p-6 mb-5 space-y-4">
              {/* Services */}
              <div className="pb-3 border-b border-forest-100/30">
                <div className="font-body text-[10px] tracking-widest uppercase text-forest-400/40 mb-2">Services</div>
                {selected.services.map(svc => (
                  <div key={svc.id} className="flex justify-between items-center py-1.5">
                    <div>
                      <span className="font-body text-sm text-forest-800">{svc.name}</span>
                      <span className="font-body text-xs text-forest-400/50 ml-2">· {svc.durationMins} min</span>
                    </div>
                    <span className="font-display text-sm text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              {/* Details */}
              <div className="flex items-start gap-4 py-2">
                <User size={14} className="text-gold-600 mt-0.5" />
                <div><div className="font-body text-xs tracking-widest uppercase text-forest-400/40 mb-0.5">Stylist</div>
                  <div className="font-body text-sm text-forest-800 font-medium">{selected.staff?.user?.name}</div></div>
              </div>
              <div className="flex items-start gap-4 py-2">
                <Calendar size={14} className="text-gold-600 mt-0.5" />
                <div><div className="font-body text-xs tracking-widest uppercase text-forest-400/40 mb-0.5">Date & Time</div>
                  <div className="font-body text-sm text-forest-800 font-medium">{selected.slot ? format(new Date(selected.slot), "EEEE, dd MMM yyyy") : ""}</div>
                  <div className="font-body text-xs text-forest-400/60">{selected.slot ? format(new Date(selected.slot), "h:mm a") : ""}</div></div>
              </div>
              <div className="flex items-start gap-4 py-2">
                <Scissors size={14} className="text-gold-600 mt-0.5" />
                <div><div className="font-body text-xs tracking-widests uppercase text-forest-400/40 mb-0.5">Total Duration</div>
                  <div className="font-body text-sm text-forest-800 font-medium">{totalDuration} minutes</div></div>
              </div>
            </div>

            <textarea placeholder="Any special requests? (optional)" value={selected.notes}
              onChange={e => setSelected(s => ({ ...s, notes: e.target.value }))}
              className="field-light w-full h-20 resize-none mb-4" />

            {/* Coupon */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400/50" />
                <input type="text" placeholder="Coupon code (optional)" value={selected.couponCode}
                  onChange={e => setSelected(s => ({ ...s, couponCode: e.target.value.toUpperCase(), couponData: null }))}
                  className="field-light w-full pl-9" />
              </div>
              <button onClick={() => { setError(""); couponMutation.mutate({ code: selected.couponCode, amount: totalPrice }); }}
                disabled={!selected.couponCode || couponMutation.isPending}
                className="btn-ghost px-5 text-xs disabled:opacity-40">Apply</button>
            </div>
            {selected.couponData && (
              <div className="bg-forest-50 border border-forest-200 p-3 mb-5 text-sm font-body text-forest-800">
                ✓ Coupon applied — You save ₹{selected.couponData.discountAmount}
              </div>
            )}

            {/* Price summary */}
            <div className="border-t border-forest-100/30 pt-5 mb-5 space-y-2">
              <div className="flex justify-between font-body text-sm text-forest-400"><span>Services total</span><span>₹{totalPrice.toLocaleString("en-IN")}</span></div>
              {selected.couponData && <div className="flex justify-between font-body text-sm text-forest-400"><span>Discount</span><span className="text-forest-600">- ₹{selected.couponData.discountAmount}</span></div>}
              <div className="flex justify-between font-display text-xl text-forest-800 pt-2 border-t border-forest-100/30">
                <span>Total to pay</span><span>₹{finalPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Fix 8 — Pay at shop notice */}
            <div className="bg-cream-200 border border-gold-400/30 p-4 mb-6 flex items-start gap-3 rounded-sm">
              <QrCode size={20} className="text-gold-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-xs font-medium text-forest-800 mb-1">Pay at the salon</p>
                <p className="font-body text-xs text-forest-400/70">
                  No advance payment needed. Pay via cash or QR code when you arrive at the salon.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Back</button>
              <button
                onClick={() => { setError(""); bookMutation.mutate(); }}
                disabled={bookMutation.isPending}
                className="btn-gold flex-1 disabled:opacity-60 flex items-center justify-center gap-2">
                {bookMutation.isPending ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}