import { useState, useEffect, useRef } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const categories = ["All", "Hair", "Color", "Bridal", "Skin", "Wellness"];

const allServices = [
  {
    id: "01", category: "Hair", tag: "SIGNATURE", name: "Precision Cut",
    desc: "A meticulous cut shaped around your bone structure, lifestyle, and vision. Every snip is intentional.",
    price: "₹799", duration: "45 min", featured: false,
    img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&fit=crop",
    includes: ["Consultation", "Wash & Blow-dry", "Style Finish"],
  },
  {
    id: "02", category: "Color", tag: "POPULAR", name: "Color & Toning",
    desc: "Dimensional color crafted with premium pigments — from bold transformations to seamless root blends.",
    price: "₹1,499", duration: "90 min", featured: true,
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop",
    includes: ["Color Consultation", "Pigment Mix", "Toning", "Blow-dry"],
  },
  {
    id: "03", category: "Bridal", tag: "EXCLUSIVE", name: "Bridal Styling",
    desc: "Your most important day, elevated. Full-day bridal artistry from prep to the final pin.",
    price: "₹4,999", duration: "4 hrs", featured: true,
    img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop",
    includes: ["Trial Session", "Makeup", "Draping Help", "Touch-up Kit"],
  },
  {
    id: "04", category: "Hair", tag: "TRENDING", name: "Keratin Therapy",
    desc: "Frizz-free, glossy, smooth results that last up to 5 months. Salon-grade smoothing ritual.",
    price: "₹2,299", duration: "2 hrs", featured: false,
    img: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80&fit=crop",
    includes: ["Deep Wash", "Keratin Application", "Blow-dry", "Serum Finish"],
  },
  {
    id: "05", category: "Wellness", tag: "WELLNESS", name: "Scalp Ritual",
    desc: "A deeply therapeutic experience — pressure-point scalp massage paired with deep conditioning.",
    price: "₹999", duration: "60 min", featured: false,
    img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80&fit=crop",
    includes: ["Scalp Analysis", "Oil Infusion", "Massage", "Steam Treatment"],
  },
  {
    id: "06", category: "Skin", tag: "NEW", name: "Face Contouring Blowout",
    desc: "Expert contouring and blowout styling crafted to elevate your natural features.",
    price: "₹1,199", duration: "50 min", featured: false,
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop",
    includes: ["Face Analysis", "Contouring", "Style Set", "Finishing Spray"],
  },
  {
    id: "07", category: "Color", tag: "PREMIUM", name: "Balayage & Highlights",
    desc: "Sun-kissed, natural-looking dimension. Hand-painted highlights for lived-in luminosity.",
    price: "₹2,899", duration: "2.5 hrs", featured: false,
    img: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop",
    includes: ["Foiling", "Toning", "Bond Treatment", "Blow-dry"],
  },
  {
    id: "08", category: "Bridal", tag: "PACKAGE", name: "Pre-Bridal Ritual",
    desc: "A luxurious 3-session transformation package to prep your skin and hair for the big day.",
    price: "₹8,999", duration: "3 sessions", featured: false,
    img: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80&fit=crop",
    includes: ["Facial", "Hair Spa", "Waxing", "Nail Care"],
  },
  {
    id: "09", category: "Skin", tag: "LUXURY", name: "Gold Facial",
    desc: "A premium 24K gold-infused facial treatment that firms, brightens, and revitalizes your skin.",
    price: "₹1,799", duration: "75 min", featured: false,
    img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop",
    includes: ["Cleanse", "Exfoliation", "Gold Mask", "Serum & Moisturizer"],
  },
];

const navLinks = ["Services", "About", "Gallery", "Testimonials", "Contact"];

const stats = [
  { value: "30+", label: "Services" },
  { value: "8K+", label: "Clients Served" },
  { value: "4.9★", label: "Avg Rating" },
  { value: "12+", label: "Years of Craft" },
];

