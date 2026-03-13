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

export default function Hero() {
  const [hoveredService, setHoveredService] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tickerItems = ["PRECISION CUTS", "COLOR THERAPY", "BRIDAL ARTISTRY", "SCALP RITUALS", "HAIR SMOOTHING", "FACE SHAPING"];

  const goToSlide = (next) => {
    if (isTransitioning || next === currentSlide) return;
    setIsTransitioning(true);
    setPrevSlide(currentSlide);
    setCurrentSlide(next);
    setTimeout(() => {
      setPrevSlide(null);
      setIsTransitioning(false);
    }, 950);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % bannerSlides.length;
      goToSlide(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentSlide, isTransitioning]);

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

        /* Banner transition */
        .sl-enter { animation: slIn 0.95s cubic-bezier(0.4,0,0.2,1) forwards; }
        .sl-exit  { animation: slOut 0.95s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes slIn  { from { opacity:0; transform:scale(1.07); } to { opacity:1; transform:scale(1); } }
        @keyframes slOut { from { opacity:1; transform:scale(1);    } to { opacity:0; transform:scale(0.96); } }
        .kb { animation: kenBurns 8s ease-in-out infinite alternate; }
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.07); } }

        /* Label slide-up on change */
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

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
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
        <button className="btn-p px-6 py-2.5 rounded-full hidden md:block">BOOK NOW</button>
      </nav>

      {/* ─── Hero / Sliding Banner ─── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 px-8 pt-32 overflow-hidden">

        {/* Slide stack */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {bannerSlides.map((slide, i) => {
            const isActive = i === currentSlide;
            const isExiting = i === prevSlide;
            if (!isActive && !isExiting) return null;
            return (
              <div key={i} className={`absolute inset-0 ${isActive ? 'sl-enter' : 'sl-exit'}`}
                style={{ zIndex: isActive ? 2 : 1 }}>
                <img
                  src={slide.url}
                  alt={slide.label}
                  className={`w-full h-full object-cover object-center ${isActive ? 'kb' : ''}`}
                  style={{ filter: 'brightness(0.28) saturate(0.7)' }}
                />
              </div>
            );
          })}
          {/* Gradient overlays */}
          <div className="absolute inset-0 z-10"
            style={{ background: 'linear-gradient(to top, #0a0a0a 26%, rgba(10,10,10,0.52) 58%, rgba(10,10,10,0.22) 100%)' }} />
          <div className="absolute inset-0 z-10"
            style={{ background: 'linear-gradient(to right, #0a0a0a 0%, transparent 52%)' }} />
        </div>

        <div className="dotgrid absolute inset-0 opacity-20 z-[3]" />
        <div className="noise absolute inset-0 z-[3]" />
        <div className="absolute top-0 left-1/2 w-px h-40 bg-[#d4af82] opacity-20 z-[4]" />
        <div className="absolute bottom-0 right-32 w-px h-32 bg-[#d4af82] opacity-15 z-[4]" />
        <div className="hero-bg-num">0{currentSlide + 1}</div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto w-full" style={{ zIndex: 5 }}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-end">

            {/* Left copy */}
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
                <button className="btn-p px-8 py-4 rounded-full">BOOK A SESSION</button>
                <button className="btn-o px-8 py-4 rounded-full">EXPLORE SERVICES</button>
              </div>

              {/* Slide controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {bannerSlides.map((_, i) => (
                    <button key={i} onClick={() => goToSlide(i)}
                      className={`dot-ctrl ${i === currentSlide ? 'on' : ''}`} />
                  ))}
                </div>
                <span className="df text-sm tracking-widest text-[rgba(240,237,232,0.3)]">
                  0{currentSlide + 1}&nbsp;/&nbsp;0{bannerSlides.length}
                </span>
                <button className="arr-btn" onClick={() => goToSlide((currentSlide - 1 + bannerSlides.length) % bannerSlides.length)}>←</button>
                <button className="arr-btn" onClick={() => goToSlide((currentSlide + 1) % bannerSlides.length)}>→</button>
              </div>
            </div>

            {/* Right stats */}
            <div className="md:col-span-5 md:pl-12 mt-16 md:mt-0 fade-in s3">
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <div key={i} className="grid-card rounded-2xl p-6 bg-[rgba(240,237,232,0.02)]"
                    style={{ backdropFilter: 'blur(14px)' }}>
                    <div className="df text-4xl gold mb-1">{s.value}</div>
                    <div className="text-xs tracking-widest text-[rgba(240,237,232,0.4)] uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25" style={{ zIndex: 5 }}>
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-[#f0ede8] animate-bounce" />
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <div className="py-4 overflow-hidden border-y border-[rgba(240,237,232,0.06)]"
        style={{ background: 'rgba(212,175,130,0.04)' }}>
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="df text-2xl tracking-widest mx-10 text-[#d4af82] opacity-60">
              {item} <span className="text-[rgba(240,237,232,0.2)]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── Gallery Strip — isolated section, no overflow ─── */}
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
            {/* Large */}
            <div className="col-span-5 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80&fit=crop"
                alt="Styling" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: 'brightness(0.75) saturate(0.85)' }} />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)' }} />
              <div className="absolute bottom-5 left-5">
                <span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">STYLING</span>
              </div>
            </div>

            {/* Stack 2 */}
            <div className="col-span-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
              <div className="flex-1 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
                <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=700&q=80&fit=crop"
                  alt="Color" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'brightness(0.7) saturate(0.8)' }} />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4">
                  <span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">COLORING</span>
                </div>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
                <img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=80&fit=crop"
                  alt="Bridal" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'brightness(0.7) saturate(0.8)' }} />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.55) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4">
                  <span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">BRIDAL</span>
                </div>
              </div>
            </div>

            {/* Tall right */}
            <div className="col-span-3 rounded-2xl overflow-hidden relative grid-card group" style={{ minHeight: 0 }}>
              <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80&fit=crop"
                alt="Interior" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: 'brightness(0.65) saturate(0.8)' }} />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)' }} />
              <div className="absolute bottom-5 left-4">
                <span className="tp bg-[rgba(212,175,130,0.2)] text-[#d4af82] px-3 py-1 rounded-full">INTERIOR</span>
              </div>
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
              Services Built<br />
              <em className="gold">for Every You.</em>
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
              onMouseLeave={() => setHoveredService(null)}>
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
            <div className="dotgrid absolute inset-0 opacity-30" />
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
            <button className="btn-p px-10 py-4 rounded-full">BOOK APPOINTMENT</button>
            <button className="btn-o px-10 py-4 rounded-full">CALL US NOW</button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-8 pb-12 max-w-7xl mx-auto">
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
      </footer>
    </div>
  );
}