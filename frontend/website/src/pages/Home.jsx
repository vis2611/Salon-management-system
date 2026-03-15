import { useState, useEffect } from "react";

const bannerSlides = [
  {
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=85&fit=crop",
    label: "PREMIUM SALON EXPERIENCE",
    sub: "Where Beauty Meets Artistry",
  },
  {
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1800&q=85&fit=crop",
    label: "EXPERT STYLING",
    sub: "Crafted for Every Face",
  },
  {
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1800&q=85&fit=crop",
    label: "LUXURY INTERIORS",
    sub: "A Space Built for You",
  },
  {
    url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1800&q=85&fit=crop",
    label: "BRIDAL ARTISTRY",
    sub: "Your Most Beautiful Day",
  },
];

const services = [
  { id: "01", name: "Precision Cut", desc: "Tailored cuts that define your silhouette and frame your face with intention.", price: "₹799", tag: "SIGNATURE" },
  { id: "02", name: "Color & Toning", desc: "Dimensional color work using premium pigments for lasting vibrancy.", price: "₹1,499", tag: "POPULAR" },
  { id: "03", name: "Bridal Styling", desc: "Complete bridal transformation — from prep to the final pin.", price: "₹4,999", tag: "EXCLUSIVE" },
  { id: "04", name: "Keratin Therapy", desc: "Frizz-free, glossy results with salon-grade smoothing treatments.", price: "₹2,299", tag: "TRENDING" },
  { id: "05", name: "Scalp Ritual", desc: "A therapeutic scalp massage and deep conditioning treatment.", price: "₹999", tag: "WELLNESS" },
  { id: "06", name: "Face Shaping", desc: "Expert contouring blowouts and styling to elevate your features.", price: "₹1,199", tag: "NEW" },
];

const stats = [
  { value: "12+", label: "Years of Craft" },
  { value: "8K+", label: "Happy Clients" },
  { value: "4.9★", label: "Avg. Rating" },
  { value: "30+", label: "Expert Artists" },
];

const testimonials = [
  { name: "Priya M.", role: "Regular Client", text: "The bridal styling was beyond perfect. I felt like royalty — every detail was attended to with care." },
  { name: "Sneha R.", role: "Monthly Visit", text: "Best keratin treatment I've ever had. My hair has never been this smooth or manageable." },
  { name: "Aisha K.", role: "Loyal Since 2019", text: "This isn't just a salon — it's an experience. The ambiance and skill level here is unmatched." },
];

const navLinks = ["Services", "About", "Gallery", "Testimonials", "Contact"];
const servicePills = ["Precision Cut", "Color & Toning", "Bridal Styling", "Keratin Therapy", "Scalp Ritual", "Face Shaping"];
const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
const stylists = ["Any Available Artist", "Riya (Color Specialist)", "Meera (Bridal Expert)", "Arjun (Precision Cuts)", "Nisha (Keratin & Smoothing)"];
const tickerItems = ["PRECISION CUTS", "COLOR THERAPY", "BRIDAL ARTISTRY", "SCALP RITUALS", "HAIR SMOOTHING", "FACE SHAPING"];
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Generate next 8 dates
const getUpcomingDates = () => {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { date: d.getDate(), day: days[d.getDay()], month: months[d.getMonth()], full: `${d.getDate()} ${months[d.getMonth()]}` };
  });
};