// ─── ANIMATED BACKGROUND CANVAS ──────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", resize);

    // Floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 80 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      opacity: 0.04 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
    }));

    // Grid lines
    const gridSpacing = 60;

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(212,175,130,0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Intersection dots
      ctx.fillStyle = "rgba(212,175,130,0.08)";
      for (let x = 0; x < W; x += gridSpacing) {
        for (let y = 0; y < H; y += gridSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Orbs
      orbs.forEach((o) => {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const pulse = o.opacity + Math.sin(t * 0.001 + o.phase) * 0.02;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `rgba(212,175,130,${pulse})`);
        grad.addColorStop(1, "rgba(212,175,130,0)");
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}
    />
  );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard({ svc, index, onBook }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), index * 80); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(212,175,130,0.05)" : "rgba(240,237,232,0.02)",
        border: `1px solid ${hovered ? "rgba(212,175,130,0.35)" : "rgba(240,237,232,0.08)"}`,
        borderRadius: 20, overflow: "hidden", cursor: "pointer",
        transition: "all 0.45s cubic-bezier(0.23,1,0.32,1)",
        transform: visible ? "translateY(0)" : "translateY(28px)",
        opacity: visible ? 1 : 0,
        position: "relative",
      }}
    >
      {/* Featured badge */}
      {svc.featured && (
        <div style={{
          position: "absolute", top: 14, left: 14, zIndex: 3,
          background: "#d4af82", color: "#0a0a0a",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
          padding: "4px 10px", borderRadius: 999, textTransform: "uppercase",
        }}>FEATURED</div>
      )}

      {/* Image */}
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img
          src={svc.img} alt={svc.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.65) saturate(0.7)",
            transform: hovered ? "scale(1.07)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.7) 0%, transparent 60%)" }} />
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          background: "rgba(212,175,130,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(212,175,130,0.25)",
          borderRadius: 999, padding: "4px 12px",
          fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", color: "#d4af82", textTransform: "uppercase",
        }}>{svc.tag}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "22px 22px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: "0.12em", color: "rgba(212,175,130,0.5)" }}>{svc.id}</span>
          <span style={{ fontSize: 10, color: "rgba(240,237,232,0.3)", letterSpacing: "0.1em" }}>{svc.duration}</span>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 8, color: "#f0ede8" }}>{svc.name}</h3>
        <p style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", lineHeight: 1.65, fontWeight: 300, marginBottom: 16 }}>{svc.desc}</p>

        {/* Includes */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {svc.includes.map((inc) => (
            <span key={inc} style={{
              fontSize: 10, padding: "4px 10px", borderRadius: 999,
              border: "1px solid rgba(240,237,232,0.1)", color: "rgba(240,237,232,0.35)",
              letterSpacing: "0.06em",
            }}>{inc}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid rgba(240,237,232,0.06)" }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#d4af82" }}>{svc.price}</span>
          <button
            onClick={() => onBook(svc)}
            style={{
              background: hovered ? "#d4af82" : "transparent",
              color: hovered ? "#0a0a0a" : "#d4af82",
              border: "1px solid rgba(212,175,130,0.4)",
              borderRadius: 999, padding: "8px 18px",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.3s", fontFamily: "'DM Sans',sans-serif",
            }}
          >Book Now →</button>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURED ROW CARD ────────────────────────────────────────────────────────
function FeaturedCard({ svc, onBook }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: hovered ? "rgba(212,175,130,0.05)" : "rgba(240,237,232,0.02)",
        border: `1px solid ${hovered ? "rgba(212,175,130,0.35)" : "rgba(240,237,232,0.08)"}`,
        borderRadius: 24, overflow: "hidden", cursor: "pointer",
        transition: "all 0.45s cubic-bezier(0.23,1,0.32,1)",
        transform: visible ? "translateY(0)" : "translateY(28px)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ position: "relative", minHeight: 280 }}>
        <img src={svc.img} alt={svc.name} style={{
          width: "100%", height: "100%", objectFit: "cover",
          filter: "brightness(0.55) saturate(0.7)",
          transform: hovered ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0) 60%, rgba(10,10,10,0.8) 100%)" }} />
        <div style={{
          position: "absolute", top: 18, left: 18,
          background: "#d4af82", color: "#0a0a0a",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", padding: "5px 12px", borderRadius: 999, textTransform: "uppercase",
        }}>FEATURED</div>
        <div style={{
          position: "absolute", bottom: 18, left: 18,
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, color: "rgba(240,237,232,0.07)", lineHeight: 1,
        }}>{svc.id}</div>
      </div>
      <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#d4af82", fontWeight: 600, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 1, background: "#d4af82" }} />{svc.tag}
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, marginBottom: 12, color: "#f0ede8", lineHeight: 1.15 }}>{svc.name}</h3>
        <p style={{ fontSize: 13, color: "rgba(240,237,232,0.45)", lineHeight: 1.7, fontWeight: 300, marginBottom: 22 }}>{svc.desc}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
          {svc.includes.map((inc) => (
            <span key={inc} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(240,237,232,0.1)", color: "rgba(240,237,232,0.35)", letterSpacing: "0.06em" }}>{inc}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#d4af82" }}>{svc.price}</span>
          <span style={{ fontSize: 11, color: "rgba(240,237,232,0.3)", letterSpacing: "0.1em" }}>{svc.duration}</span>
        </div>
        <button
          onClick={() => onBook(svc)}
          style={{
            marginTop: 20, width: "fit-content",
            background: hovered ? "#d4af82" : "transparent",
            color: hovered ? "#0a0a0a" : "#d4af82",
            border: "1px solid rgba(212,175,130,0.4)",
            borderRadius: 999, padding: "11px 28px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.3s", fontFamily: "'DM Sans',sans-serif",
          }}>Book This Service →</button>
      </div>
    </div>
  );
}

