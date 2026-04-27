import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { servicesAPI, staffAPI, appointmentsAPI, paymentsAPI, couponsAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, ChevronRight, Calendar, User, Scissors, CreditCard, Tag } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";

const STEPS = ["Service", "Staff & Time", "Review & Pay"];

export default function BookingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({ service: null, staff: null, slot: null, date: startOfToday(), couponCode: "", couponData: null, notes: "" });
  const [booked, setBooked] = useState(null);
  const [error, setError] = useState("");

  const { data: services } = useQuery({ queryKey: ["services-all"], queryFn: () => servicesAPI.list({ limit: 50 }) });
  const { data: staffData } = useQuery({ queryKey: ["staff-all"], queryFn: staffAPI.list });

  // Availability query — fires when staff + date + service selected
  const { data: availability, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", selected.staff?.id, selected.date?.toISOString(), selected.service?.id],
    queryFn: () => appointmentsAPI.availability({
      staffId: selected.staff.id,
      serviceId: selected.service.id,
      date: format(selected.date, "yyyy-MM-dd"),
    }),
    enabled: !!selected.staff && !!selected.date && !!selected.service,
  });

  const slots = availability?.data?.data?.slots || [];

  // Validate coupon
  const couponMutation = useMutation({
    mutationFn: (d) => couponsAPI.validate(d),
    onSuccess: ({ data }) => setSelected((s) => ({ ...s, couponData: data.data })),
    onError: (e) => setError(e.response?.data?.message || "Invalid coupon"),
  });

  // Create appointment
  const bookMutation = useMutation({
    mutationFn: (d) => appointmentsAPI.create(d),
    onSuccess: async ({ data }) => {
      const appt = data.data;
      // If price > 0 initiate Razorpay
      if (Number(appt.priceAtBooking) > 0) {
        const orderRes = await paymentsAPI.createOrder(appt.id);
        const { orderId, amount, keyId } = orderRes.data.data;
        openRazorpay({ orderId, amount, keyId, appt });
      } else {
        setBooked(appt);
      }
    },
    onError: (e) => setError(e.response?.data?.message || "Booking failed. Please try again."),
  });

  const verifyMutation = useMutation({
    mutationFn: (d) => paymentsAPI.verify(d),
    onSuccess: (_, vars) => setBooked({ id: vars.appointmentId }),
  });

  function openRazorpay({ orderId, amount, keyId, appt }) {
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency: "INR",
      name: "Lumière Salon",
      description: selected.service?.name,
      order_id: orderId,
      handler: (response) => {
        verifyMutation.mutate({
          appointmentId: appt.id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      prefill: { name: user?.name, email: user?.email },
      theme: { color: "#C9A84C" },
    });
    rzp.open();
  }

  const handleBook = () => {
    setError("");
    bookMutation.mutate({
      serviceId: selected.service.id,
      staffId: selected.staff.id,
      scheduledAt: selected.slot,
      notes: selected.notes,
      couponCode: selected.couponData ? selected.couponCode : undefined,
    });
  };

  const finalPrice = selected.couponData
    ? selected.couponData.finalAmount
    : selected.service ? Number(selected.service.price) : 0;

  if (booked) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md animate-fade-up">
            <CheckCircle size={56} className="text-forest-400 mx-auto mb-6" />
            <h2 className="font-display text-4xl text-forest-800 mb-3">Booking Confirmed!</h2>
            <p className="font-body text-sm text-forest-400/70 leading-relaxed mb-8">
              Your appointment has been confirmed. You'll receive a confirmation email shortly.
            </p>
            <div className="bg-cream-200 border border-forest-100/30 p-6 text-left mb-8">
              {selected.service && <p className="font-body text-sm text-forest-800 mb-1"><strong>Service:</strong> {selected.service.name}</p>}
              {selected.staff && <p className="font-body text-sm text-forest-800 mb-1"><strong>Stylist:</strong> {selected.staff.user?.name}</p>}
              {selected.slot && <p className="font-body text-sm text-forest-800"><strong>Time:</strong> {format(new Date(selected.slot), "dd MMM yyyy, h:mm a")}</p>}
            </div>
            <a href="/profile" className="btn-gold inline-block">View My Appointments</a>
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-14 mt-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-xs font-body tracking-widest uppercase transition-all ${i === step ? "text-gold-600" : i < step ? "text-forest-400" : "text-forest-400/30"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all ${i === step ? "bg-[#d97706] border-gold-600 text-cream-50" : i < step ? "bg-forest-400 border-forest-400 text-cream-50" : "border-forest-200 text-forest-200"}`}>
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-forest-200" />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-5 py-3 mb-6 rounded-sm">{error}</div>}

        {/* ── Step 0: Choose Service ─── */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl text-forest-800 mb-8">Choose a Service</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(services?.data?.data || []).map((svc) => (
                <button key={svc.id} onClick={() => { setSelected((s) => ({ ...s, service: svc, staff: null, slot: null })); setStep(1); }}
                  className={`text-left p-6 border transition-all duration-300 hover:border-gold-600 hover:shadow-md ${selected.service?.id === svc.id ? "border-gold-600 bg-gold-100/30" : "border-forest-100/30 bg-cream-50"}`}>
                  <div className="font-display text-lg text-forest-800 mb-1">{svc.name}</div>
                  <div className="font-body text-xs text-forest-400/60 mb-4 line-clamp-2">{svc.description}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xl text-forest-800">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                    <span className="font-body text-xs text-gold-600">{svc.durationMins} min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Staff & Time ─── */}
        {step === 1 && (
          <div className="animate-fade-up grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-3xl text-forest-800 mb-6">Choose Your Stylist</h2>
              <div className="space-y-3">
                {(staffData?.data?.data || [])
                  .filter((m) => m.services?.some((ss) => ss.serviceId === selected.service?.id))
                  .map((member) => (
                  <button key={member.id} onClick={() => setSelected((s) => ({ ...s, staff: member, slot: null }))}
                    className={`w-full flex items-center gap-4 p-4 border transition-all ${selected.staff?.id === member.id ? "border-gold-600 bg-gold-100/20" : "border-forest-100/30 bg-cream-50 hover:border-gold-400"}`}>
                    <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.user?.avatarUrl
                        ? <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                        : <span className="font-display text-xl text-forest-400">{member.user?.name?.[0]}</span>
                      }
                    </div>
                    <div className="text-left">
                      <div className="font-body text-sm font-medium text-forest-800">{member.user?.name}</div>
                      <div className="font-body text-xs text-gold-600">{member.specialization}</div>
                    </div>
                    {member.avgRating && (
                      <div className="ml-auto font-mono text-xs text-forest-400">★ {member.avgRating}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl text-forest-800 mb-6">Pick a Date & Time</h2>
              {/* Date picker - simple 7-day strip */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[...Array(14)].map((_, i) => {
                  const d = addDays(startOfToday(), i);
                  return (
                    <button key={i} onClick={() => setSelected((s) => ({ ...s, date: d, slot: null }))}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 border text-xs font-body transition-all ${format(selected.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd") ? "border-gold-600 bg-[#d97706] text-cream-50" : "border-forest-100/30 bg-cream-50 text-forest-800 hover:border-gold-400"}`}>
                      <span className="uppercase text-[9px] tracking-widest">{format(d, "EEE")}</span>
                      <span className="text-lg font-display">{format(d, "d")}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {selected.staff && selected.service ? (
                loadingSlots ? (
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(8)].map((_, i) => <div key={i} className="w-20 h-9 bg-cream-200 animate-pulse rounded-sm" />)}
                  </div>
                ) : slots.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {slots.map((slot) => (
                      <button key={slot} onClick={() => setSelected((s) => ({ ...s, slot }))}
                        className={`px-3 py-2 border text-xs font-body transition-all ${selected.slot === slot ? "border-gold-600 bg-[#d97706] text-cream-50" : "border-forest-100/30 bg-cream-50 text-forest-800 hover:border-gold-400"}`}>
                        {format(new Date(slot), "h:mm a")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-forest-400/60">No available slots for this date. Please try another day.</p>
                )
              ) : (
                <p className="font-body text-sm text-forest-400/60 italic">Select a stylist to see available times.</p>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1">← Back</button>
                <button onClick={() => setStep(2)} disabled={!selected.staff || !selected.slot}
                  className="btn-gold flex-1 disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Review & Pay ─── */}
        {step === 2 && (
          <div className="animate-fade-up max-w-xl mx-auto">
            <h2 className="font-display text-3xl text-forest-800 mb-8">Confirm Booking</h2>

            <div className="bg-cream-50 border border-forest-100/30 p-8 mb-6 space-y-4">
              <DetailRow icon={<Scissors size={14} />} label="Service" value={selected.service?.name} sub={`${selected.service?.durationMins} min`} />
              <DetailRow icon={<User size={14} />} label="Stylist" value={selected.staff?.user?.name} sub={selected.staff?.specialization} />
              <DetailRow icon={<Calendar size={14} />} label="Date & Time"
                value={selected.slot ? format(new Date(selected.slot), "EEEE, d MMMM yyyy") : ""}
                sub={selected.slot ? format(new Date(selected.slot), "h:mm a") : ""} />
            </div>

            {/* Notes */}
            <textarea placeholder="Any special requests? (optional)"
              value={selected.notes} onChange={(e) => setSelected((s) => ({ ...s, notes: e.target.value }))}
              className="field-light w-full h-20 resize-none mb-4" />

            {/* Coupon */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400/50" />
                <input type="text" placeholder="Coupon code" value={selected.couponCode}
                  onChange={(e) => setSelected((s) => ({ ...s, couponCode: e.target.value.toUpperCase(), couponData: null }))}
                  className="field-light w-full pl-9" />
              </div>
              <button onClick={() => couponMutation.mutate({ code: selected.couponCode, amount: Number(selected.service?.price) })}
                disabled={!selected.couponCode || couponMutation.isPending}
                className="btn-ghost px-5 text-xs disabled:opacity-40">Apply</button>
            </div>

            {selected.couponData && (
              <div className="bg-forest-50 border border-forest-200 p-3 mb-6 text-sm font-body text-forest-800">
                ✓ Coupon applied — You save ₹{selected.couponData.discountAmount}
              </div>
            )}

            {/* Price summary */}
            <div className="border-t border-forest-100/30 pt-6 mb-8 space-y-2">
              <div className="flex justify-between font-body text-sm text-forest-400"><span>Service price</span><span>₹{Number(selected.service?.price).toLocaleString("en-IN")}</span></div>
              {selected.couponData && <div className="flex justify-between font-body text-sm text-forest-400"><span>Discount</span><span className="text-forest-600">- ₹{selected.couponData.discountAmount}</span></div>}
              <div className="flex justify-between font-display text-xl text-forest-800 pt-2 border-t border-forest-100/30">
                <span>Total</span><span>₹{finalPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Back</button>
              <button onClick={handleBook} disabled={bookMutation.isPending || verifyMutation.isPending}
                className="btn-gold flex-1 disabled:opacity-60 flex items-center justify-center gap-2">
                <CreditCard size={14} />
                {bookMutation.isPending ? "Processing..." : "Pay & Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function DetailRow({ icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-forest-100/30 last:border-0">
      <div className="text-gold-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="font-body text-xs tracking-widest uppercase text-forest-400/50 mb-0.5">{label}</div>
        <div className="font-body text-sm text-forest-800 font-medium">{value}</div>
        {sub && <div className="font-body text-xs text-forest-400/60">{sub}</div>}
      </div>
    </div>
  );
}