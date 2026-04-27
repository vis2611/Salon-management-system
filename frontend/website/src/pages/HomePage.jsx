import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { servicesAPI, staffAPI, reviewsAPI } from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ─── Custom Cursor ─────────────────────────────────── */
function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    let rx = 0, ry = 0;
    const move = (e) => {
      const x = e.clientX, y = e.clientY;
      if (dot.current) { dot.current.style.transform = `translate(${x}px,${y}px)`; }
      rx += (x - rx) * 0.12;
      ry += (y - ry) * 0.12;
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`;
    };
    const raf = () => { requestAnimationFrame(raf); };
    let frame;
    const loop = () => { frame = requestAnimationFrame(loop); };
    loop();
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(frame); };
  }, []);
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}

/* ─── Marquee strip ──────────────────────────────────── */
function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-outer">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-text">{item}</span>
            <span className="marquee-sep">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Scroll reveal hook ─────────────────────────────── */
function useScrollReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Letter split animation ─────────────────────────── */
function SplitText({ text, className, delay = 0 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="split-char" style={{ animationDelay: `${delay + i * 60}ms` }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

/* ─── Counter animation ──────────────────────────────── */
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Main HomePage ──────────────────────────────────── */
export default function HomePage() {
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => servicesAPI.list({ limit: 8 }) });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: staffAPI.list });
  const { data: reviews } = useQuery({ queryKey: ["reviews"], queryFn: () => reviewsAPI.list({ limit: 6 }) });

  const serviceList = services?.data?.data || [];
  const staffList = staff?.data?.data || [];
  const reviewList = reviews?.data?.data || [];

  const [heroReady, setHeroReady] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reviewList.length === 0) return;
    const t = setInterval(() => setReviewIdx(i => (i + 1) % reviewList.length), 5000);
    return () => clearInterval(t);
  }, [reviewList.length]);

  const [heroRef, heroVisible] = useScrollReveal(0.05);
  const [aboutRef, aboutVisible] = useScrollReveal();
  const [servRef, servVisible] = useScrollReveal();
  const [teamRef, teamVisible] = useScrollReveal();
  const [reviewRef, reviewVisible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  const services_marquee = ["Hair Styling", "Keratin", "Nail Art", "Facials", "Bridal Makeup", "Balayage", "Spa Therapy", "Lash Extensions", "Skin Care", "Waxing"];

  return (
    <>
      <style>{`
        /* ── Reset & base ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body.salon-home {
          background: #080808;
          color: #F0EAE0;
          font-family: 'DM Sans', system-ui, sans-serif;
          cursor: none;
          overflow-x: hidden;
        }

        /* ── Custom cursor ─── */
        .cursor-dot {
          position: fixed; top: -4px; left: -4px;
          width: 8px; height: 8px;
          background: #C9A84C;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transition: width .2s, height .2s;
          mix-blend-mode: difference;
        }
        .cursor-ring {
          position: fixed; top: -20px; left: -20px;
          width: 40px; height: 40px;
          border: 1px solid rgba(201,168,76,0.5);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transition: width .3s, height .3s, border-color .3s;
        }
        body.salon-home a:hover ~ .cursor-ring,
        body.salon-home button:hover ~ .cursor-ring { width: 60px; height: 60px; }

        /* ── Scrollbar ─── */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #C9A84C; }

        /* ── Grain overlay ─── */
        .grain::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        /* ── Section base ─── */
        .section { position: relative; width: 100%; overflow: hidden; }

        /* ══ 1. HERO ══════════════════════════════════ */
        .hero {
          min-height: 100vh;
          background: #060606;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 0 6vw;
          position: relative;
        }
        .hero-bg-line {
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.15) 30%, rgba(201,168,76,0.15) 70%, transparent);
        }
        .hero-noise { position: absolute; inset: 0; pointer-events: none; }

        /* Floating orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          animation: orbFloat 14s ease-in-out infinite;
        }
        .orb-1 { width: 500px; height: 500px; background: rgba(201,168,76,0.06); top: -100px; right: -100px; animation-delay: 0s; }
        .orb-2 { width: 300px; height: 300px; background: rgba(28,58,47,0.3); bottom: 50px; left: 20%; animation-delay: -5s; }
        .orb-3 { width: 200px; height: 200px; background: rgba(201,168,76,0.04); top: 40%; left: 55%; animation-delay: -9s; }

        @keyframes orbFloat {
          0%,100% { transform: translate(0,0); }
          33%  { transform: translate(30px,-20px); }
          66%  { transform: translate(-20px,15px); }
        }

        .hero-eyebrow {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 32px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 1s ease, transform 1s ease;
        }
        .hero-eyebrow.in { opacity: 1; transform: none; }
        .eyebrow-line { height: 1px; width: 40px; background: #C9A84C; }
        .eyebrow-text {
          font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase;
          color: #C9A84C; font-family: 'DM Sans', sans-serif;
        }

        /* Kinetic heading */
        .hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(72px, 12vw, 160px);
          font-weight: 300;
          line-height: 0.88;
          letter-spacing: -0.02em;
          color: #F0EAE0;
          position: relative;
          z-index: 2;
          margin-bottom: 16px;
        }
        .hero-heading-italic {
          font-style: italic;
          color: transparent;
          -webkit-text-stroke: 1px #C9A84C;
        }
        .split-char {
          display: inline-block;
          opacity: 0;
          transform: translateY(60px) rotate(4deg);
          animation: charIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes charIn {
          to { opacity: 1; transform: none; }
        }

        .hero-sub {
          font-size: 14px; line-height: 1.8;
          color: rgba(240,234,224,0.45);
          max-width: 380px;
          margin-bottom: 48px;
          opacity: 0; transform: translateY(24px);
          transition: opacity 1s 0.8s ease, transform 1s 0.8s ease;
        }
        .hero-sub.in { opacity: 1; transform: none; }

        .hero-ctas {
          display: flex; align-items: center; gap: 24px;
          opacity: 0;
          transition: opacity 1s 1.1s ease;
        }
        .hero-ctas.in { opacity: 1; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: #C9A84C;
          color: #060606;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          padding: 16px 36px;
          text-decoration: none;
          transition: all 0.4s;
          position: relative; overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: #F0EAE0;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-primary:hover::before { transform: scaleX(1); }
        .btn-primary span { position: relative; z-index: 1; }

        .btn-ghost-hero {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: rgba(240,234,224,0.5);
          text-decoration: none;
          display: flex; align-items: center; gap: 8px;
          transition: color 0.3s;
        }
        .btn-ghost-hero:hover { color: #C9A84C; }
        .btn-arrow {
          width: 32px; height: 1px;
          background: currentColor;
          transition: width 0.3s;
          display: inline-block;
        }
        .btn-ghost-hero:hover .btn-arrow { width: 48px; }

        /* Hero image mosaic */
        .hero-mosaic {
          position: absolute;
          right: 4vw; top: 50%; transform: translateY(-50%);
          width: min(36vw, 520px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 220px 160px 180px;
          gap: 6px;
          opacity: 0;
          transition: opacity 1.2s 0.4s ease;
        }
        .hero-mosaic.in { opacity: 1; }
        .mosaic-img {
          background: #141414;
          overflow: hidden;
          position: relative;
        }
        .mosaic-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 8s ease;
          transform: scale(1.08);
        }
        .hero-mosaic.in .mosaic-img img { transform: scale(1); }
        .mosaic-img:nth-child(1) { grid-row: 1 / 2; grid-column: 1 / 2; }
        .mosaic-img:nth-child(2) { grid-row: 1 / 3; grid-column: 2 / 3; }
        .mosaic-img:nth-child(3) { grid-row: 2 / 4; grid-column: 1 / 2; }
        .mosaic-img:nth-child(4) { grid-row: 3 / 4; grid-column: 2 / 3; }

        /* Floating badge */
        .hero-badge {
          position: absolute; bottom: -20px; left: -20px;
          background: rgba(8,8,8,0.92);
          border: 1px solid rgba(201,168,76,0.3);
          backdrop-filter: blur(12px);
          padding: 16px 20px;
          animation: badgeFloat 4s ease-in-out infinite;
          z-index: 10;
        }
        @keyframes badgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* Scroll indicator */
        .scroll-hint {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: 0; animation: fadeIn 1s 2s forwards;
        }
        @keyframes fadeIn { to { opacity: 1; } }
        .scroll-line {
          width: 1px; height: 60px;
          background: linear-gradient(to bottom, transparent, #C9A84C);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse { 0%,100%{transform:scaleY(1) translateY(0)} 50%{transform:scaleY(0.6) translateY(10px)} }
        .scroll-text {
          font-size: 8px; letter-spacing: 0.4em; text-transform: uppercase;
          color: rgba(201,168,76,0.5); writing-mode: horizontal-tb;
        }

        /* ── Horizontal stat strip ─── */
        .stat-strip {
          display: flex; justify-content: space-around; align-items: center;
          border-top: 1px solid rgba(201,168,76,0.12);
          padding: 28px 6vw;
          background: #060606;
        }
        .stat-item { text-align: center; }
        .stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px; font-weight: 300;
          color: #C9A84C; line-height: 1;
        }
        .stat-label {
          font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase;
          color: rgba(240,234,224,0.35); margin-top: 6px;
        }
        .stat-divider { width: 1px; height: 50px; background: rgba(201,168,76,0.15); }

        /* ══ 2. MARQUEE ══════════════════════════════ */
        .marquee-outer {
          overflow: hidden;
          border-top: 1px solid rgba(201,168,76,0.12);
          border-bottom: 1px solid rgba(201,168,76,0.12);
          padding: 18px 0;
          background: #060606;
        }
        .marquee-track {
          display: flex; gap: 0;
          animation: marqueeScroll 30s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-item { display: flex; align-items: center; gap: 0; white-space: nowrap; }
        .marquee-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 300; font-style: italic;
          color: rgba(240,234,224,0.35);
          padding: 0 28px;
          transition: color 0.3s;
        }
        .marquee-track:hover .marquee-text { color: rgba(240,234,224,0.6); }
        .marquee-sep { color: #C9A84C; font-size: 10px; }

        /* ══ 3. ABOUT / PHILOSOPHY ══════════════════ */
        .about-section {
          min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
          background: #0C0C0C;
        }
        .about-left {
          position: relative; overflow: hidden;
        }
        .about-left img {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(20%) contrast(1.05);
          transition: transform 12s ease;
        }
        .about-left:hover img { transform: scale(1.04); }
        .about-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, transparent 60%, #0C0C0C);
        }
        .about-year {
          position: absolute; top: 40px; left: 40px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 120px; font-weight: 300;
          color: rgba(201,168,76,0.08);
          line-height: 1; pointer-events: none;
        }
        .about-right {
          display: flex; flex-direction: column; justify-content: center;
          padding: 80px 8vw 80px 5vw;
        }
        .section-tag {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 32px;
        }
        .tag-line { height: 1px; width: 32px; background: #C9A84C; }
        .tag-text {
          font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase;
          color: #C9A84C;
        }
        .section-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 4.5vw, 60px);
          font-weight: 300; line-height: 1.08;
          color: #F0EAE0;
          margin-bottom: 28px;
        }
        .section-heading em { font-style: italic; color: rgba(240,234,224,0.45); }
        .section-body {
          font-size: 14px; line-height: 1.9;
          color: rgba(240,234,224,0.45);
          max-width: 420px;
          margin-bottom: 40px;
        }
        .reveal-up {
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .reveal-up.in { opacity: 1; transform: none; }
        .reveal-up.d1 { transition-delay: 0.1s; }
        .reveal-up.d2 { transition-delay: 0.25s; }
        .reveal-up.d3 { transition-delay: 0.4s; }
        .reveal-up.d4 { transition-delay: 0.55s; }
        .reveal-up.d5 { transition-delay: 0.7s; }
        .reveal-left {
          opacity: 0; transform: translateX(-50px);
          transition: opacity 1s ease, transform 1s ease;
        }
        .reveal-left.in { opacity: 1; transform: none; }

        /* Philosophy pillars */
        .pillars { display: flex; flex-direction: column; gap: 0; }
        .pillar {
          display: flex; align-items: flex-start; gap: 20px;
          padding: 20px 0;
          border-bottom: 1px solid rgba(240,234,224,0.06);
        }
        .pillar-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; color: rgba(201,168,76,0.3);
          line-height: 1; flex-shrink: 0; width: 36px;
        }
        .pillar-title {
          font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;
          color: #F0EAE0; margin-bottom: 4px;
        }
        .pillar-desc { font-size: 13px; color: rgba(240,234,224,0.4); line-height: 1.6; }

        /* ══ 4. SERVICES ════════════════════════════ */
        .services-section {
          min-height: 100vh;
          background: #070707;
          padding: 120px 6vw;
          position: relative;
        }
        .services-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 80px;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(201,168,76,0.08);
        }
        .service-card {
          background: #070707;
          padding: 40px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.5s;
          cursor: pointer;
        }
        .service-card::before {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 1px;
          background: #C9A84C;
          transform: scaleX(0);
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
          transform-origin: left;
        }
        .service-card:hover { background: #0F0F0F; }
        .service-card:hover::before { transform: scaleX(1); }
        .service-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px; color: rgba(201,168,76,0.3);
          margin-bottom: 32px; display: block;
        }
        .service-icon {
          font-size: 22px; margin-bottom: 20px; display: block;
          transition: transform 0.4s;
          color: rgba(240,234,224,0.2);
        }
        .service-card:hover .service-icon { transform: scale(1.2); color: #C9A84C; }
        .service-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 400;
          color: #F0EAE0; margin-bottom: 10px; display: block;
          transition: color 0.3s;
        }
        .service-desc {
          font-size: 12px; color: rgba(240,234,224,0.35);
          line-height: 1.7; margin-bottom: 24px;
          display: block;
        }
        .service-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: #C9A84C;
          display: flex; align-items: baseline; gap: 4px;
        }
        .service-dur { font-size: 11px; color: rgba(240,234,224,0.3); }
        .service-arrow {
          position: absolute; bottom: 24px; right: 24px;
          opacity: 0; transition: opacity 0.3s, transform 0.3s;
          color: #C9A84C; font-size: 18px;
        }
        .service-card:hover .service-arrow { opacity: 1; transform: translate(4px,-4px); }

        /* ══ 5. TEAM ════════════════════════════════ */
        .team-section {
          min-height: 100vh;
          background: #0A0A0A;
          padding: 120px 6vw;
          position: relative;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 80px;
        }
        .team-card {
          position: relative; overflow: hidden;
          cursor: pointer;
        }
        .team-photo {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #141414;
        }
        .team-photo img {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(30%);
          transition: transform 0.8s ease, filter 0.8s ease;
        }
        .team-card:hover .team-photo img { transform: scale(1.06); filter: grayscale(0%); }
        .team-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(6,6,6,0.9) 0%, transparent 50%);
        }
        .team-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 24px;
          transform: translateY(20px);
          transition: transform 0.4s;
        }
        .team-card:hover .team-info { transform: none; }
        .team-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: #F0EAE0; display: block;
        }
        .team-role {
          font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
          color: #C9A84C; display: block; margin-top: 4px;
        }
        .team-rating {
          display: flex; align-items: center; gap: 4px;
          margin-top: 8px;
          opacity: 0; transition: opacity 0.4s 0.1s;
        }
        .team-card:hover .team-rating { opacity: 1; }
        .star { color: #C9A84C; font-size: 10px; }
        .team-exp {
          position: absolute; top: 16px; right: 16px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px; color: rgba(240,234,224,0.5);
          background: rgba(8,8,8,0.7);
          backdrop-filter: blur(8px);
          padding: 6px 10px;
          border: 1px solid rgba(201,168,76,0.2);
        }

        /* ══ 6. TESTIMONIALS ════════════════════════ */
        .reviews-section {
          min-height: 80vh;
          background: #060606;
          padding: 120px 6vw;
          display: flex; flex-direction: column;
        }
        .reviews-body {
          flex: 1; display: flex; gap: 80px;
          margin-top: 80px; align-items: center;
        }
        .review-main { flex: 1; position: relative; min-height: 280px; }
        .review-slide {
          position: absolute; top: 0; left: 0; right: 0;
          opacity: 0; transform: translateX(40px);
          transition: opacity 0.6s ease, transform 0.6s ease;
          pointer-events: none;
        }
        .review-slide.active {
          opacity: 1; transform: none;
          position: relative; pointer-events: auto;
        }
        .review-quote {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(22px, 3vw, 34px);
          font-weight: 300; font-style: italic;
          color: #F0EAE0;
          line-height: 1.45;
          margin-bottom: 32px;
        }
        .review-quote::before {
          content: '"';
          font-size: 80px; color: rgba(201,168,76,0.12);
          font-family: 'Cormorant Garamond', serif;
          display: block; line-height: 0.6; margin-bottom: 20px;
        }
        .review-author { display: flex; align-items: center; gap: 16px; }
        .review-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: #1C3A2F; overflow: hidden;
          border: 1px solid rgba(201,168,76,0.2);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .review-avatar-letter {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: #C9A84C;
        }
        .review-name {
          font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;
          color: #F0EAE0; display: block;
        }
        .review-stars { display: flex; gap: 3px; margin-top: 4px; }
        .review-dots {
          display: flex; gap: 8px; margin-top: 48px;
        }
        .review-dot {
          width: 20px; height: 1px;
          background: rgba(240,234,224,0.2);
          cursor: pointer; transition: all 0.3s;
        }
        .review-dot.active { width: 48px; background: #C9A84C; }
        .review-side {
          width: 260px; flex-shrink: 0;
        }
        .review-side-items { display: flex; flex-direction: column; gap: 0; }
        .review-side-item {
          padding: 18px 0;
          border-bottom: 1px solid rgba(240,234,224,0.06);
          cursor: pointer; transition: all 0.3s;
        }
        .review-side-item.active { border-bottom-color: rgba(201,168,76,0.4); }
        .side-name {
          font-size: 12px; color: rgba(240,234,224,0.35);
          transition: color 0.3s;
          display: flex; align-items: center; gap: 8px;
        }
        .review-side-item.active .side-name { color: #F0EAE0; }
        .side-dot { width: 4px; height: 4px; border-radius: 50%; background: #C9A84C; flex-shrink: 0; opacity: 0; transition: opacity 0.3s; }
        .review-side-item.active .side-dot { opacity: 1; }

        /* ══ 7. CTA ══════════════════════════════════ */
        .cta-section {
          min-height: 70vh;
          background: #C9A84C;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          padding: 100px 6vw;
          position: relative; overflow: hidden;
        }
        .cta-bg-text {
          position: absolute;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(100px, 18vw, 220px);
          color: rgba(0,0,0,0.06);
          font-weight: 700;
          letter-spacing: -0.05em;
          white-space: nowrap;
          pointer-events: none;
          top: 50%; transform: translateY(-50%);
          user-select: none;
        }
        .cta-content { position: relative; z-index: 1; }
        .cta-tag {
          font-size: 9px; letter-spacing: 0.45em; text-transform: uppercase;
          color: rgba(6,6,6,0.5); margin-bottom: 20px;
        }
        .cta-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 7vw, 90px);
          font-weight: 300; line-height: 1;
          color: #060606;
          margin-bottom: 32px;
        }
        .cta-sub {
          font-size: 14px; color: rgba(6,6,6,0.55);
          max-width: 420px; margin: 0 auto 48px;
          line-height: 1.7;
        }
        .btn-dark {
          display: inline-flex; align-items: center; gap: 12px;
          background: #060606; color: #C9A84C;
          font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase;
          padding: 18px 48px; text-decoration: none;
          transition: all 0.4s; position: relative; overflow: hidden;
        }
        .btn-dark::before {
          content: ''; position: absolute; inset: 0;
          background: #1C3A2F; transform: scaleX(0); transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-dark:hover::before { transform: scaleX(1); }
        .btn-dark span { position: relative; z-index: 1; }

        /* ── Responsive ─── */
        @media (max-width: 1024px) {
          .hero-mosaic { display: none; }
          .about-section { grid-template-columns: 1fr; }
          .about-left { height: 50vw; }
          .services-grid { grid-template-columns: repeat(2,1fr); }
          .team-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 640px) {
          .services-grid, .team-grid { grid-template-columns: 1fr; }
          .reviews-body { flex-direction: column; }
          .review-side { display: none; }
          .stat-strip { flex-wrap: wrap; gap: 24px; }
          .stat-divider { display: none; }
        }
      `}</style>

      <Cursor />

      <div style={{ background: "#080808" }}>
        <Navbar />

        {/* ════════════════════════════════════════════
            SECTION 1 — HERO
        ════════════════════════════════════════════ */}
        <section className="hero grain section" ref={heroRef}>
          {/* Background grid lines */}
          {[15, 30, 50, 70, 85].map(p => (
            <div key={p} className="hero-bg-line" style={{ left: `${p}%` }} />
          ))}

          {/* Orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          {/* Left content */}
          <div style={{ maxWidth: "min(52vw, 680px)", position: "relative", zIndex: 2, paddingTop: "100px", paddingBottom: "80px" }}>

            <div className={`hero-eyebrow ${heroReady ? "in" : ""}`}>
              <div className="eyebrow-line" />
              <span className="eyebrow-text">Established 2018 · Pune, India</span>
            </div>

            <h1 className="hero-heading">
              {heroReady && (
                <>
                  <SplitText text="Where" className="" delay={200} />
                  <br />
                  <SplitText text="Beauty" className="" delay={400} />
                  <br />
                  <SplitText text="Begins." className="hero-heading-italic" delay={650} />
                </>
              )}
            </h1>

            <p className={`hero-sub ${heroReady ? "in" : ""}`}>
              Lumière is Nagpur's destination for luxury hair, skin and wellness — where master artisans craft your most confident self.
            </p>

            <div className={`hero-ctas ${heroReady ? "in" : ""}`}>
              <Link to="/book" className="btn-primary">
                <span>Book Appointment</span>
              </Link>
              <Link to="/services" className="btn-ghost-hero">
                <div className="btn-arrow" />
                <span>Explore Services</span>
              </Link>
            </div>
          </div>

          {/* Right mosaic */}
          <div className={`hero-mosaic ${heroReady ? "in" : ""}`}>
            {[
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=85",
              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=85",
              "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=85",
              "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=85",
            ].map((src, i) => (
              <div key={i} className="mosaic-img">
                <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} />
              </div>
            ))}
            {/* Floating award badge */}
            <div className="hero-badge">
              <div style={{ fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "4px" }}>Award Winning</div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", color: "#F0EAE0" }}>Best Salon Nagpur</div>
              <div style={{ fontSize: "10px", color: "rgba(240,234,224,0.4)", marginTop: "2px" }}>2023 · 2024</div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-hint">
            <div className="scroll-line" />
            <span className="scroll-text">Scroll</span>
          </div>
        </section>

        {/* Stat strip */}
        <div className="stat-strip">
          {[
            { num: 500, suffix: "+", label: "Happy Clients" },
            { num: 12, suffix: "+", label: "Expert Stylists" },
            { num: 98, suffix: "%", label: "Satisfaction Rate" },
            { num: 6, suffix: "", label: "Years of Excellence" },
          ].map(({ num, suffix, label }, i) => (
            <div key={i} className="stat-item">
              <div className="stat-num"><Counter target={num} suffix={suffix} /></div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Marquee */}
        <Marquee items={services_marquee} />

        {/* ════════════════════════════════════════════
            SECTION 2 — PHILOSOPHY / ABOUT
        ════════════════════════════════════════════ */}
        <section className="about-section section grain" ref={aboutRef}>
          <div className="about-left">
            <img src="https://plus.unsplash.com/premium_photo-1669675936121-6d3d42244ab5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2Fsb258ZW58MHx8MHx8fDA%3D" alt="Salon interior" loading="lazy" />
            <div className="about-overlay" />
            <div className="about-year">18</div>
          </div>

          <div className="about-right">
            <div className={`reveal-up ${aboutVisible ? "in" : ""}`}>
              <div className="section-tag">
                <div className="tag-line" />
                <span className="tag-text">Our Philosophy</span>
              </div>
            </div>

            <h2 className={`section-heading reveal-up d1 ${aboutVisible ? "in" : ""}`}>
              Art meets<br /><em>science,</em><br />beauty meets<br /><em>confidence.</em>
            </h2>

            <p className={`section-body reveal-up d2 ${aboutVisible ? "in" : ""}`}>
              At Lumière, every appointment is a ritual. We combine cutting-edge techniques with time-honoured traditions to create transformations that last long after you leave our doors.
            </p>

            <div className={`pillars reveal-up d3 ${aboutVisible ? "in" : ""}`}>
              {[
                { num: "01", title: "Precision", desc: "Every cut, colour and treatment executed with millimetre accuracy." },
                { num: "02", title: "Integrity", desc: "Only premium, ethically sourced products on your skin and hair." },
                { num: "03", title: "Artistry", desc: "We don't follow trends — we set them with creative vision." },
              ].map(p => (
                <div key={p.num} className="pillar">
                  <span className="pillar-num">{p.num}</span>
                  <div>
                    <div className="pillar-title">{p.title}</div>
                    <div className="pillar-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 3 — SERVICES
        ════════════════════════════════════════════ */}
        <section className="services-section section grain" ref={servRef}>
          <div className="services-header">
            <div>
              <div className={`section-tag reveal-up ${servVisible ? "in" : ""}`}>
                <div className="tag-line" />
                <span className="tag-text">Signature Services</span>
              </div>
              <h2 className={`section-heading reveal-up d1 ${servVisible ? "in" : ""}`} style={{ marginBottom: 0 }}>
                Our <em>expertise</em>
              </h2>
            </div>
            <Link to="/services" className={`btn-ghost-hero reveal-up d2 ${servVisible ? "in" : ""}`}>
              <div className="btn-arrow" />
              <span>All Services</span>
            </Link>
          </div>

          <div className="services-grid">
            {(serviceList.length > 0 ? serviceList.slice(0, 8) : [
              { id: "1", name: "Balayage & Highlights", description: "Handcrafted colour blending for a natural sun-kissed look.", price: 3500, durationMins: 120, category: { name: "Hair" } },
              { id: "2", name: "Keratin Smoothing", description: "Eliminate frizz and add glass-like shine for months.", price: 4500, durationMins: 150, category: { name: "Hair" } },
              { id: "3", name: "Hydra Facial", description: "Deep cleanse, exfoliate and hydrate in one session.", price: 2800, durationMins: 75, category: { name: "Skin" } },
              { id: "4", name: "Nail Artistry", description: "Bespoke nail designs crafted by certified nail artists.", price: 1200, durationMins: 60, category: { name: "Nails" } },
              { id: "5", name: "Bridal Makeup", description: "Flawless, long-lasting looks for your most important day.", price: 8000, durationMins: 180, category: { name: "Makeup" } },
              { id: "6", name: "Scalp Therapy", description: "Targeted treatment for healthier roots and stronger growth.", price: 1800, durationMins: 60, category: { name: "Hair" } },
              { id: "7", name: "Hot Stone Massage", description: "Melt tension with volcanic stone heat therapy.", price: 3200, durationMins: 90, category: { name: "Spa" } },
              { id: "8", name: "Lash Lift & Tint", description: "Curl, lift and darken your natural lashes to perfection.", price: 1500, durationMins: 45, category: { name: "Beauty" } },
            ]).map((svc, i) => {
              const icons = ["◈", "✦", "❋", "◉", "♛", "✿", "◇", "✶"];
              return (
                <div key={svc.id} className={`service-card reveal-up ${servVisible ? "in" : ""}`} style={{ transitionDelay: `${i * 60}ms` }}>
                  <span className="service-num">0{i + 1}</span>
                  <span className="service-icon">{icons[i]}</span>
                  <span className="service-name">{svc.name}</span>
                  <span className="service-desc">{svc.description}</span>
                  <div className="service-price">
                    ₹{Number(svc.price).toLocaleString("en-IN")}
                    <span className="service-dur">/ {svc.durationMins}min</span>
                  </div>
                  <span className="service-arrow">↗</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 4 — TEAM
        ════════════════════════════════════════════ */}
        <section className="team-section section grain" ref={teamRef}>
          <div className="section-tag">
            <div className="tag-line" />
            <span className="tag-text">Meet the Artists</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h2 className={`section-heading reveal-up ${teamVisible ? "in" : ""}`} style={{ marginBottom: 0 }}>
              The <em>masters</em><br />behind your look.
            </h2>
            <Link to="/services" className={`btn-ghost-hero reveal-up d2 ${teamVisible ? "in" : ""}`}>
              <div className="btn-arrow" />
              <span>Book a Stylist</span>
            </Link>
          </div>

          <div className="team-grid">
            {(staffList.length > 0 ? staffList.slice(0, 4) : [
              { id: "1", user: { name: "Priya Sharma", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=85" }, specialization: "Hair Colourist", experienceYears: 8, avgRating: 4.9 },
              { id: "2", user: { name: "Rahul Mehta", avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=85" }, specialization: "Skin Specialist", experienceYears: 6, avgRating: 4.8 },
              { id: "3", user: { name: "Ananya Joshi", avatarUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=400&q=85" }, specialization: "Bridal Makeup Artist", experienceYears: 10, avgRating: 5.0 },
              { id: "4", user: { name: "Kiran Patel", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85" }, specialization: "Nail Artist", experienceYears: 5, avgRating: 4.7 },
            ]).map((member, i) => (
              <div key={member.id} className={`team-card reveal-up ${teamVisible ? "in" : ""}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="team-photo">
                  {member.user?.avatarUrl
                    ? <img src={member.user.avatarUrl} alt={member.user?.name} loading="lazy" />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "60px", color: "rgba(201,168,76,0.2)" }}>{member.user?.name?.[0]}</span>
                    </div>
                  }
                  <div className="team-overlay" />
                  {member.experienceYears && (
                    <div className="team-exp">{member.experienceYears}+ yrs</div>
                  )}
                </div>
                <div className="team-info">
                  <span className="team-name">{member.user?.name}</span>
                  <span className="team-role">{member.specialization}</span>
                  {member.avgRating && (
                    <div className="team-rating">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="star">{j < Math.floor(member.avgRating) ? "★" : "☆"}</span>
                      ))}
                      <span style={{ fontSize: "10px", color: "rgba(240,234,224,0.4)", marginLeft: "4px" }}>{member.avgRating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 5 — TESTIMONIALS
        ════════════════════════════════════════════ */}
        <section className="reviews-section section grain" ref={reviewRef}>
          <div>
            <div className={`section-tag reveal-up ${reviewVisible ? "in" : ""}`}>
              <div className="tag-line" />
              <span className="tag-text">Client Stories</span>
            </div>
            <h2 className={`section-heading reveal-up d1 ${reviewVisible ? "in" : ""}`}>
              Voices of <em>transformation.</em>
            </h2>
          </div>

          <div className="reviews-body">
            <div className={`review-main reveal-up d2 ${reviewVisible ? "in" : ""}`}>
              {(reviewList.length > 0 ? reviewList : [
                { id: "1", comment: "Walking into Lumière feels like stepping into a different world. Priya understood exactly what I wanted — and delivered something even better.", user: { name: "Sneha Kulkarni" }, rating: 5 },
                { id: "2", comment: "The keratin treatment completely transformed my hair. Six months later it still looks incredible. Worth every rupee.", user: { name: "Divya Nair" }, rating: 5 },
                { id: "3", comment: "My bridal makeup was flawless from 7am to midnight. I cried happy tears when I saw myself. Pure magic.", user: { name: "Meera Iyer" }, rating: 5 },
              ]).map((r, i) => (
                <div key={r.id} className={`review-slide ${i === reviewIdx ? "active" : ""}`}>
                  <blockquote className="review-quote">{r.comment}</blockquote>
                  <div className="review-author">
                    <div className="review-avatar">
                      {r.user?.avatarUrl
                        ? <img src={r.user.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <span className="review-avatar-letter">{r.user?.name?.[0]}</span>
                      }
                    </div>
                    <div>
                      <span className="review-name">{r.user?.name}</span>
                      <div className="review-stars">
                        {[...Array(r.rating || 5)].map((_, j) => <span key={j} className="star">★</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="review-dots">
                {(reviewList.length > 0 ? reviewList : [{}, {}, {}]).map((_, i) => (
                  <div key={i} className={`review-dot ${i === reviewIdx ? "active" : ""}`} onClick={() => setReviewIdx(i)} />
                ))}
              </div>
            </div>

            <div className={`review-side reveal-up d3 ${reviewVisible ? "in" : ""}`}>
              <div className="review-side-items">
                {(reviewList.length > 0 ? reviewList : [
                  { id: "1", user: { name: "Sneha Kulkarni" } },
                  { id: "2", user: { name: "Divya Nair" } },
                  { id: "3", user: { name: "Meera Iyer" } },
                ]).slice(0, 5).map((r, i) => (
                  <div key={r.id} className={`review-side-item ${i === reviewIdx ? "active" : ""}`} onClick={() => setReviewIdx(i)}>
                    <div className="side-name">
                      <span className="side-dot" />
                      {r.user?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTION 6 — CTA
        ════════════════════════════════════════════ */}
        <section className="cta-section section" ref={ctaRef}>
          <div className="cta-bg-text">LUMIÈRE</div>
          <div className="cta-content">
            <p className={`cta-tag reveal-up ${ctaVisible ? "in" : ""}`}>Your Journey Begins Here</p>
            <h2 className={`cta-heading reveal-up d1 ${ctaVisible ? "in" : ""}`}>
              Ready for your<br />transformation?
            </h2>
            <p className={`cta-sub reveal-up d2 ${ctaVisible ? "in" : ""}`}>
              Join hundreds of clients who walk in as one person and leave as another. Book your appointment today.
            </p>
            <div className={`reveal-up d3 ${ctaVisible ? "in" : ""}`}>
              <Link to="/book" className="btn-dark">
                <span>Book Your Appointment</span>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>→</span>
              </Link>
            </div>
            <div className={`reveal-up d4 ${ctaVisible ? "in" : ""}`} style={{ marginTop: "24px", fontSize: "11px", color: "rgba(6,6,6,0.45)", letterSpacing: "0.05em" }}>
              Or call us · +91 98765 43210
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}