// ─── BOOKING MINI-MODAL ───────────────────────────────────────────────────────
function BookModal({ service, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  if (!service) return null;

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: "rgba(240,237,232,0.04)",
    border: "1px solid rgba(240,237,232,0.1)", borderRadius: 12,
    color: "#f0ede8", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
    outline: "none",
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,10,0.88)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "fadeIn 0.3s ease forwards",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(24px) scale(0.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}`}</style>
      <div style={{
        background: "#111010", border: "1px solid rgba(212,175,130,0.2)",
        borderRadius: 24, width: "100%", maxWidth: 480, padding: "40px 36px",
        position: "relative", animation: "slideUp 0.4s cubic-bezier(0.23,1,0.32,1) forwards",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(240,237,232,0.12)", background: "transparent", color: "rgba(240,237,232,0.4)", cursor: "pointer", fontSize: 15 }}>✕</button>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1.5px solid #d4af82", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22, color: "#d4af82" }}>✦</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, marginBottom: 10, color: "#f0ede8" }}>You're all set, <em style={{ color: "#d4af82" }}>{name.split(" ")[0] || "gorgeous"}</em>!</h3>
            <p style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", lineHeight: 1.7, marginBottom: 24 }}>{service.name} booked successfully. We'll confirm on your number shortly.</p>
            <button onClick={onClose} style={{ background: "#d4af82", color: "#0a0a0a", border: "none", padding: "12px 32px", borderRadius: 999, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>PERFECT ✦</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#d4af82", fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>— BOOKING</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 4, color: "#f0ede8" }}>{service.name}</h2>
            <p style={{ fontSize: 12, color: "rgba(240,237,232,0.35)", marginBottom: 28 }}>{service.price} · {service.duration}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(240,237,232,0.4)", fontWeight: 600, textTransform: "uppercase", marginBottom: 7 }}>Your Name</label>
                <input style={inputStyle} placeholder="e.g. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(240,237,232,0.4)", fontWeight: 600, textTransform: "uppercase", marginBottom: 7 }}>Phone Number</label>
                <input style={inputStyle} placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <button
                onClick={() => setDone(true)}
                style={{ width: "100%", padding: 14, borderRadius: 13, background: "#d4af82", color: "#0a0a0a", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                CONFIRM BOOKING ✦
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Services() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [bookingService, setBookingService] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeaderVisible(true), 100);
  }, []);

  const filtered = activeCategory === "All"
    ? allServices
    : allServices.filter(s => s.category === activeCategory);

  const featured = filtered.filter(s => s.featured);
  const regular = filtered.filter(s => !s.featured);

  return (
    <div style={{ background: "#0a0a0a", color: "#f0ede8", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,130,0.2); border-radius: 4px; }
        .nav-lnk { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(240,237,232,0.5); cursor: pointer; transition: color 0.3s; }
        .nav-lnk:hover { color: #d4af82; }
        .cat-btn { transition: all 0.3s ease; cursor: pointer; font-family: 'DM Sans',sans-serif; }
        .cat-btn:hover { border-color: rgba(212,175,130,0.4) !important; color: #d4af82 !important; }
      `}</style>

      {/* ── Booking Modal ── */}
      {bookingService && <BookModal service={bookingService} onClose={() => setBookingService(null)} />}

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 52px",
        background: "rgba(10,10,10,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,175,130,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #d4af82", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#d4af82" }} />
          </div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: "0.15em" }}>SALON</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {navLinks.map(l => <span key={l} className="nav-lnk">{l}</span>)}
        </div>
        <button
          onClick={() => setBookingService(allServices[0])}
          style={{ background: "#d4af82", color: "#0a0a0a", border: "none", cursor: "pointer", padding: "11px 26px", borderRadius: 999, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.3s" }}>
          BOOK NOW
        </button>
      </nav>

      {/* ── HERO HEADER ── */}
      <section style={{ position: "relative", padding: "100px 52px 80px", overflow: "hidden", minHeight: 420 }}>
        <ParticleCanvas />

        {/* Big decorative number */}
        <div style={{
          position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(120px,18vw,240px)",
          color: "rgba(240,237,232,0.025)", lineHeight: 0.85, userSelect: "none", zIndex: 2, pointerEvents: "none",
        }}>SVC</div>

        {/* Accent lines */}
        <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: 60, background: "rgba(212,175,130,0.15)", zIndex: 2 }} />
        <div style={{ position: "absolute", bottom: 0, right: 120, width: 1, height: 40, background: "rgba(212,175,130,0.1)", zIndex: 2 }} />

        <div style={{
          position: "relative", zIndex: 3, maxWidth: 1200, margin: "0 auto",
          transform: headerVisible ? "translateY(0)" : "translateY(20px)",
          opacity: headerVisible ? 1 : 0, transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 1, background: "#d4af82" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "#d4af82", fontWeight: 600, textTransform: "uppercase" }}>OUR CRAFT</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(44px,6vw,88px)", lineHeight: 1, marginBottom: 20 }}>
            Every Service,<br /><em style={{ color: "#d4af82" }}>Designed for You.</em>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(240,237,232,0.45)", maxWidth: 520, lineHeight: 1.75, fontWeight: 300, marginBottom: 44 }}>
            From precision cuts to full bridal transformations — our menu is a curated collection of rituals, each crafted with intention and premium care.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 36 }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: "#d4af82" }}>{s.value}</div>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(240,237,232,0.35)", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER ── */}
      <div style={{ padding: "0 52px 48px", position: "sticky", top: 65, zIndex: 20, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(240,237,232,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className="cat-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "9px 22px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: activeCategory === cat ? "#d4af82" : "transparent",
                  color: activeCategory === cat ? "#0a0a0a" : "rgba(240,237,232,0.45)",
                  border: activeCategory === cat ? "1px solid #d4af82" : "1px solid rgba(240,237,232,0.1)",
                }}
              >{cat}</button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "rgba(240,237,232,0.25)", letterSpacing: "0.1em" }}>
            {filtered.length} SERVICE{filtered.length !== 1 ? "S" : ""}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: "56px 52px 80px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Featured cards */}
        {featured.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ width: 28, height: 1, background: "#d4af82" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#d4af82", fontWeight: 600, textTransform: "uppercase" }}>FEATURED SERVICES</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {featured.map((svc) => (
                <FeaturedCard key={svc.id} svc={svc} onBook={setBookingService} />
              ))}
            </div>
          </div>
        )}

        {/* Regular grid */}
        {regular.length > 0 && (
          <>
            {featured.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{ width: 28, height: 1, background: "rgba(212,175,130,0.4)" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(212,175,130,0.6)", fontWeight: 600, textTransform: "uppercase" }}>ALL SERVICES</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {regular.map((svc, i) => (
                <ServiceCard key={svc.id} svc={svc} index={i} onBook={setBookingService} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(240,237,232,0.3)" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, marginBottom: 12 }}>—</div>
            <p style={{ fontSize: 14 }}>No services in this category yet.</p>
          </div>
        )}
      </div>

      {/* ── CTA BANNER ── */}
      <section style={{
        margin: "0 52px 60px", borderRadius: 24,
        background: "#0f0f0d", border: "1px solid rgba(212,175,130,0.14)",
        padding: "52px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", overflow: "hidden", gap: 32,
      }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(212,175,130,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#d4af82", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>READY FOR YOUR GLOW UP?</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.2 }}>
            Book your next <em style={{ color: "#d4af82" }}>transformation.</em>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 14, flexShrink: 0, position: "relative", zIndex: 1 }}>
          <button
            onClick={() => setBookingService(allServices[0])}
            style={{ background: "#d4af82", color: "#0a0a0a", border: "none", cursor: "pointer", padding: "14px 32px", borderRadius: 999, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.3s" }}>
            BOOK APPOINTMENT
          </button>
          <button style={{ background: "transparent", color: "#f0ede8", border: "1px solid rgba(240,237,232,0.25)", cursor: "pointer", padding: "14px 32px", borderRadius: 999, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.3s" }}>
            CALL US NOW
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      {/* <footer style={{ padding: "32px 52px 40px", borderTop: "1px solid rgba(240,237,232,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid #d4af82", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d4af82" }} />
          </div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: "0.15em" }}>LUMIÈRE</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(240,237,232,0.2)", letterSpacing: "0.06em" }}>© 2025 Lumière Salon. All rights reserved.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Instagram", "Facebook", "YouTube"].map(s => (
            <span key={s} style={{ fontSize: 11, color: "rgba(240,237,232,0.2)", cursor: "pointer", letterSpacing: "0.06em", transition: "color 0.2s" }}>{s}</span>
          ))}
        </div>
      </footer> */}
    </div>
  );
}