// ─── BOOK NOW MODAL ───────────────────────────────────────────────────────────
function BookNowModal({ isOpen, onClose }) {
  const [activePill, setActivePill] = useState("Precision Cut");
  const [activeDate, setActiveDate] = useState(null);
  const [activeTime, setActiveTime] = useState(null);
  const [stylist, setStylist] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const upcomingDates = getUpcomingDates();

  const handleSubmit = () => {
    setConfirmed(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setConfirmed(false), 400);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,10,10,0.88);
          backdrop-filter: blur(18px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: overlayIn 0.35s ease forwards;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-box {
          background: #111010;
          border: 1px solid rgba(212,175,130,0.2);
          border-radius: 28px;
          width: 100%; max-width: 840px;
          max-height: 90vh; overflow-y: auto;
          display: grid; grid-template-columns: 1fr 1fr;
          position: relative;
          animation: modalIn 0.45s cubic-bezier(0.23,1,0.32,1) forwards;
        }
        .modal-box-success {
          grid-template-columns: 1fr !important;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-box::-webkit-scrollbar { width: 4px; }
        .modal-box::-webkit-scrollbar-thumb { background: rgba(212,175,130,0.2); border-radius: 4px; }

        .modal-left {
          padding: 44px 36px;
          border-right: 1px solid rgba(212,175,130,0.1);
          background: linear-gradient(160deg, rgba(212,175,130,0.05) 0%, transparent 60%);
          border-radius: 28px 0 0 28px;
          display: flex; flex-direction: column;
        }
        .modal-right {
          padding: 44px 36px;
          display: flex; flex-direction: column; gap: 18px;
          border-radius: 0 28px 28px 0;
        }

        .m-eyebrow {
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: #d4af82; font-weight: 600;
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .m-eyebrow::before { content: ''; display: block; width: 24px; height: 1px; background: #d4af82; }

        .m-pill {
          padding: 7px 14px; border-radius: 999px; font-size: 11px; font-weight: 500;
          cursor: pointer; transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em;
        }
        .m-pill-inactive {
          border: 1px solid rgba(240,237,232,0.1); color: rgba(240,237,232,0.5);
          background: transparent;
        }
        .m-pill-inactive:hover { border-color: rgba(212,175,130,0.4); color: #d4af82; }
        .m-pill-active {
          background: rgba(212,175,130,0.12); border: 1px solid #d4af82; color: #d4af82;
        }

        .m-input {
          width: 100%; padding: 13px 16px;
          background: rgba(240,237,232,0.04);
          border: 1px solid rgba(240,237,232,0.1); border-radius: 12px;
          color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px;
          outline: none; transition: border-color 0.25s, background 0.25s;
        }
        .m-input::placeholder { color: rgba(240,237,232,0.25); }
        .m-input:focus { border-color: rgba(212,175,130,0.5); background: rgba(212,175,130,0.04); }
        select.m-input option { background: #1a1a1a; color: #f0ede8; }

        .m-date-btn, .m-time-btn {
          border-radius: 10px; font-size: 11px; font-weight: 500;
          border: 1px solid rgba(240,237,232,0.09); color: rgba(240,237,232,0.45);
          background: transparent; cursor: pointer; text-align: center;
          transition: all 0.22s; font-family: 'DM Sans', sans-serif;
        }
        .m-date-btn { padding: 8px 4px; }
        .m-time-btn { padding: 9px 6px; }
        .m-date-btn:hover, .m-time-btn:hover { border-color: rgba(212,175,130,0.35); color: #d4af82; }
        .m-date-btn.picked, .m-time-btn.picked {
          background: rgba(212,175,130,0.12); border-color: #d4af82; color: #d4af82;
        }

        .m-close {
          position: absolute; top: 18px; right: 20px;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid rgba(240,237,232,0.12); background: transparent;
          color: rgba(240,237,232,0.45); font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s; z-index: 10;
        }
        .m-close:hover { border-color: #d4af82; color: #d4af82; }

        @keyframes spinIn {
          from { transform: scale(0) rotate(-90deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .spin-in { animation: spinIn 0.6s ease forwards; }
      `}</style>

      <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && handleClose()}>
        <div className={`modal-box ${confirmed ? "modal-box-success" : ""}`}>
          <button className="m-close" onClick={handleClose}>✕</button>

          {/* ── SUCCESS STATE ── */}
          {confirmed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 40px", gridColumn: "1 / -1", minHeight: "420px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", border: "1.5px solid #d4af82", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                <span className="spin-in" style={{ color: "#d4af82", fontSize: 28 }}>✦</span>
              </div>
              <div className="m-eyebrow" style={{ justifyContent: "center", marginBottom: 10 }}>BOOKING CONFIRMED</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 12 }}>
                You're all set, <em style={{ color: "#d4af82" }}>{name.split(" ")[0] || "gorgeous"}</em>!
              </h2>
              <p style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", fontWeight: 300, lineHeight: 1.7, maxWidth: 340, marginBottom: 32 }}>
                Your appointment for <strong style={{ color: "#d4af82" }}>{activePill}</strong> has been booked
                {activeDate ? ` on ${activeDate}` : ""}{activeTime ? ` at ${activeTime}` : ""}. We can't wait to see you ✦
              </p>
              <button
                onClick={handleClose}
                style={{ background: "#d4af82", color: "#0a0a0a", border: "none", cursor: "pointer", padding: "12px 36px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                PERFECT, CLOSE
              </button>
            </div>
          ) : (
            <>
              {/* ── LEFT PANEL ── */}
              <div className="modal-left">
                <div className="m-eyebrow">BOOK YOUR SESSION</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, lineHeight: 1.15, marginBottom: 8 }}>
                  Reserve Your<br /><em style={{ color: "#d4af82" }}>Chair.</em>
                </h2>
                <p style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", fontWeight: 300, lineHeight: 1.65, marginBottom: 28 }}>
                  Pick your service, choose a time, and let us handle the rest. Every visit begins with intention.
                </p>

                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 10 }}>Choose Service</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                  {servicePills.map((p) => (
                    <button key={p} className={`m-pill ${activePill === p ? "m-pill-active" : "m-pill-inactive"}`} onClick={() => setActivePill(p)}>{p}</button>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid rgba(212,175,130,0.1)", paddingTop: 24, marginTop: "auto" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 14 }}>WHY LUMIÈRE</div>
                  {[
                    "1-on-1 personalized consultation",
                    "Premium cruelty-free products only",
                    "Sanitized private styling stations",
                    "Expert artists with 5+ years experience",
                  ].map((perk) => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4af82", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(240,237,232,0.4)", fontWeight: 300 }}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT PANEL ── */}
              <div className="modal-right">
                {/* Name */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>Your Name</label>
                  <input className="m-input" placeholder="e.g. Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>Phone Number</label>
                  <input className="m-input" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                {/* Date picker */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>Choose Date</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
                    {upcomingDates.map((d) => (
                      <button key={d.full} className={`m-date-btn ${activeDate === d.full ? "picked" : ""}`} onClick={() => setActiveDate(d.full)}>
                        <div style={{ fontWeight: 600 }}>{d.date}</div>
                        <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{d.day}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>Preferred Time</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                    {timeSlots.map((t) => (
                      <button key={t} className={`m-time-btn ${activeTime === t ? "picked" : ""}`} onClick={() => setActiveTime(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Stylist */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>Stylist Preference</label>
                  <select className="m-input" value={stylist} onChange={(e) => setStylist(e.target.value)}>
                    {stylists.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", fontWeight: 600, marginBottom: 8 }}>
                    Special Request <span style={{ color: "rgba(240,237,232,0.25)", fontSize: 9 }}>(OPTIONAL)</span>
                  </label>
                  <textarea className="m-input" rows={2} placeholder="Any details or preferences..." value={note} onChange={(e) => setNote(e.target.value)} style={{ resize: "none", fontFamily: "'DM Sans', sans-serif" }} />
                </div>

                {/* Submit */}
                <button onClick={handleSubmit}
                  style={{ width: "100%", padding: 15, borderRadius: 14, background: "#d4af82", color: "#0a0a0a", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.3s" }}>
                  CONFIRM MY BOOKING ✦
                </button>
                <p style={{ fontSize: 10, color: "rgba(240,237,232,0.22)", textAlign: "center", letterSpacing: "0.06em", marginTop: -8 }}>
                  Free cancellation up to 24 hours before appointment
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function Hero() {
  const [hoveredService, setHoveredService] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const goToSlide = (next) => {
    if (isTransitioning || next === currentSlide) return;
    setIsTransitioning(true);
    setPrevSlide(currentSlide);
    setCurrentSlide(next);
    setTimeout(() => { setPrevSlide(null); setIsTransitioning(false); }, 950);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      goToSlide((currentSlide + 1) % bannerSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentSlide, isTransitioning]);

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  return (
    <div className="bg-[#0a0a0a] text-[#f0ede8] min-h-screen overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,500&family=Bebas+Neue&display=swap');

        .hf { font-family: 'Playfair Display', serif; }
        .df { font-family: 'Bebas Neue', sans-serif; }

        .grid-card {
          border: 1px solid rgba(240,237,232,0.08);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .grid-card:hover {
          border-color: rgba(212,175,130,0.4);
          background: rgba(212,175,130,0.03);
        }
        .tp {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: 600;
        }
        .ticker-track {
          display: flex;
          animation: tickerMove 18s linear infinite;
          white-space: nowrap;
        }
        @keyframes tickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .fade-in { animation: fadeUp 0.8s ease forwards; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .s1 { animation-delay: 0.1s; opacity: 0; }
        .s2 { animation-delay: 0.25s; opacity: 0; }
        .s3 { animation-delay: 0.4s; opacity: 0; }
        .s4 { animation-delay: 0.55s; opacity: 0; }

        .sl-enter { animation: slIn 0.95s cubic-bezier(0.4,0,0.2,1) forwards; }
        .sl-exit  { animation: slOut 0.95s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes slIn  { from { opacity:0; transform:scale(1.07); } to { opacity:1; transform:scale(1); } }
        @keyframes slOut { from { opacity:1; transform:scale(1);    } to { opacity:0; transform:scale(0.96); } }
        .kb { animation: kenBurns 8s ease-in-out infinite alternate; }
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.07); } }

        .lbl-anim { animation: lblUp 0.65s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes lblUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .btn-p {
          background: #d4af82; color: #0a0a0a;
          transition: all 0.3s ease;
          font-weight: 600; letter-spacing: 0.08em; font-size: 12px;
        }
        .btn-p:hover { background: #f0ede8; transform: translateY(-2px); }
        .btn-o {
          border: 1px solid rgba(240,237,232,0.3); color: #f0ede8;
          transition: all 0.3s ease;
          font-weight: 500; letter-spacing: 0.08em; font-size: 12px;
        }
        .btn-o:hover { border-color: #d4af82; color: #d4af82; }

        .gold { color: #d4af82; }

        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .dotgrid {
          background-image: radial-gradient(circle, rgba(212,175,130,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .line-accent::after {
          content: ''; display: block;
          width: 40px; height: 2px;
          background: #d4af82; margin-top: 12px;
        }
        .nav-lnk {
          font-size: 12px; letter-spacing: 0.12em;
          font-weight: 500; text-transform: uppercase;
          color: rgba(240,237,232,0.6);
          transition: color 0.3s; cursor: pointer;
        }
        .nav-lnk:hover { color: #d4af82; }

        .hero-bg-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(100px,18vw,220px);
          line-height: 0.85;
          color: rgba(240,237,232,0.03);
          position: absolute; right: -20px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none; user-select: none; z-index: 4;
        }

        .dot-ctrl {
          width: 28px; height: 3px;
          background: rgba(240,237,232,0.22);
          border-radius: 999px; cursor: pointer;
          transition: all 0.3s ease;
          border: none; outline: none;
        }
        .dot-ctrl.on { background: #d4af82; width: 48px; }
        .arr-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(240,237,232,0.15);
          color: rgba(240,237,232,0.4);
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.3s;
        }
        .arr-btn:hover { border-color: #d4af82; color: #d4af82; }
      `}</style>

      {/* ── BOOK NOW MODAL ── */}
      <BookNowModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ─── Navbar ─── */}
      {/* <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,10,0.87)', borderBottom: '1px solid rgba(240,237,232,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-[#d4af82] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#d4af82]" />
          </div>
          <span className="df text-xl tracking-widest">SALON</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map(l => <span key={l} className="nav-lnk">{l}</span>)}
        </div>
        <button className="btn-p px-6 py-2.5 rounded-full hidden md:block" onClick={() => setModalOpen(true)}>BOOK NOW</button>
      </nav> */}

      {/* ─── Hero / Sliding Banner ─── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 px-8 pt-32 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {bannerSlides.map((slide, i) => {
            const isActive = i === currentSlide;
            const isExiting = i === prevSlide;
            if (!isActive && !isExiting) return null;
            return (
              <div key={i} className={`absolute inset-0 ${isActive ? 'sl-enter' : 'sl-exit'}`} style={{ zIndex: isActive ? 2 : 1 }}>
                <img src={slide.url} alt={slide.label}
                  className={`w-full h-full object-cover object-center ${isActive ? 'kb' : ''}`}
                  style={{ filter: 'brightness(0.28) saturate(0.7)' }} />
              </div>
            );
          })}
          <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, #0a0a0a 26%, rgba(10,10,10,0.52) 58%, rgba(10,10,10,0.22) 100%)' }} />
          <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, #0a0a0a 0%, transparent 52%)' }} />
        </div>

        <div className="dotgrid absolute inset-0 opacity-20 z-[3]" />
        <div className="noise absolute inset-0 z-[3]" />
        <div className="absolute top-0 left-1/2 w-px h-40 bg-[#d4af82] opacity-20 z-[4]" />
        <div className="absolute bottom-0 right-32 w-px h-32 bg-[#d4af82] opacity-15 z-[4]" />
        <div className="hero-bg-num">0{currentSlide + 1}</div>

        <div className="relative max-w-7xl mx-auto w-full" style={{ zIndex: 5 }}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-end">
            <div className="md:col-span-7">
              <div className="flex items-center gap-3 mb-7 fade-in s1">
                <div className="h-px w-12 bg-[#d4af82]" />
                <span key={`lbl-${currentSlide}`} className="tp text-[#d4af82] tracking-[0.2em] lbl-anim">
                  {bannerSlides[currentSlide].label}
                </span>
              </div>
              <h1 className="hf text-[clamp(46px,7vw,94px)] leading-none mb-7 fade-in s2">
                Where Beauty<br />
                <em className="text-[#d4af82]">Meets Artistry.</em>
              </h1>
              <p key={`sub-${currentSlide}`}
                className="text-[rgba(240,237,232,0.5)] text-base leading-relaxed max-w-lg mb-10 lbl-anim"
                style={{ fontWeight: 300 }}>
                {bannerSlides[currentSlide].sub} — A curated studio where every visit is a ritual. Expert hands, premium products, designed for you.
              </p>
              <div className="flex items-center gap-4 fade-in s4 mb-10">
                <button className="btn-p px-8 py-4 rounded-full" onClick={() => setModalOpen(true)}>BOOK A SESSION</button>
                <button className="btn-o px-8 py-4 rounded-full">EXPLORE SERVICES</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {bannerSlides.map((_, i) => (
                    <button key={i} onClick={() => goToSlide(i)} className={`dot-ctrl ${i === currentSlide ? 'on' : ''}`} />
                  ))}
                </div>
                <span className="df text-sm tracking-widest text-[rgba(240,237,232,0.3)]">
                  0{currentSlide + 1}&nbsp;/&nbsp;0{bannerSlides.length}
                </span>
                <button className="arr-btn" onClick={() => goToSlide((currentSlide - 1 + bannerSlides.length) % bannerSlides.length)}>←</button>
                <button className="arr-btn" onClick={() => goToSlide((currentSlide + 1) % bannerSlides.length)}>→</button>
              </div>
            </div>

            <div className="md:col-span-5 md:pl-12 mt-16 md:mt-0 fade-in s3">
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <div key={i} className="grid-card rounded-2xl p-6 bg-[rgba(240,237,232,0.02)]" style={{ backdropFilter: 'blur(14px)' }}>
                    <div className="df text-4xl gold mb-1">{s.value}</div>
                    <div className="text-xs tracking-widest text-[rgba(240,237,232,0.4)] uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25" style={{ zIndex: 5 }}>
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-[#f0ede8] animate-bounce" />
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <div className="py-4 overflow-hidden border-y border-[rgba(240,237,232,0.06)]" style={{ background: 'rgba(212,175,130,0.04)' }}>
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="df text-2xl tracking-widest mx-10 text-[#d4af82] opacity-60">
              {item} <span className="text-[rgba(240,237,232,0.2)]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── Gallery Strip ─── */}
      <section className="w-full px-8 pt-16 pb-16" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#d4af82]" />
              <span className="tp text-[#d4af82] tracking-[0.2em]">OUR STUDIO</span>
            </div>
            <button className="btn-o px-6 py-2 rounded-full text-xs">VIEW ALL</button>
          </div>
          <div className="grid grid-cols-12 gap-3" style={{ height: '420px' }}>
            <div className="col-span-5 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80&fit=crop" alt="Styling"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: 'brightness(0.75) saturate(0.85)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)' }} />
              <div className="absolute bottom-5 left-5"><span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">STYLING</span></div>
            </div>
            <div className="col-span-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
              <div className="flex-1 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
                <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=700&q=80&fit=crop" alt="Color"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: 'brightness(0.7) saturate(0.8)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4"><span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">COLORING</span></div>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
                <img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=80&fit=crop" alt="Bridal"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: 'brightness(0.7) saturate(0.8)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4"><span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">BRIDAL</span></div>
              </div>
            </div>
            <div className="col-span-3 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
              <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80&fit=crop" alt="Interior"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: 'brightness(0.65) saturate(0.8)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)' }} />
              <div className="absolute bottom-5 left-4"><span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">INTERIOR</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section className="px-8 py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-[#d4af82]" />
              <span className="tp text-[#d4af82] tracking-[0.2em]">OUR CRAFT</span>
            </div>
            <h2 className="hf text-[clamp(36px,5vw,64px)] leading-tight line-accent">
              Services Built<br /><em className="gold">for Every You.</em>
            </h2>
          </div>
          <div className="md:col-span-7 flex items-end">
            <p className="text-[rgba(240,237,232,0.45)] text-base leading-relaxed" style={{ fontWeight: 300 }}>
              From quick touch-ups to full-day transformations — every service is crafted with precision, premium products, and genuine care.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc, i) => (
            <div key={svc.id}
              className="grid-card rounded-2xl p-8 cursor-pointer relative overflow-hidden"
              style={{ background: hoveredService === i ? 'rgba(212,175,130,0.04)' : 'rgba(240,237,232,0.015)' }}
              onMouseEnter={() => setHoveredService(i)}
              onMouseLeave={() => setHoveredService(null)}
              onClick={() => setModalOpen(true)}>
              <div className="flex items-start justify-between mb-6">
                <span className="df text-5xl text-[rgba(240,237,232,0.08)]">{svc.id}</span>
                <span className="tp bg-[rgba(212,175,130,0.1)] text-[#d4af82] px-3 py-1 rounded-full">{svc.tag}</span>
              </div>
              <h3 className="hf text-2xl mb-3">{svc.name}</h3>
              <p className="text-[rgba(240,237,232,0.4)] text-sm leading-relaxed mb-6" style={{ fontWeight: 300 }}>{svc.desc}</p>
              <div className="flex items-center justify-between">
                <span className="df text-2xl gold">{svc.price}</span>
                <div className="w-8 h-8 rounded-full border border-[rgba(212,175,130,0.3)] flex items-center justify-center text-[#d4af82] text-xs">→</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── About / Philosophy ─── */}
      <section className="px-8 py-20 border-y border-[rgba(240,237,232,0.06)]" style={{ background: 'rgba(240,237,232,0.015)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 grid-card rounded-2xl p-12 bg-[#0f0f0f] relative overflow-hidden">
            <div className="dotgrid absolute inset-0" />
            <div className="relative z-10">
              <span className="tp text-[#d4af82] tracking-[0.2em] block mb-8">OUR PHILOSOPHY</span>
              <h2 className="hf text-[clamp(32px,4vw,56px)] leading-tight mb-8">
                Beauty is a language.<br /><em className="gold">We help you speak it.</em>
              </h2>
              <p className="text-[rgba(240,237,232,0.45)] leading-relaxed mb-8" style={{ fontWeight: 300 }}>
                Lumière was founded on the belief that great hair is not just technique — it's understanding. We study your lifestyle, your goals, and your face before we pick up the scissors.
              </p>
              <button className="btn-o px-8 py-3 rounded-full text-xs">MEET THE TEAM</button>
            </div>
          </div>
          <div className="md:col-span-5 flex flex-col gap-4">
            {[
              { icon: "✦", title: "Personalized Consultation", desc: "Every visit begins with a 1-on-1 consultation. No rushed decisions." },
              { icon: "◈", title: "Premium Product Bar", desc: "We use only globally certified, cruelty-free hair & skincare products." },
              { icon: "⬡", title: "Hygienic & Private Stations", desc: "Each styling station is sanitized between sessions. Your safety matters." },
            ].map((f, i) => (
              <div key={i} className="grid-card rounded-2xl p-6 bg-[rgba(240,237,232,0.015)] flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl border border-[rgba(212,175,130,0.2)] flex items-center justify-center gold text-lg flex-shrink-0">{f.icon}</div>
                <div>
                  <div className="font-semibold text-sm mb-1">{f.title}</div>
                  <div className="text-[rgba(240,237,232,0.4)] text-xs leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="px-8 py-28 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-[#d4af82]" />
          <span className="tp text-[#d4af82] tracking-[0.2em]">TESTIMONIALS</span>
        </div>
        <h2 className="hf text-[clamp(32px,5vw,60px)] leading-tight mb-16">
          Stories from <em className="gold">our clients.</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="grid-card rounded-2xl p-8 bg-[rgba(240,237,232,0.015)]">
              <div className="df text-5xl gold mb-6 opacity-40">"</div>
              <p className="text-[rgba(240,237,232,0.65)] text-sm leading-relaxed mb-8" style={{ fontWeight: 300 }}>{t.text}</p>
              <div className="flex items-center gap-3 pt-6 border-t border-[rgba(240,237,232,0.06)]">
                <div className="w-10 h-10 rounded-full bg-[rgba(212,175,130,0.15)] flex items-center justify-center text-[#d4af82] font-bold text-sm">{t.name[0]}</div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[10px] tracking-widest text-[rgba(240,237,232,0.3)] uppercase">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-8 mb-16 rounded-3xl overflow-hidden relative"
        style={{ background: '#0f0f0d', border: '1px solid rgba(212,175,130,0.15)' }}>
        <div className="dotgrid absolute inset-0" />
        <div className="relative z-10 py-20 px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="tp text-[#d4af82] tracking-[0.2em] mb-4 block">READY FOR YOUR GLOW UP?</div>
            <h2 className="hf text-[clamp(32px,4vw,56px)] leading-tight">
              Book your next<br /><em className="gold">transformation.</em>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <button className="btn-p px-10 py-4 rounded-full" onClick={() => setModalOpen(true)}>BOOK APPOINTMENT</button>
            <button className="btn-o px-10 py-4 rounded-full">CALL US NOW</button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
       {/* <footer className="px-8 pb-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-[rgba(240,237,232,0.06)] mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full border border-[#d4af82] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4af82]" />
              </div>
              <span className="df text-lg tracking-widest">SALON</span>
            </div>
            <p className="text-[rgba(240,237,232,0.3)] text-xs leading-relaxed">Premium salon services crafted with care, creativity, and intention.</p>
          </div>
          {[
            { title: "Services", links: ["Haircut", "Color", "Bridal", "Keratin", "Scalp Ritual"] },
            { title: "Studio", links: ["About Us", "Meet the Team", "Gallery", "Press"] },
            { title: "Contact", links: ["+91 98765 43210", "hello@lumiere.in", "Aurangabad, MH", "Mon–Sat 10–8 PM"] },
          ].map((col, i) => (
            <div key={i}>
              <div className="text-[10px] tracking-[0.2em] text-[#d4af82] uppercase mb-5 font-semibold">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j} className="text-[rgba(240,237,232,0.35)] text-xs hover:text-[#d4af82] cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[rgba(240,237,232,0.05)]">
          <span className="text-[rgba(240,237,232,0.2)] text-xs">© 2025 Lumière Salon. All rights reserved.</span>
          <div className="flex gap-6">
            {["Instagram", "Facebook", "YouTube"].map(s => (
              <span key={s} className="text-[rgba(240,237,232,0.2)] text-xs hover:text-[#d4af82] cursor-pointer transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </footer>  */}
    </div>
  );
}